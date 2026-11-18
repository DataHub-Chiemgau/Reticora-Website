<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use PDO;
use Reticora\Lead\LeadRepository;
use Reticora\Lead\RateLimiter;

/** bin/purge.php auf MariaDB: löscht nur alte zugestellte Anfragen und abgelaufene Zähler, Exit-Codes, nur Anzahlen. */
final class PurgeTest extends IntegrationTestCase
{
    public function testDeletesOnlyOldDeliveredLeadsAndExpiredRateRows(): void
    {
        $now = time();
        $repo = new LeadRepository($this->pdo);
        $lead = ['lang' => 'de', 'name' => 'Größe 🚀', 'email' => 'purge@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => 'Geheim'];
        $ids = [];
        foreach ([
            'old_delivered' => [91, LeadRepository::DELIVERED],
            'old_pending' => [91, LeadRepository::PENDING],
            'old_not_delivered' => [200, LeadRepository::NOT_DELIVERED],
            'old_held' => [120, LeadRepository::HELD],
            'edge_delivered' => [89, LeadRepository::DELIVERED],
            'fresh_delivered' => [0, LeadRepository::DELIVERED],
        ] as $name => [$days, $status]) {
            $ids[$name] = $repo->insert($lead, $now - $days * 86400 - 60);
            $repo->setDelivery($ids[$name], $status);
        }
        $current = RateLimiter::windowStart($now);
        $this->pdo->exec(sprintf(
            "INSERT INTO rate_limit (hash, window_start, counter) VALUES ('%s', %d, 3), ('%s', %d, 1), ('%s', %d, 2), ('global', %d, 4), ('global', %d, 7)",
            str_repeat('a', 64), $current - 86400, str_repeat('b', 64), $current - 3600, str_repeat('c', 64), $current, $current, $current - 3600,
        ));

        $config = $this->configFile($this->configArray(['retention_days' => 90]));
        [$code, $out, $err] = $this->runBin('purge', $config);

        self::assertSame(1, $code, 'not_delivered, held und hängengebliebenes pending vorhanden');
        self::assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T[\d:]+\+00:00 purge leads_deleted=1 rate_limit_deleted=3 logs_deleted=0 undelivered=3 held=1 not_delivered=1 pending=1 key_rotated=1\n$/', $out);
        self::assertStringNotContainsString('Geheim', $out . $err);
        self::assertStringNotContainsString('purge@example.com', $out . $err);
        $left = array_map('intval', array_column($this->leads(), 'id'));
        // DS-05: das alte pending ist hängengeblieben und bleibt (gemeldet), bis es zugestellt oder von Hand erledigt ist.
        self::assertSame([$ids['old_pending'], $ids['old_not_delivered'], $ids['old_held'], $ids['edge_delivered'], $ids['fresh_delivered']], $left);
        self::assertSame(
            [[str_repeat('c', 64), $current], ['global', $current]],
            array_map(static fn (array $r): array => [$r['hash'], (int) $r['window_start']], $this->pdo->query('SELECT hash, window_start FROM rate_limit ORDER BY hash')->fetchAll(PDO::FETCH_ASSOC)),
        );

        // nach Erledigung von Hand: auch die alten Fälle werden gelöscht, Exit-Code 0
        $this->pdo->exec("UPDATE lead SET delivery = 'delivered'");
        [$code, $out] = $this->runBin('purge', $config);
        self::assertSame(0, $code);
        self::assertStringContainsString(' purge leads_deleted=3 rate_limit_deleted=0 logs_deleted=0 undelivered=0 held=0 not_delivered=0 pending=0 key_rotated=0', $out);
        self::assertSame([$ids['edge_delivered'], $ids['fresh_delivered']], array_map('intval', array_column($this->leads(), 'id')));
    }

    public function testStalePendingIsDeliveredByRetryAndFreshPendingIsLeftAlone(): void
    {
        // DS-05: Abbruch zwischen Speichern und Zustellstatus; retry.php stellt nach 15 Minuten zu.
        $repo = new LeadRepository($this->pdo);
        $lead = ['lang' => 'de', 'name' => 'Hängengeblieben', 'email' => 'pending@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''];
        $stale = $repo->insert($lead, time() - 3600);
        $fresh = $repo->insert(['name' => 'Läuft noch'] + $lead, time() - 60);
        [$code, $out, $err] = $this->runBin('retry', $this->configFile($this->configArray()));
        self::assertSame(0, $code, $err);
        self::assertStringEndsWith(" retry sent=1 failed=0 remaining=0\n", $out);
        self::assertSame(LeadRepository::DELIVERED, $repo->find($stale)['delivery'] ?? null);
        self::assertSame(LeadRepository::PENDING, $repo->find($fresh)['delivery'] ?? null);
        self::assertCount(1, $this->mails());
    }

    public function testBrokenDatabaseAccessExitsOneWithoutDetails(): void
    {
        $config = $this->configFile($this->configArray(['db' => ['dsn' => self::env('RETICORA_IT_DB_DSN'), 'user' => self::env('RETICORA_IT_DB_USER'), 'pass' => 'falsch']]));
        [$code, $out, $err] = $this->runBin('purge', $config);
        self::assertSame(1, $code);
        self::assertSame('', $out);
        self::assertSame("purge fehlgeschlagen: PDOException\n", $err);
    }
}
