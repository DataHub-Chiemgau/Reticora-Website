<?php

declare(strict_types=1);

// Einziger über das Web erreichbarer Teil des Backends. Nur Verdrahtung, Logik steht in src/App.php.

use Reticora\Lead\App;
use Reticora\Lead\Config;
use Reticora\Lead\ContactPage;
use Reticora\Lead\Database;
use Reticora\Lead\FileTransport;
use Reticora\Lead\MailTransport;
use Reticora\Lead\PhpMailerTransport;
use Reticora\Lead\Request;
use Reticora\Lead\Responder;
use Reticora\Lead\Response;

ini_set('display_errors', '0');
ini_set('html_errors', '0');
ini_set('log_errors', '1');

// Verzeichnis mit vendor/, src/, templates/ und config.php: RETICORA_HOME oder ../../reticora (neben dem Webroot).
// Kein Rückgriff auf ../ : Im Betrieb wäre das das Webroot.
$home = getenv('RETICORA_HOME') ?: null;
if ($home === null && is_file(__DIR__ . '/../../reticora/vendor/autoload.php')) {
    $home = __DIR__ . '/../../reticora';
}
if ($home === null || !is_file($home . '/vendor/autoload.php')) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Server error\n");
}
require $home . '/vendor/autoload.php';

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

// Erst in App::handle() aufgerufen: eine Fehlkonfiguration ergibt dort das allgemeine 500 (nie einen nackten PHP-Fehler).
$transportFactory = static function () use ($config): MailTransport {
    if ($config->string('mail.transport', 'smtp') === 'file') {
        // Nur lokale Tests: schreibt Personendaten in eine Datei.
        if ($config->get('mail.allow_insecure') !== true) {
            throw new InvalidArgumentException("mail.transport 'file' nur mit mail.allow_insecure");
        }
        return new FileTransport($config->string('mail.file_path'));
    }
    return PhpMailerTransport::fromConfig($config);
};
$pdoFactory = static fn (): \PDO => Database::connect($config);
$templates = new ContactPage($config->string('templates_dir') ?: $home . '/templates');

$app = new App($config, $pdoFactory, $transportFactory, static fn (): int => time(), $log, $templates);
Responder::emit($app->handle(Request::fromGlobals()));
