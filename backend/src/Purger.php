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

    /** @return array{leads_deleted:int, rate_limit_deleted:int, undelivered:int, held:int, not_delivered:int, key_rotated:int} */
    public function run(int $now, int $retentionDays): array
    {
        // Nicht zugestellte und zurückgehaltene Anfragen bleiben, bis sie zugestellt sind (bin/retry.php) oder von Hand erledigt wurden.
        $stmt = $this->pdo->prepare('DELETE FROM lead WHERE created_at < :cutoff AND delivery NOT IN (:a, :b)');
        $stmt->execute([':cutoff' => gmdate('Y-m-d H:i:s', $now - $retentionDays * 86400), ':a' => LeadRepository::NOT_DELIVERED, ':b' => LeadRepository::HELD]);
        $leads = $stmt->rowCount();

        $rate = (new RateLimiter($this->pdo))->purgeExpired($now);
        $rotated = (new RateLimitKey($this->pdo))->rotateIfStale($now) ? 1 : 0;

        $count = function (string $status): int {
            $q = $this->pdo->prepare('SELECT COUNT(*) FROM lead WHERE delivery = :s');
            $q->execute([':s' => $status]);
            return (int) $q->fetchColumn();
        };
        $held = $count(LeadRepository::HELD);
        $notDelivered = $count(LeadRepository::NOT_DELIVERED);

        return [
            'leads_deleted' => $leads,
            'rate_limit_deleted' => $rate,
            'undelivered' => $held + $notDelivered,
            'held' => $held,
            'not_delivered' => $notDelivered,
            'key_rotated' => $rotated,
        ];
    }
}
