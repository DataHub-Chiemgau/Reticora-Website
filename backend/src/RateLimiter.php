<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Drei Grenzen je festem Stundenfenster (Spec §6.2, Ä-07, Ä-10):
 * - je Herkunft höchstens `limit` gültige Anfragen. Herkunft ist die IPv4-Adresse oder das /64-Präfix einer IPv6-Adresse.
 * - je IPv6-/48-Präfix höchstens 3 × `limit` (Heimanschlüsse bekommen oft ein /56 oder /48 und damit viele /64-Netze).
 *   Gespeichert wird nur HMAC(Herkunft, zufälliger Tagesschlüssel aus RateLimitKey), nie die Adresse selbst.
 * - insgesamt `globalLimit` gültige Anfragen werden normal zugestellt; darüber werden sie nur gespeichert (held), und erst
 *   bei 10 × `globalLimit` ist Schluss (Zeile mit dem festen Schlüssel 'global').
 * Ungültige Eingaben zählen nicht. Abgelaufene Fenster löscht purgeExpired() bei jedem Aufruf des Endpunkts und purge.php.
 */
final class RateLimiter
{
    public const LIMIT = 5;
    public const GLOBAL_LIMIT = 60;
    public const WINDOW = 3600;
    public const GLOBAL_KEY = 'global';
    public const PREFIX_FACTOR = 3;
    public const HARD_FACTOR = 10;
    public const OK = 'ok';
    public const HELD = 'held';
    public const REJECTED = 'rejected';

    public function __construct(
        private readonly PDO $pdo,
        private readonly int $limit = self::LIMIT,
        private readonly int $globalLimit = self::GLOBAL_LIMIT,
    ) {
    }

    /**
     * Herkunft einer Adresse: IPv4 unverändert, IPv4-gemappte IPv6 (::ffff:a.b.c.d) als IPv4,
     * sonst IPv6 auf das /64-Präfix gekürzt (z. B. "2001:db8:1:2::/64"). Unlesbares bleibt, wie es ist.
     */
    public static function origin(string $ip): string
    {
        $bin = @inet_pton(trim($ip));
        if ($bin === false) {
            return $ip;
        }
        if (strlen($bin) === 4) {
            return (string) inet_ntop($bin);
        }
        if (str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff")) {
            return (string) inet_ntop(substr($bin, 12));
        }
        return inet_ntop(substr($bin, 0, 8) . str_repeat("\0", 8)) . '/64';
    }

    public function hash(string $ip, int $now): string
    {
        return hash_hmac('sha256', self::origin($ip), (new RateLimitKey($this->pdo))->current($now));
    }

    /** Löscht alle Zähler aus abgelaufenen Fenstern. Liefert die Anzahl. */
    public function purgeExpired(int $now): int
    {
        $stmt = $this->pdo->prepare('DELETE FROM rate_limit WHERE window_start < :w');
        $stmt->execute([':w' => self::windowStart($now)]);
        return $stmt->rowCount();
    }

    /**
     * IPv6-/48-Präfix (z. B. "2001:db8:1::/48"); null für IPv4, IPv4-gemappte und unlesbare Adressen.
     */
    public static function prefix48(string $ip): ?string
    {
        $bin = @inet_pton(trim($ip));
        if ($bin === false || strlen($bin) !== 16 || str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff")) {
            return null;
        }
        return inet_ntop(substr($bin, 0, 6) . str_repeat("\0", 10)) . '/48';
    }

    /** Ist diese Herkunft schon über ihrer Grenze? Nur lesend; zählt nichts. @return array{bool,int} [gesperrt, Sekunden bis zum Fensterende] */
    public function blocked(string $ip, int $now): array
    {
        $blocked = $this->peek($this->hash($ip, $now), $now) >= max(1, $this->limit);
        $p = self::prefix48($ip);
        if ($p !== null && $this->peek($this->hashOf($p, $now), $now) >= max(1, $this->limit) * self::PREFIX_FACTOR) {
            $blocked = true;
        }
        return [$blocked, $this->retryAfter($now)];
    }

    /** Zählt eine gültige Anfrage dieser Herkunft (/64 bzw. IPv4 und /48). @return array{bool,int} [erlaubt, Sekunden bis zum Fensterende] */
    public function hit(string $ip, int $now): array
    {
        $ok = $this->count($this->hash($ip, $now), $now) <= max(1, $this->limit);
        $p = self::prefix48($ip);
        if ($p !== null && $this->count($this->hashOf($p, $now), $now) > max(1, $this->limit) * self::PREFIX_FACTOR) {
            $ok = false;
        }
        return [$ok, $this->retryAfter($now)];
    }

    /**
     * Zählt eine gültige Anfrage gegen die Obergrenze für alle.
     * OK bis `globalLimit`, HELD bis 10 × `globalLimit` (speichern, nicht mailen), darüber REJECTED.
     * @return array{string,int} [Zustand, Sekunden bis zum Fensterende]
     */
    public function hitGlobal(int $now): array
    {
        $n = $this->count(self::GLOBAL_KEY, $now);
        $soft = max(1, $this->globalLimit);
        $state = $n <= $soft ? self::OK : ($n <= $soft * self::HARD_FACTOR ? self::HELD : self::REJECTED);
        return [$state, $this->retryAfter($now)];
    }

    private function hashOf(string $origin, int $now): string
    {
        return hash_hmac('sha256', $origin, (new RateLimitKey($this->pdo))->current($now));
    }

    private function retryAfter(int $now): int
    {
        return max(1, self::windowStart($now) + self::WINDOW - $now);
    }

    public static function windowStart(int $now): int
    {
        return intdiv($now, self::WINDOW) * self::WINDOW;
    }

    private function peek(string $key, int $now): int
    {
        $sel = $this->pdo->prepare('SELECT counter FROM rate_limit WHERE hash = :h AND window_start = :w');
        $sel->execute([':h' => $key, ':w' => self::windowStart($now)]);
        $value = $sel->fetchColumn();
        return $value === false ? 0 : (int) $value;
    }

    private function count(string $key, int $now): int
    {
        $window = self::windowStart($now);
        $stmt = $this->pdo->prepare('UPDATE rate_limit SET counter = counter + 1 WHERE hash = :h AND window_start = :w');
        $stmt->execute([':h' => $key, ':w' => $window]);
        if ($stmt->rowCount() === 0) {
            try {
                $this->pdo->prepare('INSERT INTO rate_limit (hash, window_start, counter) VALUES (:h, :w, 1)')->execute([':h' => $key, ':w' => $window]);
            } catch (PDOException $e) {
                // Nur ein Schlüsselkonflikt (gleichzeitige Anfrage war schneller) wird behandelt, alles andere bricht ab.
                if ((string) $e->getCode() !== '23000') {
                    throw $e;
                }
                $stmt->execute([':h' => $key, ':w' => $window]);
                if ($stmt->rowCount() === 0) {
                    throw new RuntimeException('Zähler nicht schreibbar');
                }
            }
        }
        $sel = $this->pdo->prepare('SELECT counter FROM rate_limit WHERE hash = :h AND window_start = :w');
        $sel->execute([':h' => $key, ':w' => $window]);
        $value = $sel->fetchColumn();
        if ($value === false) {
            throw new RuntimeException('Zähler nicht lesbar'); // geschlossen scheitern, nie erlauben
        }
        return (int) $value;
    }
}
