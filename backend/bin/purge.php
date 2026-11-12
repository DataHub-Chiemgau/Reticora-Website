<?php

declare(strict_types=1);

// Stündlicher Cronjob (Spec Ä-10). Aufruf: php bin/purge.php [Pfad/zu/config.php]. Ausgabe nur Anzahlen.
if (PHP_SAPI !== 'cli') {
    exit(1);
}
require __DIR__ . '/../vendor/autoload.php';

use Reticora\Lead\Config;
use Reticora\Lead\Database;
use Reticora\Lead\Purger;

$path = $argv[1] ?? (getenv('RETICORA_CONFIG') ?: __DIR__ . '/../config.php');
try {
    $config = Config::load($path);
    $r = (new Purger(Database::connect($config)))->run(time(), max(1, $config->int('retention_days', 90)));
} catch (Throwable $e) {
    fwrite(STDERR, 'purge fehlgeschlagen: ' . $e::class . "\n");
    exit(1);
}
echo gmdate('c') . " purge leads_deleted={$r['leads_deleted']} rate_limit_deleted={$r['rate_limit_deleted']} undelivered={$r['undelivered']} key_rotated={$r['key_rotated']}\n";
