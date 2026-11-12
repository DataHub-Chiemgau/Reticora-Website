<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PDO;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\Database;
use Reticora\Lead\LeadRepository;
use Reticora\Lead\Purger;
use Reticora\Lead\RateLimitKey;

final class PurgerTest extends TestCase
{
    private const NOW = 1_800_000_000; // Beginn eines Stundenfensters

    private function pdo(): PDO
    {
        $pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        Database::migrate($pdo, __DIR__ . '/../sql');
        return $pdo;
    }

    public function testDeletesAfterRetentionAndExpiredRateLimitWindowsAndReportsOnlyCounts(): void
    {
        $pdo = $this->pdo();
        $now = self::NOW + 1800;
        $repo = new LeadRepository($pdo);
        $lead = ['lang' => 'de', 'name' => 'Erika Beispiel', 'email' => 'erika@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''];
        $old = $repo->insert($lead, $now - 91 * 86400);
        $edge = $repo->insert($lead, $now - 89 * 86400);
        $fresh = $repo->insert($lead, $now - 100);
        $repo->setDelivery($old, LeadRepository::DELIVERED);
        $repo->setDelivery($edge, LeadRepository::NOT_DELIVERED);
        $repo->setDelivery($fresh, LeadRepository::DELIVERED);
        // abgelaufen: Fenster vor einer Stunde und älter; laufend: aktuelles Fenster
        $pdo->exec("INSERT INTO rate_limit VALUES ('aa', " . (self::NOW - 90000) . ", 3), ('bb', " . (self::NOW - 3600) . ", 1), ('cc', " . self::NOW . ", 1), ('global', " . self::NOW . ', 2)');

        $result = (new Purger($pdo))->run($now, 90);

        self::assertSame(['leads_deleted' => 1, 'rate_limit_deleted' => 2, 'undelivered' => 1, 'key_rotated' => 1], $result);
        self::assertNull($repo->find($old));
        self::assertNotNull($repo->find($edge));
        self::assertSame(['cc', 'global'], $pdo->query('SELECT hash FROM rate_limit ORDER BY hash')->fetchAll(PDO::FETCH_COLUMN));
        self::assertSame([], array_filter($result, fn ($v) => !is_int($v)));
    }

    public function testPurgeOverwritesTheKeyOncePerDayEvenWithoutTraffic(): void
    {
        $pdo = $this->pdo();
        $key = new RateLimitKey($pdo);
        $first = $key->current(self::NOW);
        self::assertSame(32, strlen($first));
        self::assertSame(0, (new Purger($pdo))->run(self::NOW + 3600, 90)['key_rotated']);
        self::assertSame($first, $key->current(self::NOW + 3600));
        self::assertSame(1, (new Purger($pdo))->run(self::NOW + 86400, 90)['key_rotated']);
        $stored = $pdo->query('SELECT * FROM rate_limit_key')->fetchAll(PDO::FETCH_ASSOC);
        self::assertCount(1, $stored);
        self::assertNotSame(bin2hex($first), $stored[0]['secret']);
        self::assertSame(gmdate('Y-m-d', self::NOW + 86400), $stored[0]['day']);
    }

    public function testKeysAreRandomPerInstallation(): void
    {
        self::assertNotSame((new RateLimitKey($this->pdo()))->current(self::NOW), (new RateLimitKey($this->pdo()))->current(self::NOW));
    }

    public function testPurgeScriptOutputContainsOnlyCounts(): void
    {
        $dir = sys_get_temp_dir() . '/reticora-purge-' . bin2hex(random_bytes(4));
        mkdir($dir);
        $db = $dir . '/t.sqlite';
        $cfg = $dir . '/config.php';
        file_put_contents($cfg, "<?php return " . var_export([
            'site_url' => 'https://www.example.com', 'contact_email' => 'k@example.com',
            'retention_days' => 30, 'db' => ['dsn' => 'sqlite:' . $db], 'mail' => [],
        ], true) . ";");
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        Database::migrate($pdo, __DIR__ . '/../sql');
        (new LeadRepository($pdo))->insert(['lang' => 'de', 'name' => 'GEHEIM', 'email' => 'g@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''], time() - 40 * 86400);
        $pdo->exec("INSERT INTO rate_limit VALUES ('aa', " . (time() - 7200) . ', 3)');
        $out = shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/../bin/purge.php') . ' ' . escapeshellarg($cfg) . ' 2>&1');
        self::assertMatchesRegularExpression('/purge leads_deleted=1 rate_limit_deleted=1 undelivered=0 key_rotated=1\s*$/', (string) $out);
        self::assertStringNotContainsString('GEHEIM', (string) $out);
        array_map('unlink', glob($dir . '/*'));
        rmdir($dir);
    }
}
