<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PDO;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\Database;
use Reticora\Lead\LeadRepository;
use Reticora\Lead\Purger;

final class PurgerTest extends TestCase
{
    public function testDeletesAfterRetentionAndRateLimitAfter24hAndReportsOnlyCounts(): void
    {
        $pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        Database::migrate($pdo, __DIR__ . '/../sql');
        $now = 1_800_000_000;
        $repo = new LeadRepository($pdo);
        $lead = ['lang' => 'de', 'name' => 'Erika Beispiel', 'email' => 'erika@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''];
        $old = $repo->insert($lead, $now - 91 * 86400);
        $edge = $repo->insert($lead, $now - 89 * 86400);
        $fresh = $repo->insert($lead, $now - 100);
        $repo->setDelivery($old, LeadRepository::DELIVERED);
        $repo->setDelivery($edge, LeadRepository::NOT_DELIVERED);
        $repo->setDelivery($fresh, LeadRepository::DELIVERED);
        $pdo->exec("INSERT INTO rate_limit VALUES ('aa', " . ($now - 90000) . ", 3), ('bb', " . ($now - 100) . ", 1)");

        $result = (new Purger($pdo))->run($now, 90);

        self::assertSame(['leads_deleted' => 1, 'rate_limit_deleted' => 1, 'undelivered' => 1], $result);
        self::assertNull($repo->find($old));
        self::assertNotNull($repo->find($edge));
        self::assertSame(1, (int) $pdo->query('SELECT COUNT(*) FROM rate_limit')->fetchColumn());
        // Ergebnis enthält nur ganze Zahlen, keine Personendaten.
        self::assertSame([], array_filter($result, fn ($v) => !is_int($v)));
    }

    public function testPurgeScriptOutputContainsOnlyCounts(): void
    {
        $dir = sys_get_temp_dir() . '/reticora-purge-' . bin2hex(random_bytes(4));
        mkdir($dir);
        $db = $dir . '/t.sqlite';
        $cfg = $dir . '/config.php';
        file_put_contents($cfg, "<?php return " . var_export([
            'site_url' => 'https://www.example.com', 'contact_email' => 'k@example.com', 'secret' => str_repeat('s', 40),
            'retention_days' => 30, 'db' => ['dsn' => 'sqlite:' . $db], 'mail' => [],
        ], true) . ";");
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        Database::migrate($pdo, __DIR__ . '/../sql');
        (new LeadRepository($pdo))->insert(['lang' => 'de', 'name' => 'GEHEIM', 'email' => 'g@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''], time() - 40 * 86400);
        $out = shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/../bin/purge.php') . ' ' . escapeshellarg($cfg) . ' 2>&1');
        self::assertMatchesRegularExpression('/purge leads_deleted=1 rate_limit_deleted=0 undelivered=0\s*$/', (string) $out);
        self::assertStringNotContainsString('GEHEIM', (string) $out);
        array_map('unlink', glob($dir . '/*'));
        rmdir($dir);
    }
}
