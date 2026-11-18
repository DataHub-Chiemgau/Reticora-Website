<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use PDO;
use Reticora\Lead\Database;
use Reticora\Lead\LeadRepository;

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
