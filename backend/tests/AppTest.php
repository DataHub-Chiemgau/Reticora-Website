<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PDO;
use Reticora\Lead\ArrayTransport;
use Reticora\Lead\Request;
use Reticora\Lead\Signer;
use Reticora\Lead\Validator;

final class AppTest extends AppTestCase
{
    private const JSON = ['Accept' => 'application/json'];

    // ---- angenommen ----------------------------------------------------------------------------------------

    public function testAcceptedJson(): void
    {
        $r = $this->post($this->validFields(), self::JSON);
        self::assertSame(200, $r->status);
        self::assertSame('{"ok":true}', $r->body);
        self::assertStringStartsWith('application/json; charset=utf-8', $r->headers['Content-Type']);
        self::assertSame(1, $this->countLeads());
        self::assertCount(2, $this->mail->sent);
    }

    public function testAcceptedRedirectGermanAndEnglish(): void
    {
        $r = $this->post($this->validFields());
        self::assertSame(303, $r->status);
        self::assertSame('/kontakt/danke/', $r->headers['Location']);
        $r = $this->post($this->validFields(['lang' => 'en']), [], '203.0.113.8');
        self::assertSame(303, $r->status);
        self::assertSame('/en/contact/thanks/', $r->headers['Location']);
    }

    public function testUnknownLangStillRedirectsToFixedGermanTarget(): void
    {
        foreach (['fr', '//evil.example/', 'de%0d%0aLocation: x'] as $i => $lang) {
            $r = $this->post($this->validFields(['lang' => $lang]), [], "203.0.113.$i");
            self::assertSame('/kontakt/danke/', $r->headers['Location']);
        }
    }

    public function testSecurityHeadersOnEveryResponseKind(): void
    {
        $responses = [
            $this->post($this->validFields()),
            $this->post($this->validFields(['name' => '']), self::JSON),
            $this->app->handle(new Request('GET', [], ['token' => '1'], '', '1.2.3.4')),
            $this->app->handle(new Request('PUT', [], [], '', '1.2.3.4')),
        ];
        foreach ($responses as $r) {
            self::assertSame('nosniff', $r->headers['X-Content-Type-Options']);
            self::assertSame('no-store', $r->headers['Cache-Control']);
            self::assertSame('no-referrer', $r->headers['Referrer-Policy']);
            self::assertMatchesRegularExpression('/charset=utf-8$/', $r->headers['Content-Type']);
            self::assertArrayNotHasKey('Set-Cookie', $r->headers);
        }
    }

    // ---- Eingabefehler -------------------------------------------------------------------------------------

    public function testValidationErrorJson(): void
    {
        $r = $this->post($this->validFields(['name' => '', 'email' => 'x']), self::JSON);
        self::assertSame(422, $r->status);
        self::assertSame(['ok' => false, 'errors' => ['name' => 'name.required', 'email' => 'email.invalid']], json_decode($r->body, true));
        self::assertSame(0, $this->countLeads());
        self::assertSame([], $this->mail->sent);
    }

    public function testValidationErrorRedirectGerman(): void
    {
        $r = $this->post($this->validFields(['name' => '', 'topic' => 'x']));
        self::assertSame(303, $r->status);
        self::assertSame('/kontakt/?fehler=name.required,topic.invalid#fehler', $r->headers['Location']);
    }

    public function testValidationErrorRedirectEnglish(): void
    {
        $r = $this->post($this->validFields(['lang' => 'en', 'company' => '']));
        self::assertSame('/en/contact/?error=company.required#error', $r->headers['Location']);
    }

    public function testNoInputEverAppearsInARedirectAddress(): void
    {
        $evil = 'EVIL-MARKER<script>"&%0d%0a';
        $cases = [
            $this->validFields(['name' => $evil . str_repeat('x', 300)]),
            $this->validFields(['email' => $evil]),
            $this->validFields(['company' => $evil . "\r\nBcc: a@example.com"]),
            $this->validFields(['topic' => $evil]),
            $this->validFields(['message' => str_repeat($evil, 200), 'lang' => $evil]),
            $this->validFields(['name' => "a\r\nb", 'lang' => 'en']),
        ];
        foreach ($cases as $i => $fields) {
            $r = $this->post($fields, [], "198.51.100.$i");
            self::assertSame(303, $r->status);
            $loc = $r->headers['Location'];
            self::assertStringNotContainsString('EVIL', $loc);
            self::assertDoesNotMatchRegularExpression('/[\r\n<>"%]/', $loc);
            self::assertMatchesRegularExpression('~^/(en/contact/\?error|kontakt/\?fehler)=[a-z_.,]+#(error|fehler)$~', $loc);
            $query = parse_url($loc, PHP_URL_QUERY);
            parse_str((string) $query, $q);
            foreach (explode(',', (string) (reset($q) ?: '')) as $code) {
                self::assertContains($code, Validator::ERROR_CODES);
            }
        }
    }

