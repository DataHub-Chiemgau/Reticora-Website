<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;
use PDOException;

/**
 * Höchstens 5 Anfragen je Herkunft und Stunde (festes Stundenfenster).
 * Gespeichert wird nur HMAC(IP, Tagesschlüssel); der Tagesschlüssel wechselt täglich (UTC),
 * dadurch sind die Hashes über Tage nicht verknüpfbar. Die IP selbst wird nie gespeichert.
 */
final class RateLimiter
{
    public const LIMIT = 5;
    public const WINDOW = 3600;

    /** @param int $limit Anfragen je Stunde; Werte unter 1 fallen auf LIMIT zurück (config: rate_limit.max). */
    public function __construct(private readonly PDO $pdo, private readonly string $secret, private readonly int $limit = self::LIMIT)
    {
    }

    public function dailyHash(string $ip, int $now): string
    {
        $dayKey = hash_hmac('sha256', 'reticora/rate-limit/' . gmdate('Y-m-d', $now), $this->secret, true);
        return hash_hmac('sha256', $ip, $dayKey);
    }

    /** Zählt die Anfrage und liefert [erlaubt, Sekunden bis zum Fensterende]. @return array{bool,int} */
    public function hit(string $ip, int $now): array
    {
        $hash = $this->dailyHash($ip, $now);
        $window = intdiv($now, self::WINDOW) * self::WINDOW;
        $update = 'UPDATE rate_limit SET counter = counter + 1 WHERE hash = :h AND window_start = :w';
        $stmt = $this->pdo->prepare($update);
        $stmt->execute([':h' => $hash, ':w' => $window]);
        if ($stmt->rowCount() === 0) {
            try {
                $ins = $this->pdo->prepare('INSERT INTO rate_limit (hash, window_start, counter) VALUES (:h, :w, 1)');
                $ins->execute([':h' => $hash, ':w' => $window]);
            } catch (PDOException $e) {
                // Nur ein Schlüsselkonflikt (gleichzeitige Anfrage war schneller) wird behandelt, alles andere bricht ab.
                if ((string) $e->getCode() !== '23000') {
                    throw $e;
                }
                $stmt->execute([':h' => $hash, ':w' => $window]);
                if ($stmt->rowCount() === 0) {
                    throw new \RuntimeException('Zähler nicht schreibbar');
                }
            }
        }
        $sel = $this->pdo->prepare('SELECT counter FROM rate_limit WHERE hash = :h AND window_start = :w');
        $sel->execute([':h' => $hash, ':w' => $window]);
        $value = $sel->fetchColumn();
        if ($value === false) {
            throw new \RuntimeException('Zähler nicht lesbar'); // geschlossen scheitern, nie erlauben
        }
        $count = (int) $value;
        return [$count <= ($this->limit >= 1 ? $this->limit : self::LIMIT), max(1, $window + self::WINDOW - $now)];
    }
}
