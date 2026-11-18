<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use PDO;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\App;
use Reticora\Lead\Config;
use Reticora\Lead\ContactPage;
use Reticora\Lead\Database;
use Reticora\Lead\MailTransport;
use Reticora\Lead\RateLimiter;
use Reticora\Lead\Request;
use Reticora\Lead\Response;
use Reticora\Lead\TransportFactory;

/**
 * Integrationstests gegen MariaDB und einen SMTP-Server mit STARTTLS und Anmeldung (Phase 7, README „Zielumgebung“).
 * Laufen nur mit RETICORA_INTEGRATION=1; sonst übersprungen. Konfiguration nur aus der Umgebung:
 *   RETICORA_IT_DB_DSN, RETICORA_IT_DB_USER, RETICORA_IT_DB_PASS bzw. RETICORA_IT_DB_PASS_FILE
 *   RETICORA_IT_SMTP_HOST, RETICORA_IT_SMTP_PORT, RETICORA_IT_SMTP_ENCRYPTION (Standard starttls),
 *   RETICORA_IT_SMTP_USER, RETICORA_IT_SMTP_PASS bzw. RETICORA_IT_SMTP_PASS_FILE,
 *   RETICORA_IT_SMTP_MISMATCH_HOST (optional: Name des Mailservers, der nicht im Zertifikat steht)
 *   RETICORA_IT_MAILPIT_URL (Mailpit-API) oder RETICORA_IT_MAIL_DIR (lokaler Fänger)
 * Jeder Test beginnt mit leeren Tabellen und leerem Postfach; die Tests laufen nacheinander (eine Datenbank).
 */
abstract class IntegrationTestCase extends TestCase
{
    public const SALES = 'vertrieb@example.com';
    public const ORIGIN = 'https://www.example.com';
    protected const SQL = __DIR__ . '/../../sql';
    protected const BIN = __DIR__ . '/../../bin';
    protected const FIXTURES = __DIR__ . '/../fixtures/templates';

    protected PDO $pdo;
    protected Mailbox $mailbox;
    /** Uhr der Anwendung: eine Minute nach Beginn des laufenden Stundenfensters (kein Fensterwechsel mitten im Test). */
    protected int $now;
    /** @var list<string> */
    protected array $logLines = [];
    /** @var list<string> */
    private array $tempFiles = [];

