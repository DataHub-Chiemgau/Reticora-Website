<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;

/**
 * Löschlauf (bin/purge.php, stündlich per Cron): Leads nach Frist, Rate-Limit-Zähler aus abgelaufenen Stundenfenstern,
 * Rate-Limit-Schlüssel einmal je UTC-Tag überschreiben (Spec Ä-10). Liefert nur Anzahlen.
 */
final class Purger
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return array{leads_deleted:int, rate_limit_deleted:int, undelivered:int, key_rotated:int} */
    public function run(int $now, int $retentionDays): array
    {
        $stmt = $this->pdo->prepare('DELETE FROM lead WHERE created_at < :cutoff');
        $stmt->execute([':cutoff' => gmdate('Y-m-d H:i:s', $now - $retentionDays * 86400)]);
        $leads = $stmt->rowCount();

        $rate = (new RateLimiter($this->pdo))->purgeExpired($now);
        $rotated = (new RateLimitKey($this->pdo))->rotateIfStale($now) ? 1 : 0;

        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM lead WHERE delivery <> :ok');
        $stmt->execute([':ok' => LeadRepository::DELIVERED]);

        return ['leads_deleted' => $leads, 'rate_limit_deleted' => $rate, 'undelivered' => (int) $stmt->fetchColumn(), 'key_rotated' => $rotated];
    }
}