    public function testCrlfInEverySingleLineFieldRejectedAndNothingMailed(): void
    {
        foreach (['name', 'email', 'company'] as $i => $field) {
            $r = $this->post($this->validFields([$field => "x@example.com\r\nBcc: attacker@example.com"]), self::JSON, "192.0.2.$i");
            self::assertSame(422, $r->status, $field);
            self::assertArrayHasKey($field, json_decode($r->body, true)['errors']);
        }
        self::assertSame([], $this->mail->sent);
        self::assertSame(0, $this->countLeads());
    }

    // ---- Köderfeld und Zeitfalle ---------------------------------------------------------------------------

    public function testHoneypotRespondsLikeSuccessButStoresAndSendsNothing(): void
    {
        $r = $this->post($this->validFields(['website' => 'http://spam.example']), self::JSON);
        self::assertSame(200, $r->status);
        self::assertSame('{"ok":true}', $r->body);
        $r = $this->post($this->validFields(['website' => 'x']), [], '203.0.113.99');
        self::assertSame(303, $r->status);
        self::assertSame('/kontakt/danke/', $r->headers['Location']);
        self::assertSame(0, $this->countLeads());
        self::assertSame([], $this->mail->sent);
    }

    public function testTimeTrapTooEarlyTooOldForgedAndHalfPresent(): void
    {
        $signer = new Signer(self::SECRET);
        $early = $signer->issue($this->now - 1);
        $old = $signer->issue($this->now - 7201);
        $forged = ['ts' => (string) ($this->now - 10), 'sig' => str_repeat('a', 64)];
        $cases = [
            'early' => ['ts' => (string) $early['ts'], 'sig' => $early['sig']],
            'old' => ['ts' => (string) $old['ts'], 'sig' => $old['sig']],
            'forged' => $forged,
            'only ts' => ['ts' => (string) ($this->now - 10), 'sig' => ''],
            'only sig' => ['ts' => '', 'sig' => $signer->issue($this->now - 10)['sig']],
        ];
        $i = 0;
        foreach ($cases as $name => $fields) {
            $r = $this->post($fields + $this->validFields(), self::JSON, '198.51.100.' . $i++);
            self::assertSame(200, $r->status, $name);
            self::assertSame('{"ok":true}', $r->body, $name);
        }
        self::assertSame(0, $this->countLeads());
        self::assertSame([], $this->mail->sent);
    }

    public function testBoundaryAgesAccepted(): void
    {
        $signer = new Signer(self::SECRET);
        foreach ([3, 7200] as $i => $age) {
            $t = $signer->issue($this->now - $age);
            $this->post(['ts' => (string) $t['ts'], 'sig' => $t['sig']] + $this->validFields(), self::JSON, "198.51.100.$i");
        }
        self::assertSame(2, $this->countLeads());
    }

    public function testMissingTsAndSigEntirelyDisablesTimeTrap(): void
    {
        $f = $this->validFields();
        unset($f['ts'], $f['sig']);
        self::assertSame(200, $this->post($f, self::JSON)->status);
        self::assertSame(1, $this->countLeads());
        // Köderfeld greift trotzdem.
        $f['website'] = 'x';
        $this->post($f, self::JSON, '198.51.100.50');
        self::assertSame(1, $this->countLeads());
    }

    // ---- Rate-Limit ----------------------------------------------------------------------------------------

