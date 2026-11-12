<?php

declare(strict_types=1);

// Stündlicher Cronjob (Spec Ä-10). Aufruf: php bin/purge.php [Pfad/zu/config.php]. Ausgabe nur Anzahlen.
// Exit 1, solange Anfragen mit Status held oder not_delivered vorhanden sind: Der Cron des Hosters mailt dann die Ausgabe an den
// Betreiber. Diese Anfragen werden nie gelöscht, bevor sie zugestellt sind (bin/retry.php) oder von Hand erledigt wurden.
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
echo gmdate('c') . " purge leads_deleted={$r['leads_deleted']} rate_limit_deleted={$r['rate_limit_deleted']} undelivered={$r['undelivered']} held={$r['held']} not_delivered={$r['not_delivered']} key_rotated={$r['key_rotated']}\n";
if ($r['undelivered'] > 0) {
    fwrite(STDERR, "ACHTUNG: {$r['undelivered']} Anfragen sind nicht zugestellt (held={$r['held']}, not_delivered={$r['not_delivered']}). bin/retry.php ausführen oder in der Datenbank prüfen.\n");
    exit(1);
}
