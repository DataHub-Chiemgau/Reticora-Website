<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Zwei Grenzen je festem Stundenfenster (Spec §6.2, Ä-07, Ä-10):
 * - je Herkunft höchstens `limit` Anfragen. Herkunft ist die IPv4-Adresse oder das /64-Präfix einer IPv6-Adresse.
 *   Gespeichert wird nur HMAC(Herkunft, zufälliger Tagesschlüssel aus RateLimitKey), nie die Adresse selbst.
 * - insgesamt höchstens `globalLimit` angenommene Anfragen (Zeile mit dem festen Schlüssel 'global').
 * Abgelaufene Fenster löscht purgeExpired() bei jedem Aufruf des Endpunkts und purge.php.
 */
final class RateLimiter
{
    public const LIMIT = 5;
    public const GLOBAL_LIMIT = 60;
    public const WINDOW = 3600;
    public const GLOBAL_KEY = 'global';

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

    /** Zählt die Anfrage dieser Herkunft. @return array{bool,int} [erlaubt, Sekunden bis zum Fensterende] */
    public function hit(string $ip, int $now): array
    {
        return $this->count($this->hash($ip, $now), $now, $this->limit);
    }

    /** Zählt eine angenommene Anfrage gegen die Obergrenze für alle. @return array{bool,int} */
    public function hitGlobal(int $now): array
    {
        return $this->count(self::GLOBAL_KEY, $now, $this->globalLimit);
    }

    public static function windowStart(int $now): int
    {
        return intdiv($now, self::WINDOW) * self::WINDOW;
    }

    /** @return array{bool,int} */
    private function count(string $key, int $now, int $limit): array
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
        return [(int) $value <= max(1, $limit), max(1, $window + self::WINDOW - $now)];
    }
}