    public function testSixthRequestWithinAnHourIs429WithRetryAfter(): void
    {
        for ($i = 0; $i < 5; $i++) {
            self::assertSame(200, $this->post($this->validFields(), self::JSON)->status);
        }
        $r = $this->post($this->validFields(), self::JSON);
        self::assertSame(429, $r->status);
        self::assertGreaterThan(0, (int) $r->headers['Retry-After']);
        self::assertLessThanOrEqual(3600, (int) $r->headers['Retry-After']);
        $html = $this->post($this->validFields());
        self::assertSame(429, $html->status);
        self::assertStringContainsString('text/html; charset=utf-8', $html->headers['Content-Type']);
        self::assertArrayHasKey('Retry-After', $html->headers);
        self::assertStringContainsString('kontakt@example.com', $html->body);
        self::assertSame(5, $this->countLeads());
        // andere Herkunft unberührt
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '203.0.113.200')->status);
    }

    public function testRateLimitResetsInNextHourWindow(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->post($this->validFields(), self::JSON);
        }
        $this->now += 3600;
        self::assertSame(200, $this->post($this->validFields(), self::JSON)->status);
    }

    public function testRateLimitCountsInvalidAndHoneypotRequestsToo(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post($this->validFields(['name' => '']), self::JSON);
        }
        self::assertSame(429, $this->post($this->validFields(), self::JSON)->status);
    }

    public function testIpIsNeverStored(): void
    {
        $this->post($this->validFields(), self::JSON, '203.0.113.77');
        $dump = json_encode([
            $this->pdo->query('SELECT * FROM rate_limit')->fetchAll(),
            $this->pdo->query('SELECT * FROM lead')->fetchAll(),
            $this->logLines,
        ]);
        self::assertStringNotContainsString('203.0.113.77', $dump);
        $hash = $this->pdo->query('SELECT hash FROM rate_limit')->fetchColumn();
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $hash);
    }

    // ---- Anfrage-Prüfung -----------------------------------------------------------------------------------

    public function testForeignOriginRejected(): void
    {
        foreach (['https://evil.example', 'http://www.example.com', 'https://www.example.com.evil.example', 'null', 'https://www.example.com:8443'] as $o) {
            $r = $this->post($this->validFields(), ['Origin' => $o]);
            self::assertSame(403, $r->status, $o);
        }
        $r = $this->post($this->validFields(), ['Origin' => 'https://evil.example'] + self::JSON);
        self::assertSame(403, $r->status);
        self::assertSame(0, $this->countLeads());
    }

    public function testMissingOriginRejectedUnlessSecFetchSiteSameOrigin(): void
    {
        $send = function (array $headers): int {
            $req = new Request('POST', $headers + ['content-type' => 'application/x-www-form-urlencoded'], [], http_build_query($this->validFields()), '198.51.100.1');
            return $this->app->handle($req)->status;
        };
        self::assertSame(403, $send([]));
        self::assertSame(403, $send(['sec-fetch-site' => 'cross-site']));
        self::assertSame(403, $send(['sec-fetch-site' => 'same-site']));
        self::assertSame(403, $send(['sec-fetch-site' => 'none']));
        self::assertSame(303, $send(['sec-fetch-site' => 'same-origin']));
    }

    public function testOriginWithTrailingSlashAndCaseAccepted(): void
    {
        self::assertSame(303, $this->post($this->validFields(), ['Origin' => 'https://WWW.example.com'])->status);
    }

    public function testOnlyPostAndTokenGetAllowed(): void
    {
        foreach (['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as $m) {
            $r = $this->app->handle(new Request($m, [], [], '', '1.2.3.4'));
            self::assertSame(405, $r->status, $m);
            self::assertSame('GET, POST', $r->headers['Allow']);
        }
        $r = $this->app->handle(new Request('GET', [], ['token' => '0'], '', '1.2.3.4'));
        self::assertSame(405, $r->status);
        $r = $this->app->handle(new Request('HEAD', [], ['token' => '1'], '', '1.2.3.4'));
        self::assertSame(405, $r->status);
    }

    public function testBodyOver16KbRejected(): void
    {
        $r = $this->postRaw('name=a&message=' . str_repeat('a', 16384));
        self::assertSame(413, $r->status);
        $r = $this->postRaw('x=1', ['Content-Length' => '99999']);
        self::assertSame(413, $r->status);
        $r = $this->postRaw(http_build_query($this->validFields()), ['Accept' => 'application/json']);
        self::assertSame(200, $r->status);
        self::assertSame(1, $this->countLeads());
    }

    public function testBodyExactly16KbIsNotTooLarge(): void
    {
        $body = 'x=' . str_repeat('a', 16384 - 2);
        self::assertSame(strlen($body), 16384);
        self::assertNotSame(413, $this->postRaw($body, self::JSON)->status);
    }

    public function testWrongContentTypeRejected(): void
    {
        $r = $this->postRaw('{"name":"x"}', ['Content-Type' => 'application/json']);
        self::assertSame(415, $r->status);
        $r = $this->postRaw(http_build_query($this->validFields()), ['Content-Type' => 'application/x-www-form-urlencoded; charset=UTF-8']);
        self::assertSame(303, $r->status);
    }

    public function testArrayFieldsAreIgnoredNotFatal(): void
    {
        $r = $this->postRaw('name[]=a&email[x]=b&company=C&topic=demo', self::JSON);
        self::assertSame(422, $r->status);
    }

    // ---- Token-Endpunkt ------------------------------------------------------------------------------------

    public function testTokenEndpoint(): void
    {
        $r = $this->app->handle(new Request('GET', [], ['token' => '1'], '', '1.2.3.4'));
        self::assertSame(200, $r->status);
        self::assertSame('no-store', $r->headers['Cache-Control']);
        self::assertStringStartsWith('application/json', $r->headers['Content-Type']);
        self::assertArrayNotHasKey('Set-Cookie', $r->headers);
        $d = json_decode($r->body, true);
        self::assertSame(['ts', 'sig'], array_keys($d));
        self::assertSame($this->now, $d['ts']);
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $d['sig']);
        self::assertSame(Signer::TOO_EARLY, (new Signer(self::SECRET))->verify((string) $d['ts'], $d['sig'], $this->now));
        self::assertSame(Signer::OK, (new Signer(self::SECRET))->verify((string) $d['ts'], $d['sig'], $this->now + 5));
    }

    public function testTokenEndpointNeedsNoDatabase(): void
    {
        $app = $this->makeApp(new ArrayTransport(), null, function (): PDO {
            throw new \RuntimeException('db down');
        });
        self::assertSame(200, $app->handle(new Request('GET', [], ['token' => '1'], '', '1.2.3.4'))->status);
    }

    // ---- Zustellung ----------------------------------------------------------------------------------------

    public function testMailFailureKeepsLeadMarksNotDeliveredAndStillThanks(): void
    {
        $mail = new ArrayTransport(fn () => true);
        $this->app = $this->makeApp($mail);
        $r = $this->post($this->validFields(), self::JSON);
        self::assertSame(200, $r->status);
        self::assertSame(1, $this->countLeads());
        self::assertSame('not_delivered', $this->pdo->query('SELECT delivery FROM lead')->fetchColumn());
        self::assertContains('mail_failed sales lead=1 RuntimeException', $this->logLines);
    }

    public function testConfirmationFailureIsMarkedSeparately(): void
    {
        $mail = new ArrayTransport(fn ($m) => $m->to === 'erika@example.com');
        $this->app = $this->makeApp($mail);
        $this->post($this->validFields(), self::JSON);
        self::assertSame('confirmation_failed', $this->pdo->query('SELECT delivery FROM lead')->fetchColumn());
        self::assertCount(1, $mail->sent);
    }

    public function testSuccessfulDeliveryMarkedDelivered(): void
    {
        $this->post($this->validFields(), self::JSON);
        self::assertSame('delivered', $this->pdo->query('SELECT delivery FROM lead')->fetchColumn());
    }

    // ---- Serverfehler --------------------------------------------------------------------------------------

    public function testDatabaseDownGives500WithoutDetails(): void
    {
        $app = $this->makeApp(new ArrayTransport(), null, function (): PDO {
            throw new \PDOException('SQLSTATE secret-db-host password=hunter2');
        });
        $headers = ['origin' => 'https://www.example.com', 'content-type' => 'application/x-www-form-urlencoded', 'accept' => 'application/json'];
        $r = $app->handle(new Request('POST', $headers, [], http_build_query($this->validFields()), '1.2.3.4'));
        self::assertSame(500, $r->status);
        self::assertSame('{"ok":false}', $r->body);
        unset($headers['accept']);
        $r = $app->handle(new Request('POST', $headers, [], http_build_query($this->validFields(['lang' => 'en'])), '1.2.3.4'));
        self::assertSame(500, $r->status);
        self::assertStringContainsString('kontakt@example.com', $r->body);
        self::assertStringContainsString('lang="en"', $r->body);
        self::assertStringNotContainsString('hunter2', $r->body . implode('', $this->logLines));
        self::assertStringNotContainsString('Erika', implode('', $this->logLines));
    }

    public function testLogContainsNoFormContentOrIp(): void
    {
        $this->post($this->validFields(['message' => 'GEHEIMER-TEXT']), self::JSON);
        $this->post($this->validFields(['website' => 'x']), self::JSON);
        $log = implode("\n", $this->logLines);
        foreach (['GEHEIMER-TEXT', 'erika@example.com', 'Erika', 'Beispiel', '203.0.113.7'] as $needle) {
            self::assertStringNotContainsString($needle, $log);
        }
    }
}