    protected function setUp(): void
    {
        if (getenv('RETICORA_INTEGRATION') !== '1') {
            self::markTestSkipped('Integrationstest: nur mit RETICORA_INTEGRATION=1 gegen MariaDB und SMTP (README „Zielumgebung“).');
        }
        $this->pdo = Database::connect($this->config());
        Database::migrate($this->pdo, self::SQL);
        foreach (['lead', 'rate_limit', 'rate_limit_key'] as $table) {
            $this->pdo->exec("DELETE FROM $table");
        }
        $this->mailbox = getenv('RETICORA_IT_MAILPIT_URL') ? MailpitMailbox::fromEnvironment() : DirectoryMailbox::fromEnvironment();
        $this->mailbox->clear();
        $this->now = RateLimiter::windowStart(time()) + 60;
        $this->logLines = [];
    }

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $f) {
            @unlink($f);
        }
        $this->tempFiles = [];
    }

    protected static function env(string $name, ?string $default = null): string
    {
        $v = getenv($name);
        if (is_string($v) && $v !== '') {
            return $v;
        }
        if ($default === null) {
            self::fail("Umgebungsvariable $name fehlt");
        }
        return $default;
    }

    /** Wert aus NAME oder aus der Datei in NAME_FILE (vom Start des Stacks erzeugte Passwörter). */
    protected static function secret(string $name): string
    {
        $file = getenv($name . '_FILE');
        if (is_string($file) && $file !== '') {
            return trim((string) file_get_contents($file));
        }
        return self::env($name);
    }

    /**
     * Konfiguration wie config.php, mit echter Datenbank und echtem SMTP-Zugang.
     * @param array<string,mixed> $overrides oberste Ebene
     * @param array<string,mixed> $mail Werte im Abschnitt mail
     * @return array<string,mixed>
     */
    protected function configArray(array $overrides = [], array $mail = []): array
    {
        return $overrides + [
            'site_url' => self::ORIGIN,
            'contact_email' => 'kontakt@example.com',
            'retention_days' => 90,
            'rate_limit' => ['max' => 100, 'global_max' => 1000],
            'db' => ['dsn' => self::env('RETICORA_IT_DB_DSN'), 'user' => self::env('RETICORA_IT_DB_USER'), 'pass' => self::secret('RETICORA_IT_DB_PASS')],
            'mail' => $mail + [
                'transport' => 'smtp',
                'host' => self::env('RETICORA_IT_SMTP_HOST'),
                'port' => (int) self::env('RETICORA_IT_SMTP_PORT'),
                'encryption' => self::env('RETICORA_IT_SMTP_ENCRYPTION', 'starttls'),
                'user' => self::env('RETICORA_IT_SMTP_USER'),
                'pass' => self::secret('RETICORA_IT_SMTP_PASS'),
                'helo_name' => 'integration.test',
                'timeout' => 5,
                'deadline' => 10,
                'from_address' => 'versand@example.com',
                'from_name' => 'Reticora Website',
                'to_address' => self::SALES,
            ],
            'log_path' => '',
        ];
    }

    /** @param array<string,mixed> $overrides @param array<string,mixed> $mail */
    protected function config(array $overrides = [], array $mail = []): Config
    {
        return Config::fromArray($this->configArray($overrides, $mail));
    }

    /** Anwendung wie in lead.php verdrahtet, aber mit fester Uhr und mitgeschriebenem Protokoll. */
    protected function app(Config $config): App
    {
        return new App(
            $config,
            fn (): PDO => $this->pdo,
            static fn (): MailTransport => TransportFactory::fromConfig($config),
            fn (): int => $this->now,
            function (string $line): void {
                $this->logLines[] = $line;
            },
            new ContactPage(self::FIXTURES),
        );
    }

    /**
     * @param array<string,string> $fields
     * @param array<string,string> $headers
     */
    protected function post(App $app, array $fields, string $ip = '203.0.113.7', array $headers = ['Accept' => 'application/json']): Response
    {
        $body = http_build_query($fields);
        $headers = array_change_key_case($headers + ['Origin' => self::ORIGIN, 'Content-Type' => 'application/x-www-form-urlencoded', 'Content-Length' => (string) strlen($body)], CASE_LOWER);
        return $app->handle(new Request('POST', $headers, [], $body, $ip));
    }

    /** @param array<string,string> $override @return array<string,string> */
    protected function fields(array $override = []): array
    {
        return $override + [
            'name' => 'Erika Beispiel',
            'email' => 'erika@example.com',
            'company' => 'Beispiel GmbH',
            'topic' => 'demo',
            'message' => 'Bitte um Rückruf.',
            'lang' => 'de',
            'website' => '',
        ];
    }

    /** @return list<array<string,mixed>> */
    protected function leads(): array
    {
        return array_values($this->pdo->query('SELECT * FROM lead ORDER BY id')->fetchAll(PDO::FETCH_ASSOC));
    }

    /** @param array<string,mixed> $config Schreibt eine config.php für die CLI-Skripte (Datei wird nach dem Test gelöscht). */
    protected function configFile(array $config): string
    {
        $path = tempnam(sys_get_temp_dir(), 'reticora-it-config-') . '.php';
        file_put_contents($path, "<?php\nreturn " . var_export($config, true) . ";\n");
        chmod($path, 0600);
        $this->tempFiles[] = $path;
        return $path;
    }

    /**
     * Führt bin/<script>.php als eigenen Prozess aus (wie der Cron des Hosters).
     * @param list<string> $args
     * @return array{int,string,string} [Exit-Code, STDOUT, STDERR]
     */
    protected function runBin(string $script, string $configPath, array $args = []): array
    {
        $cmd = [PHP_BINARY];
        $cafile = (string) ini_get('openssl.cafile');
        if ($cafile !== '') {
            $cmd[] = '-d';
            $cmd[] = 'openssl.cafile=' . $cafile;
        }
        $cmd = [...$cmd, self::BIN . "/$script.php", $configPath, ...$args];
        $proc = proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        self::assertIsResource($proc);
        $out = (string) stream_get_contents($pipes[1]);
        $err = (string) stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        return [proc_close($proc), $out, $err];
    }

    /** @return list<array<string,mixed>> */
    protected function mails(): array
    {
        return $this->mailbox->messages();
    }
}
