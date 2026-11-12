<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;

/** Löschlauf (bin/purge.php): Leads nach Frist, Rate-Limit-Einträge nach 24 h. Liefert nur Anzahlen. */
final class Purger
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return array{leads_deleted:int, rate_limit_deleted:int, undelivered:int} */
    public function run(int $now, int $retentionDays): array
    {
        $stmt = $this->pdo->prepare('DELETE FROM lead WHERE created_at < :cutoff');
        $stmt->execute([':cutoff' => gmdate('Y-m-d H:i:s', $now - $retentionDays * 86400)]);
        $leads = $stmt->rowCount();

        $stmt = $this->pdo->prepare('DELETE FROM rate_limit WHERE window_start < :cutoff');
        $stmt->execute([':cutoff' => $now - 86400]);
        $rate = $stmt->rowCount();

        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM lead WHERE delivery <> :ok');
        $stmt->execute([':ok' => LeadRepository::DELIVERED]);

        return ['leads_deleted' => $leads, 'rate_limit_deleted' => $rate, 'undelivered' => (int) $stmt->fetchColumn()];
    }
}
