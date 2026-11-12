<?php

declare(strict_types=1);

// Aufruf: php bin/migrate.php [Pfad/zu/config.php]   (Standard: ../config.php bzw. $RETICORA_CONFIG)
if (PHP_SAPI !== 'cli') {
    exit(1);
}
require __DIR__ . '/../src/autoload.php';

use Reticora\Lead\Config;
use Reticora\Lead\Database;

$path = $argv[1] ?? (getenv('RETICORA_CONFIG') ?: __DIR__ . '/../config.php');
try {
    Database::migrate(Database::connect(Config::load($path)), __DIR__ . '/../sql');
} catch (Throwable $e) {
    fwrite(STDERR, 'migrate fehlgeschlagen: ' . $e::class . "\n");
    exit(1);
}
echo "migrate ok\n";
