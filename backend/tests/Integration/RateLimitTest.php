<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use PDO;
use Reticora\Lead\LeadRepository;
use Reticora\Lead\RateLimiter;
use Reticora\Lead\Request;

/**
 * Rate-Limit auf MariaDB (Spec §6.2, Ä-07, Ä-10): je Herkunft (IPv4, IPv6-/64, zweite Stufe /48), nur REMOTE_ADDR,
 * Obergrenze für alle mit „held“ und harter Grenze.
 */
final class RateLimitTest extends IntegrationTestCase
{
    /** Köderfeld gefüllt: zählt je Herkunft, schickt aber keine Mail (hält die Tests schnell). */
    private function trap(): array
    {
        return $this->fields(['website' => 'x']);
    }

    public function testFivePerOriginThen429WithRetryAfterAndOnlyHmacsStored(): void
    {
        $app = $this->app($this->config(['rate_limit' => ['max' => 5, 'global_max' => 60]]));
        for ($i = 1; $i <= 5; $i++) {
            self::assertSame(200, $this->post($app, $this->trap(), '198.51.100.20')->status, "Anfrage $i");
        }
        $r = $this->post($app, $this->trap(), '198.51.100.20');
        self::assertSame(429, $r->status);
        self::assertSame((string) (RateLimiter::windowStart($this->now) + 3600 - $this->now), $r->headers['Retry-After']);
        // gesperrte Herkunft ist auch für gültige Anfragen gesperrt, andere Herkunft nicht
        self::assertSame(429, $this->post($app, $this->fields(), '198.51.100.20')->status);
        self::assertSame(200, $this->post($app, $this->trap(), '198.51.100.21')->status);

        $rows = $this->pdo->query('SELECT hash, window_start, counter FROM rate_limit ORDER BY counter DESC')->fetchAll(PDO::FETCH_ASSOC);
        self::assertCount(2, $rows);
        self::assertSame(5, (int) $rows[0]['counter']);
        self::assertSame(RateLimiter::windowStart($this->now), (int) $rows[0]['window_start']);
        foreach ($rows as $row) {
            self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $row['hash']);
        }
        $dump = json_encode($this->pdo->query('SELECT * FROM rate_limit')->fetchAll()) . json_encode($this->pdo->query('SELECT * FROM rate_limit_key')->fetchAll());
        self::assertStringNotContainsString('198.51.100', (string) $dump);
    }

    public function testInvalidInputDoesNotCount(): void
    {
        $app = $this->app($this->config(['rate_limit' => ['max' => 5, 'global_max' => 60]]));
        for ($i = 0; $i < 10; $i++) {
            self::assertSame(422, $this->post($app, $this->fields(['email' => '']), '198.51.100.30')->status);
        }
        self::assertSame(0, (int) $this->pdo->query('SELECT COUNT(*) FROM rate_limit')->fetchColumn());
    }

    public function testOnlyRemoteAddrCountsNeverForwardedHeaders(): void
    {
        // Request::fromGlobals liest nur REMOTE_ADDR.
        $saved = $_SERVER;
        $_SERVER = ['REQUEST_METHOD' => 'POST', 'REMOTE_ADDR' => '192.0.2.50', 'HTTP_X_FORWARDED_FOR' => '203.0.113.99', 'HTTP_X_REAL_IP' => '203.0.113.98', 'HTTP_FORWARDED' => 'for=203.0.113.97', 'HTTP_CLIENT_IP' => '203.0.113.96'];
        try {
            self::assertSame('192.0.2.50', Request::fromGlobals()->ip);
        } finally {
            $_SERVER = $saved;
        }

        // Wechselnde Weiterleitungs-Kopfzeilen (IPv4 und IPv6) helfen nicht an der Grenze vorbei.
        $app = $this->app($this->config(['rate_limit' => ['max' => 5, 'global_max' => 60]]));
        $spoofed = ['203.0.113.1', '2001:db8:aaaa::1', '203.0.113.2', '2001:db8:bbbb::1', '203.0.113.3', '2001:db8:cccc::1'];
        foreach ($spoofed as $i => $xff) {
            $headers = ['Accept' => 'application/json', 'X-Forwarded-For' => $xff, 'X-Real-IP' => $xff, 'Forwarded' => "for=\"$xff\""];
            $status = $this->post($app, $this->trap(), '192.0.2.50', $headers)->status;
            self::assertSame($i < 5 ? 200 : 429, $status, "Anfrage mit X-Forwarded-For $xff");
        }
    }

    public function testOverHttpForwardedForIsIgnored(): void
    {
        // Echter HTTP-Weg (Request::fromGlobals) über den PHP-Server mit derselben Datenbank; REMOTE_ADDR ist immer 127.0.0.1.
        $config = $this->configFile($this->configArray(['site_url' => 'http://127.0.0.1', 'rate_limit' => ['max' => 5, 'global_max' => 60]]));
        $probe = stream_socket_server('tcp://127.0.0.1:0');
        self::assertNotFalse($probe);
        $port = (int) substr((string) strrchr((string) stream_socket_get_name($probe, false), ':'), 1);
        fclose($probe);
        $env = ['RETICORA_CONFIG' => $config, 'RETICORA_HOME' => dirname(self::BIN)] + getenv();
        $server = proc_open([PHP_BINARY, '-S', "127.0.0.1:$port", '-t', dirname(self::BIN) . '/public'], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes, null, $env);
        self::assertIsResource($server);
        try {
            $deadline = microtime(true) + 10;
            while (@fsockopen('127.0.0.1', $port) === false) {
                self::assertLessThan($deadline, microtime(true), 'PHP-Server startet nicht');
                usleep(100_000);
            }
            $statuses = [];
            foreach (['203.0.113.1', '2001:db8:1::1', '203.0.113.2', '2001:db8:2::1', '203.0.113.3', '2001:db8:3::1'] as $xff) {
                $ctx = stream_context_create(['http' => [
                    'method' => 'POST', 'ignore_errors' => true, 'timeout' => 10,
                    'header' => "Origin: http://127.0.0.1\r\nAccept: application/json\r\nContent-Type: application/x-www-form-urlencoded\r\nX-Forwarded-For: $xff\r\nX-Real-IP: $xff\r\n",
                    'content' => http_build_query($this->trap()),
                ]]);
                @file_get_contents("http://127.0.0.1:$port/lead.php", false, $ctx);
                $headers = function_exists('http_get_last_response_headers') ? (http_get_last_response_headers() ?? []) : ($http_response_header ?? []);
                $statuses[] = (int) (explode(' ', (string) ($headers[0] ?? ''))[1] ?? 0);
            }
            self::assertSame([200, 200, 200, 200, 200, 429], $statuses);
        } finally {
            proc_terminate($server);
            proc_close($server);
        }
    }

    public function testIpv6CountsPer64AndPer48(): void
    {
        $app = $this->app($this->config(['rate_limit' => ['max' => 5, 'global_max' => 60]]));
        // fünf Adressen aus demselben /64
        for ($i = 1; $i <= 5; $i++) {
            self::assertSame(200, $this->post($app, $this->trap(), "2001:db8:1:1::$i")->status);
        }
        self::assertSame(429, $this->post($app, $this->trap(), '2001:db8:1:1:ffff::1')->status, 'gleiches /64');
        // anderes /64 im selben /48: bis 15 je /48
        for ($i = 2; $i <= 3; $i++) {
            for ($j = 1; $j <= 5; $j++) {
                self::assertSame(200, $this->post($app, $this->trap(), "2001:db8:1:$i::$j")->status, "/64 Nr. $i, Anfrage $j");
            }
        }
        self::assertSame(429, $this->post($app, $this->trap(), '2001:db8:1:4::1')->status, '/48 voll');
        self::assertSame(200, $this->post($app, $this->trap(), '2001:db8:2:1::1')->status, 'anderes /48');
        // IPv4-gemappt zählt wie IPv4
        for ($i = 1; $i <= 5; $i++) {
            self::assertSame(200, $this->post($app, $this->trap(), $i % 2 ? '::ffff:198.51.100.40' : '198.51.100.40')->status);
        }
        self::assertSame(429, $this->post($app, $this->trap(), '198.51.100.40')->status);
    }

    public function testGlobalCapHoldsWithoutMailThenHardCap429AndRetryDeliversHeld(): void
    {
        $app = $this->app($this->config(['rate_limit' => ['max' => 100, 'global_max' => 2]]));
        $statuses = [];
        for ($i = 1; $i <= 21; $i++) {
            $statuses[] = $this->post($app, $this->fields(['email' => "global$i@example.com"]), "198.51.100.$i")->status;
        }
        // 2 normal, bis 10 × 2 = 20 gespeichert und zurückgehalten (Besucherin sieht Erfolg), danach 429
        self::assertSame([...array_fill(0, 20, 200), 429], $statuses);
        $delivery = array_column($this->leads(), 'delivery');
        self::assertSame([...array_fill(0, 2, LeadRepository::DELIVERED), ...array_fill(0, 18, LeadRepository::HELD)], $delivery);
        self::assertCount(2, $this->mails(), 'zurückgehaltene Anfragen gehen nicht hinaus');
        self::assertSame(21, (int) $this->pdo->query("SELECT counter FROM rate_limit WHERE hash = 'global'")->fetchColumn());

        $config = $this->configFile($this->configArray());
        [$code, $out] = $this->runBin('purge', $config);
        self::assertSame(1, $code);
        self::assertStringContainsString(' undelivered=18 held=18 not_delivered=0 ', $out);

        [$code, $out, $err] = $this->runBin('retry', $config, ['10']);
        self::assertSame(0, $code, $err);
        self::assertStringEndsWith(" retry sent=10 failed=0 remaining=8\n", $out);
        [$code, $out, $err] = $this->runBin('retry', $config);
        self::assertSame(0, $code, $err);
        self::assertStringEndsWith(" retry sent=8 failed=0 remaining=0\n", $out);
        self::assertSame(array_fill(0, 20, LeadRepository::DELIVERED), array_column($this->leads(), 'delivery'));
        $mails = $this->mails();
        self::assertCount(20, $mails);
        $replyTo = array_merge(...array_column($mails, 'reply_to'));
        sort($replyTo);
        $expected = array_map(static fn (int $i): string => "global$i@example.com", range(1, 20));
        sort($expected);
        self::assertSame($expected, $replyTo, 'jede Anfrage genau einmal');
    }
}
