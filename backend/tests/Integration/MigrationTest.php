<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use PDO;
use Reticora\Lead\Database;
use Reticora\Lead\LeadRepository;
use Reticora\Lead\RateLimiter;
use Reticora\Lead\RateLimitKey;

/** sql/001_init.sql auf MariaDB: idempotent, utf8mb4 für Formulardaten, ASCII für Hashes. */
final class MigrationTest extends IntegrationTestCase
{
    public function testMigrationIsIdempotentAndKeepsData(): void
    {
        $id = (new LeadRepository($this->pdo))->insert(['lang' => 'de', 'name' => 'Ä', 'email' => 'a@example.com', 'company' => 'Ö', 'topic' => 'demo', 'message' => ''], $this->now);

        Database::migrate($this->pdo, self::SQL);
        Database::migrate($this->pdo, self::SQL);
        $path = $this->configFile($this->configArray());
        foreach ([1, 2] as $_) {
            [$code, $out, $err] = $this->runBin('migrate', $path);
            self::assertSame(0, $code, $err);
            self::assertSame("migrate ok\n", $out);
        }

        self::assertSame('Ä', (new LeadRepository($this->pdo))->find($id)['name'] ?? null);
        self::assertCount(1, $this->leads());
    }

    public function testTableFromTheFirstSchemaGetsTheHourlyKeyColumn(): void
    {
        // DS-03 (Ä-36): eine mit der ersten Fassung (Spalte "day") angelegte Datenbank wird umgestellt, ohne Datenverlust in lead.
        $id = (new LeadRepository($this->pdo))->insert(['lang' => 'de', 'name' => 'Bleibt', 'email' => 'a@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => ''], $this->now);
        $this->pdo->exec('DROP TABLE rate_limit_key');
        $this->pdo->exec('CREATE TABLE rate_limit_key (id TINYINT UNSIGNED NOT NULL PRIMARY KEY, day CHAR(10) NOT NULL, secret CHAR(64) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=ascii');
        $this->pdo->exec("INSERT INTO rate_limit_key VALUES (1, '2027-01-15', '" . str_repeat('ab', 32) . "')");

        [$code, , $err] = $this->runBin('migrate', $this->configFile($this->configArray()));
        self::assertSame(0, $code, $err);
        [$code, , $err] = $this->runBin('migrate', $this->configFile($this->configArray()));
        self::assertSame(0, $code, 'zweimal: idempotent ' . $err);

        $columns = $this->pdo->query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rate_limit_key' ORDER BY ORDINAL_POSITION"
        )->fetchAll(PDO::FETCH_COLUMN);
        self::assertSame(['id', 'window_start', 'secret'], $columns);
        $key = (new RateLimitKey($this->pdo))->current($this->now);
        self::assertNotSame(str_repeat("\xab", 32), $key, 'der alte Tagesschlüssel gilt nicht mehr');
        self::assertSame(RateLimiter::windowStart($this->now), (int) $this->pdo->query('SELECT window_start FROM rate_limit_key')->fetchColumn());
        self::assertSame('Bleibt', (new LeadRepository($this->pdo))->find($id)['name'] ?? null);
    }

    public function testSchemaOnMariaDb(): void
    {
        self::assertSame('mysql', $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
        self::assertStringContainsStringIgnoringCase('mariadb', (string) $this->pdo->query('SELECT VERSION()')->fetchColumn());
        self::assertSame('utf8mb4', $this->pdo->query('SELECT @@character_set_connection')->fetchColumn());

        $tables = $this->pdo->query(
            "SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
        )->fetchAll(PDO::FETCH_ASSOC);
        self::assertSame([
            ['TABLE_NAME' => 'lead', 'ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'utf8mb4_unicode_ci'],
            ['TABLE_NAME' => 'rate_limit', 'ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'ascii_general_ci'],
            ['TABLE_NAME' => 'rate_limit_key', 'ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'ascii_general_ci'],
        ], $tables);

        $charsets = $this->pdo->query(
            "SELECT COLUMN_NAME, CHARACTER_SET_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lead' AND CHARACTER_SET_NAME IS NOT NULL ORDER BY COLUMN_NAME"
        )->fetchAll(PDO::FETCH_KEY_PAIR);
        self::assertSame(array_fill_keys(['company', 'delivery', 'email', 'lang', 'message', 'name', 'topic'], 'utf8mb4'), $charsets);
    }
}
