<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PDO;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\Database;

/**
 * public/lead.php als echtes CGI-Programm (php-cgi), wie der Webserver es aufruft: Kopfzeilen und Protokoll.
 * Übersprungen, wenn php-cgi fehlt (CI: setup-php installiert es).
 */
final class EntryPointTest extends TestCase
{
    private string $dir;
    private string $cgi = '';

    protected function setUp(): void
    {
        $cgi = trim((string) shell_exec('command -v php-cgi 2>/dev/null'));
        if ($cgi === '') {
            self::markTestSkipped('php-cgi fehlt');
        }
        $this->cgi = $cgi;
        $this->dir = sys_get_temp_dir() . '/reticora-entry-' . bin2hex(random_bytes(4));
        mkdir($this->dir);
    }

    protected function tearDown(): void
    {
        if (isset($this->dir) && is_dir($this->dir)) {
            array_map('unlink', glob($this->dir . '/*') ?: []);
            rmdir($this->dir);
        }
    }

    /** @param array<string,string> $env @return array{array<string,list<string>>,string} [Kopfzeilen, Körper] */
    private function cgi(array $env, string $body = ''): array
    {
        $env += [
            'REQUEST_METHOD' => 'GET',
            'SCRIPT_FILENAME' => realpath(__DIR__ . '/../public/lead.php'),
            'REDIRECT_STATUS' => '200',
            'REMOTE_ADDR' => '192.0.2.10',
            'PATH' => (string) getenv('PATH'),
        ];
        $proc = proc_open([$this->cgi, '-d', 'expose_php=1', '-d', 'display_errors=0'], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, null, $env);
        self::assertIsResource($proc);
        fwrite($pipes[0], $body);
        fclose($pipes[0]);
        $out = (string) stream_get_contents($pipes[1]);
        stream_get_contents($pipes[2]);
        proc_close($proc);
        [$head, $rest] = array_pad(explode("\r\n\r\n", $out, 2), 2, '');
        $headers = [];
        foreach (explode("\r\n", $head) as $line) {
            [$k, $v] = array_pad(explode(':', $line, 2), 2, '');
            $headers[strtolower(trim($k))][] = trim($v);
        }
        return [$headers, $rest];
    }

    private function config(): string
    {
        $db = $this->dir . '/t.sqlite';
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        Database::migrate($pdo, __DIR__ . '/../sql');
        $cfg = $this->dir . '/config.php';
        file_put_contents($cfg, '<?php return ' . var_export([
            'site_url' => 'https://www.example.com', 'contact_email' => 'k@example.com', 'retention_days' => 30,
            'db' => ['dsn' => 'sqlite:' . $db],
            'mail' => ['transport' => 'file', 'allow_insecure' => true, 'file_path' => $this->dir . '/mails.jsonl', 'from_address' => 'v@example.com', 'from_name' => 'W', 'to_address' => 'vertrieb@example.com'],
            'log_path' => $this->dir . '/lead.log',
        ], true) . ';');
        return $cfg;
    }

    public function testNoXPoweredByEvenWithExposePhp(): void
    {
        // S-05: der Hoster kann expose_php = On haben; lead.php entfernt die Kopfzeile selbst.
        [$h] = $this->cgi(['RETICORA_HOME' => realpath(__DIR__ . '/..'), 'RETICORA_CONFIG' => $this->config()]);
        self::assertSame(['405 Method Not Allowed'], $h['status'] ?? null);
        self::assertArrayNotHasKey('x-powered-by', $h);
        // früher Fehler (vendor/ nicht gefunden): ebenfalls ohne
        [$h, $body] = $this->cgi(['RETICORA_HOME' => $this->dir]);
        self::assertSame(['500 Internal Server Error'], $h['status'] ?? null);
        self::assertSame("Server error\n", $body);
        self::assertArrayNotHasKey('x-powered-by', $h);
        // Konfiguration fehlt: 500 über Responder
        [$h] = $this->cgi(['RETICORA_HOME' => realpath(__DIR__ . '/..'), 'RETICORA_CONFIG' => $this->dir . '/fehlt.php']);
        self::assertSame(['500 Internal Server Error'], $h['status'] ?? null);
        self::assertArrayNotHasKey('x-powered-by', $h);
    }

    public function testEventsAreWrittenToADailyLogFile(): void
    {
        // DS-04: <log_path ohne .log>-JJJJ-MM-TT.log, damit purge.php alte Tage löschen kann.
        $body = http_build_query(['name' => 'Erika Beispiel', 'email' => 'erika@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => '', 'lang' => 'de', 'website' => 'koeder']);
        [$h] = $this->cgi([
            'RETICORA_HOME' => realpath(__DIR__ . '/..'), 'RETICORA_CONFIG' => $this->config(),
            'REQUEST_METHOD' => 'POST', 'CONTENT_TYPE' => 'application/x-www-form-urlencoded', 'CONTENT_LENGTH' => (string) strlen($body),
            'HTTP_ORIGIN' => 'https://www.example.com', 'HTTP_ACCEPT' => 'application/json',
        ], $body);
        self::assertSame(['200 OK'], $h['status'] ?? ['200 OK']);
        $daily = $this->dir . '/lead-' . gmdate('Y-m-d') . '.log';
        self::assertFileExists($daily);
        self::assertStringContainsString(' lead honeypot', (string) file_get_contents($daily));
        self::assertFileDoesNotExist($this->dir . '/lead.log');
    }
}
