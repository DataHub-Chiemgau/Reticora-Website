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

    /** Spielt das zum Treiber passende Schema ein (idempotent). */
    public static function migrate(PDO $pdo, string $sqlDir): void
    {
        $file = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? '001_init.sqlite.sql' : '001_init.sql';
        $sql = (string) file_get_contents($sqlDir . '/' . $file);
        $sql = preg_replace('/^--.*$/m', '', $sql) ?? $sql;
        foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
            $pdo->exec($statement);
        }
    }
}
