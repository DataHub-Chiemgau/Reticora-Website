<?php

declare(strict_types=1);

// NUR Integrationstest (compose.yaml, scripts/integration-local.sh). Kein Wert hier ist ein Geheimnis:
// Passwörter liest die Datei aus den beim Start erzeugten Dateien (docker/web/gen-secrets.sh), alles andere aus der Umgebung.
// Der Start des Containers schreibt das Ergebnis als festes Array nach config.php (wie auf dem Hosting), siehe entrypoint.sh.

$env = static function (string $name, string $default = ''): string {
    $v = getenv($name);
    return is_string($v) && $v !== '' ? $v : $default;
};
$secret = static function (string $name) use ($env): string {
    $file = $env($name . '_FILE');
    if ($file !== '') {
        $v = @file_get_contents($file);
        if ($v === false) {
            throw new RuntimeException("$name: Datei nicht lesbar");
        }
        return trim($v);
    }
    $v = $env($name);
    if ($v === '') {
        throw new RuntimeException("$name oder {$name}_FILE fehlt");
    }
    return $v;
};

return [
    'site_url' => $env('RETICORA_SITE_URL', 'http://127.0.0.1:8088'),
    'contact_email' => 'kontakt@example.com',
    'retention_days' => 90,
    // Die Browser-Tests kommen alle von derselben Adresse; das Limit selbst prüfen die Backend-Integrationstests.
    'rate_limit' => ['max' => (int) $env('RETICORA_RATE_MAX', '100'), 'global_max' => (int) $env('RETICORA_GLOBAL_MAX', '1000')],
    'db' => [
        'dsn' => $env('RETICORA_IT_DB_DSN', 'mysql:host=db;dbname=reticora;charset=utf8mb4'),
        'user' => $env('RETICORA_IT_DB_USER', 'reticora'),
        'pass' => $secret('RETICORA_IT_DB_PASS'),
    ],
    'mail' => [
        'transport' => 'smtp',
        'host' => $env('RETICORA_IT_SMTP_HOST', 'mail'),
        'port' => (int) $env('RETICORA_IT_SMTP_PORT', '1025'),
        'encryption' => $env('RETICORA_IT_SMTP_ENCRYPTION', 'starttls'),
        'user' => $env('RETICORA_IT_SMTP_USER', 'reticora-it'),
        'pass' => $secret('RETICORA_IT_SMTP_PASS'),
        'helo_name' => 'web.integration.test',
        'timeout' => 10,
        'deadline' => 15,
        'from_address' => 'versand@example.com',
        'from_name' => 'Reticora Website',
        'to_address' => $env('RETICORA_IT_SALES', 'vertrieb@example.com'),
    ],
    // Leer: Ereignisse gehen über error_log() ins Fehlerprotokoll von Apache bzw. des PHP-Servers (docker compose logs).
    'log_path' => '',
];
