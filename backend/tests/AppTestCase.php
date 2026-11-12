<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PDO;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\App;
use Reticora\Lead\ArrayTransport;
use Reticora\Lead\Config;
use Reticora\Lead\Database;
use Reticora\Lead\Request;
use Reticora\Lead\Response;
use Reticora\Lead\Signer;

abstract class AppTestCase extends TestCase
{
    public const SECRET = 'test-secret-test-secret-test-secret-123456';
    public const NOW = 1_800_000_000;

    protected PDO $pdo;
    protected ArrayTransport $mail;
    protected int $now = self::NOW;
    /** @var list<string> */
    protected array $logLines = [];
    protected App $app;

    protected function setUp(): void
    {
        $this->pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        Database::migrate($this->pdo, __DIR__ . '/../sql');
        $this->mail = new ArrayTransport();
        $this->logLines = [];
        $this->app = $this->makeApp($this->mail);
    }

    /** @param array<string,mixed> $overrides */
    protected function config(array $overrides = []): Config
    {
        return Config::fromArray($overrides + [
            'site_url' => 'https://www.example.com',
            'contact_email' => 'kontakt@example.com',
            'secret' => self::SECRET,
            'db' => ['dsn' => 'sqlite::memory:'],
            'mail' => ['from_address' => 'versand@example.com', 'from_name' => 'Reticora Website', 'to_address' => 'vertrieb@example.com'],
            'signature' => ['de' => '', 'en' => ''],
        ]);
    }

    protected function makeApp(ArrayTransport $mail, ?Config $config = null, ?\Closure $pdoFactory = null): App
    {
        return new App(
            $config ?? $this->config(),
            $pdoFactory ?? fn (): PDO => $this->pdo,
            $mail,
            fn (): int => $this->now,
            function (string $line): void {
                $this->logLines[] = $line;
            },
        );
    }

    /** @return array<string,string> */
    protected function validFields(array $override = []): array
    {
        $token = (new Signer(self::SECRET))->issue($this->now - 10);
        return $override + [
            'name' => 'Erika Beispiel',
            'email' => 'erika@example.com',
            'company' => 'Beispiel GmbH',
            'topic' => 'demo',
            'message' => 'Bitte um Rückruf.',
            'lang' => 'de',
            'website' => '',
            'ts' => (string) $token['ts'],
            'sig' => $token['sig'],
        ];
    }

    /**
     * @param array<string,string> $fields
     * @param array<string,string> $headers
     */
    protected function post(array $fields, array $headers = [], string $ip = '203.0.113.7'): Response
    {
        $headers = array_change_key_case($headers + [
            'Origin' => 'https://www.example.com',
            'Content-Type' => 'application/x-www-form-urlencoded',
        ], CASE_LOWER);
        return $this->app->handle(new Request('POST', $headers, [], http_build_query($fields), $ip));
    }

    /** @param array<string,string> $headers */
    protected function postRaw(string $body, array $headers = []): Response
    {
        $headers = array_change_key_case($headers + [
            'Origin' => 'https://www.example.com',
            'Content-Type' => 'application/x-www-form-urlencoded',
        ], CASE_LOWER);
        return $this->app->handle(new Request('POST', $headers, [], $body, '203.0.113.7'));
    }

    protected function countLeads(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM lead')->fetchColumn();
    }
}
