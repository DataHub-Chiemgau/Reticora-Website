<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Zufälliger HMAC-Schlüssel des Rate-Limits (Spec Ä-10). Liegt in der Tabelle rate_limit_key (eine Zeile) und wird
 * beim ersten Gebrauch eines neuen UTC-Tages überschrieben, also mindestens einmal täglich (purge.php stündlich,
 * jeder Aufruf des Endpunkts). Der alte Schlüssel ist danach weg; alte Hashes lassen sich nicht mehr nachrechnen.
 */
final class RateLimitKey
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** Schlüssel des Tages (32 Byte, binär). */
    public function current(int $now): string
    {
        return $this->ensure($now)[0];
    }

    /** Überschreibt den Schlüssel, wenn er nicht vom heutigen UTC-Tag stammt. Liefert true, wenn neu erzeugt. */
    public function rotateIfStale(int $now): bool
    {
        return $this->ensure($now)[1];
    }

    /** @return array{string,bool} */
    private function ensure(int $now): array
    {
        $today = gmdate('Y-m-d', $now);
        $row = $this->read();
        if ($row !== null && $row['day'] === $today) {
            return [$this->decode($row['secret']), false];
        }
        $fresh = bin2hex(random_bytes(32));
        if ($row === null) {
            try {
                $this->pdo->prepare('INSERT INTO rate_limit_key (id, day, secret) VALUES (1, :d, :s)')->execute([':d' => $today, ':s' => $fresh]);
            } catch (PDOException $e) {
                if ((string) $e->getCode() !== '23000') {
                    throw $e; // nur „gleichzeitige Anfrage war schneller“ ist harmlos
                }
            }
        } else {
            // Nur überschreiben, wenn noch der alte Tag drinsteht (gleichzeitige Anfragen erzeugen keinen zweiten Wechsel).
            $this->pdo->prepare('UPDATE rate_limit_key SET day = :d, secret = :s WHERE id = 1 AND day = :old')
                ->execute([':d' => $today, ':s' => $fresh, ':old' => $row['day']]);
        }
        $row = $this->read();
        if ($row === null || $row['day'] !== $today) {
            throw new RuntimeException('Rate-Limit-Schlüssel nicht schreibbar'); // geschlossen scheitern
        }
        return [$this->decode($row['secret']), $row['secret'] === $fresh];
    }

    /** @return array{day:string,secret:string}|null */
    private function read(): ?array
    {
        $row = $this->pdo->query('SELECT day, secret FROM rate_limit_key WHERE id = 1')->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? ['day' => (string) $row['day'], 'secret' => (string) $row['secret']] : null;
    }

    private function decode(string $hex): string
    {
        $bin = preg_match('/^[0-9a-f]{64}$/', $hex) === 1 ? hex2bin($hex) : false;
        if ($bin === false) {
            throw new RuntimeException('Rate-Limit-Schlüssel beschädigt');
        }
        return $bin;
    }
}
