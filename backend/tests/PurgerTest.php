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

        self::assertSame(['leads_deleted' => 1, 'rate_limit_deleted' => 2, 'undelivered' => 1, 'held' => 0, 'not_delivered' => 1, 'key_rotated' => 1], $result);
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
        self::assertMatchesRegularExpression('/purge leads_deleted=1 rate_limit_deleted=1 undelivered=0 held=0 not_delivered=0 key_rotated=1\s*$/', (string) $out);
        self::assertStringNotContainsString('GEHEIM', (string) $out);
        array_map('unlink', glob($dir . '/*'));
        rmdir($dir);
    }

    public function testNeverDeletesHeldOrNotDeliveredLeadsHoweverOld(): void
    {
        $pdo = $this->pdo();
        $repo = new LeadRepository($pdo);
        $lead = ['lang' => 'de', 'name' => 'A', 'email' => 'a@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''];
        $ids = [];
        foreach ([LeadRepository::HELD, LeadRepository::NOT_DELIVERED, LeadRepository::DELIVERED, LeadRepository::PENDING] as $status) {
            $id = $repo->insert($lead, self::NOW - 400 * 86400);
            $repo->setDelivery($id, $status);
            $ids[$status] = $id;
        }
        $result = (new Purger($pdo))->run(self::NOW, 90);
        self::assertNotNull($repo->find($ids[LeadRepository::HELD]));
        self::assertNotNull($repo->find($ids[LeadRepository::NOT_DELIVERED]));
        self::assertNull($repo->find($ids[LeadRepository::DELIVERED]));
        self::assertNull($repo->find($ids[LeadRepository::PENDING]));
        self::assertSame(2, $result['leads_deleted']);
        self::assertSame(['undelivered' => 2, 'held' => 1, 'not_delivered' => 1], array_intersect_key($result, array_flip(['undelivered', 'held', 'not_delivered'])));
        // Sind sie zugestellt, gelten sie wieder als alt und werden gelöscht.
        $repo->setDelivery($ids[LeadRepository::HELD], LeadRepository::DELIVERED);
        $repo->setDelivery($ids[LeadRepository::NOT_DELIVERED], LeadRepository::DELIVERED);
        self::assertSame(2, (new Purger($pdo))->run(self::NOW, 90)['leads_deleted']);
    }

    /** @return array{string,string} [Konfigurationspfad, Datenbankpfad] */
    private function scriptEnv(string $dir): array
    {
        $db = $dir . '/t.sqlite';
        $cfg = $dir . '/config.php';
        file_put_contents($cfg, '<?php return ' . var_export([
            'site_url' => 'https://www.example.com', 'contact_email' => 'k@example.com',
            'retention_days' => 30, 'db' => ['dsn' => 'sqlite:' . $db],
            'mail' => ['transport' => 'file', 'allow_insecure' => true, 'file_path' => $dir . '/mails.jsonl', 'from_address' => 'v@example.com', 'from_name' => 'W', 'to_address' => 'vertrieb@example.com'],
        ], true) . ';');
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        Database::migrate($pdo, __DIR__ . '/../sql');
        return [$cfg, $db];
    }

    /** @return array{int,string} [Exit-Code, Ausgabe] */
    private function runScript(string $script, string ...$args): array
    {
        $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/../bin/' . $script) . ' ' . implode(' ', array_map('escapeshellarg', $args)) . ' 2>&1';
        exec($cmd, $lines, $code);
        return [$code, implode("\n", $lines)];
    }

    private function cleanup(string $dir): void
    {
        array_map('unlink', glob($dir . '/*') ?: []);
        rmdir($dir);
    }

    public function testPurgeScriptExitsWith1WhileUndeliveredLeadsExist(): void
    {
        $dir = sys_get_temp_dir() . '/reticora-purge-' . bin2hex(random_bytes(4));
        mkdir($dir);
        [$cfg, $db] = $this->scriptEnv($dir);
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $repo = new LeadRepository($pdo);
        $id = $repo->insert(['lang' => 'de', 'name' => 'GEHEIM', 'email' => 'g@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''], time() - 400 * 86400);
        $repo->setDelivery($id, LeadRepository::HELD);
        [$code, $out] = $this->runScript('purge.php', $cfg);
        self::assertSame(1, $code);
        self::assertStringContainsString('undelivered=1 held=1 not_delivered=0', $out);
        self::assertStringContainsString('ACHTUNG', $out);
        self::assertStringNotContainsString('GEHEIM', $out);
        self::assertNotNull($repo->find($id));
        $repo->setDelivery($id, LeadRepository::DELIVERED);
        [$code, $out] = $this->runScript('purge.php', $cfg);
        self::assertSame(0, $code, $out);
        $this->cleanup($dir);
    }

    public function testRetryScriptSendsHeldAndNotDeliveredLeadsAndMarksThemDelivered(): void
    {
        $dir = sys_get_temp_dir() . '/reticora-retry-' . bin2hex(random_bytes(4));
        mkdir($dir);
        [$cfg, $db] = $this->scriptEnv($dir);
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $repo = new LeadRepository($pdo);
        $lead = ['lang' => 'de', 'name' => 'Nachgereicht', 'email' => 'n@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => 'Hallo'];
        $a = $repo->insert($lead, self::NOW);
        $b = $repo->insert($lead, self::NOW);
        $c = $repo->insert($lead, self::NOW);
        $ok = $repo->insert($lead, self::NOW);
        $repo->setDelivery($a, LeadRepository::HELD);
        $repo->setDelivery($b, LeadRepository::NOT_DELIVERED);
        $repo->setDelivery($c, LeadRepository::HELD);
        $repo->setDelivery($ok, LeadRepository::DELIVERED);
        [$code, $out] = $this->runScript('retry.php', $cfg, '2');
        self::assertSame(0, $code, $out);
        self::assertStringContainsString('retry sent=2 failed=0 remaining=1', $out);
        self::assertSame('delivered', $repo->find($a)['delivery']);
        self::assertSame('delivered', $repo->find($b)['delivery']);
        self::assertSame('held', $repo->find($c)['delivery'], 'Höchstzahl je Lauf');
        self::assertCount(2, file($dir . '/mails.jsonl'));
        [$code, $out] = $this->runScript('retry.php', $cfg);
        self::assertSame(0, $code, $out);
        self::assertStringContainsString('retry sent=1 failed=0 remaining=0', $out);
        self::assertSame('delivered', $repo->find($c)['delivery']);
        // Nichts mehr zu tun
        [$code, $out] = $this->runScript('retry.php', $cfg);
        self::assertSame(0, $code);
        self::assertStringContainsString('retry sent=0 failed=0 remaining=0', $out);
        self::assertStringNotContainsString('Nachgereicht', $out);
        $this->cleanup($dir);
    }
}
