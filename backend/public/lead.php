<?php

declare(strict_types=1);

// Einziger über das Web erreichbarer Teil des Backends. Nur Verdrahtung, Logik steht in src/App.php.

use Reticora\Lead\App;
use Reticora\Lead\Config;
use Reticora\Lead\Database;
use Reticora\Lead\FileTransport;
use Reticora\Lead\Request;
use Reticora\Lead\Responder;
use Reticora\Lead\Response;
use Reticora\Lead\SmtpTransport;

ini_set('display_errors', '0');
ini_set('html_errors', '0');
ini_set('log_errors', '1');

// Verzeichnis mit src/ und config.php: RETICORA_HOME oder ../../reticora (neben dem Webroot).
// Kein Rückgriff auf ../ : Im Betrieb wäre das das Webroot.
$home = getenv('RETICORA_HOME') ?: null;
if ($home === null && is_file(__DIR__ . '/../../reticora/src/autoload.php')) {
    $home = __DIR__ . '/../../reticora';
}
if ($home === null) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Server error\n");
}
require $home . '/src/autoload.php';

try {
    $config = Config::load((string) (getenv('RETICORA_CONFIG') ?: $home . '/config.php'));
} catch (Throwable) {
    Responder::emit(Response::text(500, 'Server error'));
    exit;
}

$logPath = $config->string('log_path');
if ($logPath !== '') {
    ini_set('error_log', $logPath);
}
$log = static function (string $line) use ($logPath): void {
    // Nur Ereignisnamen und IDs, keine Formularinhalte, keine IP-Adressen.
    $entry = gmdate('c') . ' lead ' . $line . "\n";
    if ($logPath !== '') {
        @file_put_contents($logPath, $entry, FILE_APPEND | LOCK_EX);
    } else {
        error_log(trim($entry));
    }
};

$transport = match ($config->string('mail.transport', 'smtp')) {
    'file' => new FileTransport($config->string('mail.file_path')), // nur lokale Tests
    default => new SmtpTransport(
        $config->string('mail.host'),
        $config->int('mail.port', 465),
        $config->string('mail.encryption', 'ssl'),
        $config->string('mail.user'),
        $config->string('mail.pass'),
        $config->string('mail.helo_name', 'localhost'),
        $config->int('mail.timeout', 10),
        $config->int('mail.deadline', 15),
        $config->get('mail.allow_insecure') === true, // nur für Tests
    ),
};

$pdoFactory = static fn (): \PDO => Database::connect($config);

$app = new App($config, $pdoFactory, $transport, static fn (): int => time(), $log);
Responder::emit($app->handle(Request::fromGlobals()));
