<?php

declare(strict_types=1);

// Cronjob (z. B. alle 15 Minuten): stellt zurückgehaltene (held) und nicht zugestellte (not_delivered) Anfragen an das
// Vertriebspostfach zu. Aufruf: php bin/retry.php [Pfad/zu/config.php] [Höchstzahl Mails, Standard 20].
// Ausgabe nur Anzahlen. Exit 1 bei Fehler (z. B. SMTP nicht erreichbar), sonst 0.
if (PHP_SAPI !== 'cli') {
    exit(1);
}
require __DIR__ . '/../vendor/autoload.php';

use Reticora\Lead\Config;
use Reticora\Lead\Database;
use Reticora\Lead\Mailer;
use Reticora\Lead\Retrier;
use Reticora\Lead\TransportFactory;

$path = $argv[1] ?? (getenv('RETICORA_CONFIG') ?: __DIR__ . '/../config.php');
$max = isset($argv[2]) && ctype_digit($argv[2]) ? max(1, (int) $argv[2]) : Retrier::DEFAULT_MAX;
try {
    $config = Config::load($path);
    $mailer = new Mailer(TransportFactory::fromConfig($config), $config, static fn (): int => time());
    $r = (new Retrier(Database::connect($config), $mailer))->run($max);
} catch (Throwable $e) {
    fwrite(STDERR, 'retry fehlgeschlagen: ' . $e::class . "\n");
    exit(1);
}
echo gmdate('c') . " retry sent={$r['sent']} failed={$r['failed']} remaining={$r['remaining']}\n";
exit($r['failed'] > 0 ? 1 : 0);
