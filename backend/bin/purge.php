<?php

declare(strict_types=1);

// Stündlicher Cronjob (Spec Ä-10, Ä-36). Aufruf: php bin/purge.php [Pfad/zu/config.php]. Ausgabe nur Anzahlen.
// Löscht zugestellte Anfragen und Tagesprotokolle (lead-, purge-, retry-JJJJ-MM-TT.log neben log_path) nach retention_days.
// Exit 1, solange Anfragen mit Status held oder not_delivered oder seit über 15 Minuten pending vorhanden sind: Der Cron des
// Hosters mailt dann die Ausgabe an den Betreiber. Diese Anfragen werden nie gelöscht, bevor sie zugestellt sind (bin/retry.php)
// oder von Hand erledigt wurden.
if (PHP_SAPI !== 'cli') {
    exit(1);
}
require __DIR__ . '/../vendor/autoload.php';

use Reticora\Lead\Config;
use Reticora\Lead\Database;
use Reticora\Lead\LogFiles;
use Reticora\Lead\Purger;

$path = $argv[1] ?? (getenv('RETICORA_CONFIG') ?: __DIR__ . '/../config.php');
try {
    $config = Config::load($path);
    $now = time();
    $r = (new Purger(Database::connect($config)))->run($now, $config->retentionDays());
    $logs = LogFiles::purge($config->string('log_path'), $now, $config->retentionDays());
} catch (Throwable $e) {
    fwrite(STDERR, 'purge fehlgeschlagen: ' . $e::class . "\n");
    exit(1);
}
echo gmdate('c') . " purge leads_deleted={$r['leads_deleted']} rate_limit_deleted={$r['rate_limit_deleted']} logs_deleted={$logs} undelivered={$r['undelivered']} held={$r['held']} not_delivered={$r['not_delivered']} pending={$r['pending']} key_rotated={$r['key_rotated']}\n";
if ($r['undelivered'] > 0) {
    fwrite(STDERR, "ACHTUNG: {$r['undelivered']} Anfragen sind nicht zugestellt (held={$r['held']}, not_delivered={$r['not_delivered']}, pending={$r['pending']}). bin/retry.php ausführen oder in der Datenbank prüfen.\n");
    exit(1);
}
