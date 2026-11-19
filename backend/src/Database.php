<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;

final class Database
{
    public static function connect(Config $config): PDO
    {
        return new PDO(
            $config->string('db.dsn'),
            $config->string('db.user') ?: null,
            $config->string('db.pass') ?: null,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false],
        );
    }

    /**
     * Spielt alle zum Treiber passenden Schemadateien in Namensreihenfolge ein (jede idempotent): NNN_*.sql für MariaDB,
     * NNN_*.sqlite.sql für SQLite (nur Tests; dort beschreibt 001 immer den aktuellen Stand).
     */
    public static function migrate(PDO $pdo, string $sqlDir): void
    {
        $sqlite = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
        $files = array_values(array_filter(
            glob($sqlDir . '/[0-9][0-9][0-9]_*.sql') ?: [],
            static fn (string $f): bool => str_ends_with($f, '.sqlite.sql') === $sqlite,
        ));
        sort($files, SORT_STRING);
        if ($files === []) {
            throw new \RuntimeException('Keine Schemadateien gefunden');
        }
        foreach ($files as $file) {
            $sql = (string) file_get_contents($file);
            $sql = preg_replace('/^--.*$/m', '', $sql) ?? $sql;
            foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
                $pdo->exec($statement);
            }
        }
    }
}
