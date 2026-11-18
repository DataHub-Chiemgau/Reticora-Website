<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Zufälliger HMAC-Schlüssel des Rate-Limits (Spec Ä-10, Ä-36). Liegt in der Tabelle rate_limit_key (eine Zeile) und wird
 * beim ersten Gebrauch eines neuen Stundenfensters (RateLimiter::windowStart) überschrieben: jeder Aufruf des Endpunkts und
 * purge.php (stündlich). Der alte Schlüssel ist danach weg; Hashes eines Fensters lassen sich nur nachrechnen, solange ihre
 * Zähler ohnehin gelten (DS-03), und ein Backup enthält höchstens die Zähler zum Schlüssel seines Fensters.
 */
final class RateLimitKey
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** Schlüssel des laufenden Stundenfensters (32 Byte, binär). */
    public function current(int $now): string
    {
        return $this->ensure($now)[0];
    }

    /** Überschreibt den Schlüssel, wenn er nicht aus dem laufenden Stundenfenster stammt. Liefert true, wenn neu erzeugt. */
    public function rotateIfStale(int $now): bool
    {
        return $this->ensure($now)[1];
    }

    /** @return array{string,bool} */
    private function ensure(int $now): array
    {
        $window = RateLimiter::windowStart($now);
        $row = $this->read();
        if ($row !== null && $row['window_start'] === $window) {
            return [$this->decode($row['secret']), false];
        }
        $fresh = bin2hex(random_bytes(32));
        if ($row === null) {
            try {
                $this->pdo->prepare('INSERT INTO rate_limit_key (id, window_start, secret) VALUES (1, :w, :s)')->execute([':w' => $window, ':s' => $fresh]);
            } catch (PDOException $e) {
                if ((string) $e->getCode() !== '23000') {
                    throw $e; // nur „gleichzeitige Anfrage war schneller“ ist harmlos
                }
            }
        } else {
            // Nur überschreiben, wenn noch das alte Fenster drinsteht (gleichzeitige Anfragen erzeugen keinen zweiten Wechsel).
            $this->pdo->prepare('UPDATE rate_limit_key SET window_start = :w, secret = :s WHERE id = 1 AND window_start = :old')
                ->execute([':w' => $window, ':s' => $fresh, ':old' => $row['window_start']]);
        }
        $row = $this->read();
        if ($row === null || $row['window_start'] !== $window) {
            throw new RuntimeException('Rate-Limit-Schlüssel nicht schreibbar'); // geschlossen scheitern
        }
        return [$this->decode($row['secret']), $row['secret'] === $fresh];
    }

    /** @return array{window_start:int,secret:string}|null */
    private function read(): ?array
    {
        $row = $this->pdo->query('SELECT window_start, secret FROM rate_limit_key WHERE id = 1')->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? ['window_start' => (int) $row['window_start'], 'secret' => (string) $row['secret']] : null;
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
