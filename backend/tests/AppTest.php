<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PDO;
use Reticora\Lead\ArrayTransport;
use Reticora\Lead\MailTransport;
use Reticora\Lead\Request;
use Reticora\Lead\Response;

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
        self::assertCount(1, $this->mail->sent);
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

    public function testFastSubmitWithoutAnyTokenIsAccepted(): void
    {
        // Ä-07: keine Zeitfalle. Eine Anfrage direkt nach dem Laden der Seite wird gespeichert.
        self::assertSame(200, $this->post($this->validFields(), self::JSON)->status);
        self::assertSame(1, $this->countLeads());
        // Alte Felder ts/sig aus einem zwischengespeicherten Formular stören nicht.
        self::assertSame(200, $this->post($this->validFields(['ts' => '1', 'sig' => 'x']), self::JSON, '203.0.113.9')->status);
        self::assertSame(2, $this->countLeads());
    }

    public function testUnknownOrMissingLangIs422WithGermanFormAndNoRedirect(): void
    {
        foreach (['fr', '//evil.example/', "de\r\nLocation: x", ''] as $i => $lang) {
            $r = $this->post($this->validFields(['lang' => $lang]), [], "203.0.113.$i");
            self::assertSame(422, $r->status);
            self::assertArrayNotHasKey('Location', $r->headers);
            self::assertStringContainsString('<html lang="de"', $r->body);
            $j = $this->post($this->validFields(['lang' => $lang]), self::JSON, "203.0.114.$i");
            self::assertSame(422, $j->status);
            self::assertSame(['ok' => false, 'errors' => ['lang' => 'lang.invalid']], json_decode($j->body, true));
        }
        self::assertSame(0, $this->countLeads());
    }

    public function testSecurityHeadersOnEveryResponseKind(): void
    {
        $responses = [
            $this->post($this->validFields()),
            $this->post($this->validFields(['name' => '']), self::JSON, '203.0.113.20'),
            $this->post($this->validFields(['name' => '']), [], '203.0.113.21'),
            $this->app->handle(new Request('GET', [], [], '', '1.2.3.4')),
            $this->app->handle(new Request('PUT', [], [], '', '1.2.3.4')),
        ];
        foreach ($responses as $i => $r) {
            self::assertSame('nosniff', $r->headers['X-Content-Type-Options']);
            self::assertSame('no-store', $r->headers['Cache-Control']);
            // Die Kontaktseite (422) trägt die Policy der Website, sonst wäre Origin beim erneuten Absenden "null".
            self::assertSame($i === 2 ? Response::SITE_REFERRER : 'no-referrer', $r->headers['Referrer-Policy']);
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

    public function testEmptyTopicGivesTopicRequired(): void
    {
        $r = $this->post($this->validFields(['topic' => '']), self::JSON);
        self::assertSame(['topic' => 'topic.required'], json_decode($r->body, true)['errors']);
        $r = $this->post($this->validFields(['topic' => 'verkauf']), self::JSON, '203.0.113.30');
        self::assertSame(['topic' => 'topic.invalid'], json_decode($r->body, true)['errors']);
    }

    public function testValidationErrorWithoutJsonRendersTheContactPageWith422(): void
    {
        $r = $this->post($this->validFields(['name' => '', 'topic' => 'security']));
        self::assertSame(422, $r->status);
        self::assertArrayNotHasKey('Location', $r->headers);
        self::assertSame('text/html; charset=utf-8', $r->headers['Content-Type']);
        self::assertSame(Response::SITE_CSP, $r->headers['Content-Security-Policy']);
        self::assertSame('strict-origin-when-cross-origin', $r->headers['Referrer-Policy']);
        self::assertStringContainsString('id="f-name-err" data-rt-error="name">Bitte geben Sie Ihren Namen an.</p>', $r->body);
        self::assertStringContainsString(' data-rt-field="email" value="erika@example.com"', $r->body);
        self::assertStringContainsString(' data-rt-option="security" selected', $r->body);
        self::assertSame(0, $this->countLeads());
    }

    public function testEnglishValidationErrorUsesEnglishTemplate(): void
    {
        $r = $this->post($this->validFields(['lang' => 'en', 'company' => '']));
        self::assertSame(422, $r->status);
        self::assertStringContainsString('<html lang="en"', $r->body);
        self::assertStringContainsString('>Please enter your company.</p>', $r->body);
    }

    public function testMissingTemplateFallsBackToNoticePageWith422(): void
    {
        $this->app = $this->makeApp(templates: sys_get_temp_dir() . '/reticora-no-templates-' . bin2hex(random_bytes(4)));
        $r = $this->post($this->validFields(['name' => '', 'company' => 'NICHT-ZURUECK<script>']));
        self::assertSame(422, $r->status);
        self::assertSame('text/html; charset=utf-8', $r->headers['Content-Type']);
        self::assertStringContainsString("default-src 'none'", $r->headers['Content-Security-Policy']);
        self::assertStringContainsString('href="/kontakt/"', $r->body);
        self::assertStringNotContainsString('<script', $r->body);
        self::assertStringNotContainsString('NICHT-ZURUECK', $r->body);
        self::assertContains('template_missing de', $this->logLines);
        self::assertStringContainsString('<title>Fehler: ', $r->body);
        self::assertStringNotContainsString('<h1>Fehler: ', $r->body);
    }

    public function testEmptyOrInvalidFormNeverEndsOnTheThankYouPage(): void
    {
        $cases = [
            [],
            ['lang' => 'de'],
            $this->validFields(['name' => '']),
            $this->validFields(['website' => 'x', 'email' => '']), // Köderfeld gefüllt, aber ungültig
            $this->validFields(['website' => 'x', 'topic' => '']),
        ];
        foreach ($cases as $i => $fields) {
            foreach ([self::JSON, []] as $j => $headers) {
                $r = $this->post($fields, $headers, "198.51.100.$i$j");
                self::assertSame(422, $r->status, json_encode($fields));
                self::assertArrayNotHasKey('Location', $r->headers);
                self::assertStringNotContainsString('{"ok":true}', $r->body);
            }
        }
        self::assertSame(0, $this->countLeads());
        self::assertSame([], $this->mail->sent);
    }

    public function testNoInputOrErrorCodeEverAppearsInAnAddress(): void
    {
        $evil = 'EVIL-MARKER<script>"&%0d%0a';
        $cases = [
            $this->validFields(['name' => $evil . str_repeat('x', 300)]),
            $this->validFields(['email' => $evil]),
            $this->validFields(['company' => $evil . "\r\nBcc: a@example.com"]),
            $this->validFields(['topic' => $evil]),
            $this->validFields(['message' => str_repeat($evil, 200), 'lang' => $evil]),
            $this->validFields(['name' => "a\r\nb", 'lang' => 'en']),
            $this->validFields(),
        ];
        foreach ($cases as $i => $fields) {
            $r = $this->post($fields, [], "198.51.100.$i");
            foreach ($r->headers as $value) {
                self::assertStringNotContainsString('EVIL', $value);
                self::assertStringNotContainsString('.invalid', $value);
                self::assertStringNotContainsString('?', $value);
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

    // ---- Köderfeld -----------------------------------------------------------------------------------------

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
        self::assertContains('honeypot', $this->logLines);
    }

    // ---- Rate-Limit je Herkunft ----------------------------------------------------------------------------

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

    public function testRateLimitMaxIsConfigurable(): void
    {
        $this->app = $this->makeApp(config: $this->config(['rate_limit' => ['max' => 2]]));
        $codes = [];
        for ($i = 0; $i < 3; $i++) {
            $codes[] = $this->post($this->validFields(), self::JSON)->status;
        }
        self::assertSame([200, 200, 429], $codes);
    }

    /** @return array<string,array{mixed,int}> */
    public static function perOriginLimits(): array
    {
        return ['fehlt' => [null, 5], 'kein Wert' => ['x', 5], 'null' => [0, 1], 'negativ' => [-3, 1], '100' => [100, 100], 'zu hoch' => [100000, 100]];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('perOriginLimits')]
    public function testRateLimitMaxIsClampedTo1To100(mixed $configured, int $effective): void
    {
        $this->app = $this->makeApp(config: $this->config(['rate_limit' => ['max' => $configured, 'global_max' => 1000]]));
        for ($i = 0; $i < $effective; $i++) {
            self::assertSame(200, $this->post($this->validFields(), self::JSON)->status, "Anfrage $i");
        }
        self::assertSame(429, $this->post($this->validFields(), self::JSON)->status);
    }

    public function testRateLimitResetsInNextHourWindow(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->post($this->validFields(), self::JSON);
        }
        $this->now += 3600;
        self::assertSame(200, $this->post($this->validFields(), self::JSON)->status);
    }

    public function testInvalidSubmissionsDoNotCountTowardsThePerOriginLimit(): void
    {
        for ($i = 0; $i < 12; $i++) {
            self::assertSame(422, $this->post($this->validFields(['name' => '']), self::JSON)->status, "Anfrage $i");
            self::assertSame(422, $this->post($this->validFields(['email' => 'kaputt']))->status);
        }
        for ($i = 0; $i < 5; $i++) {
            self::assertSame(200, $this->post($this->validFields(), self::JSON)->status, "gültig $i");
        }
        self::assertSame(429, $this->post($this->validFields(), self::JSON)->status);
    }

    public function testAnOriginOverTheLimitIsRejectedEvenForInvalidSubmissions(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post($this->validFields(), self::JSON);
        }
        self::assertSame(429, $this->post($this->validFields(['name' => '']), self::JSON)->status);
        self::assertSame(429, $this->post(['lang' => 'de'])->status);
    }

    public function testHoneypotRequestsCountTowardsThePerOriginLimit(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $this->post($this->validFields(), self::JSON);
        }
        $this->post($this->validFields(['website' => 'x']), self::JSON);
        self::assertSame(429, $this->post($this->validFields(), self::JSON)->status);
    }

    public function testPrefix48TierLimitsAnAttackerSpreadOverMany64Networks(): void
    {
        // max 5 je /64, also höchstens 15 je /48. 15 verschiedene /64 im selben /48 (je 1 Anfrage) sind noch in Ordnung.
        for ($i = 1; $i <= 15; $i++) {
            self::assertSame(200, $this->post($this->validFields(), self::JSON, sprintf('2001:db8:aa:%x::1', $i))->status, "Netz $i");
        }
        $r = $this->post($this->validFields(), self::JSON, '2001:db8:aa:ff::1');
        self::assertSame(429, $r->status);
        self::assertArrayHasKey('Retry-After', $r->headers);
        // auch ungültige Absendungen aus diesem /48 werden abgewiesen
        self::assertSame(429, $this->post(['lang' => 'de'], self::JSON, '2001:db8:aa:100::1')->status);
        // anderes /48 und IPv4 bleiben frei
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '2001:db8:bb:1::1')->status);
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '203.0.113.9')->status);
    }

    public function testPrefix48IsHashedLikeTheOtherKeys(): void
    {
        $this->post($this->validFields(), self::JSON, '2001:db8:abcd:12::77');
        $hashes = $this->pdo->query("SELECT hash FROM rate_limit WHERE hash <> 'global'")->fetchAll(PDO::FETCH_COLUMN);
        self::assertCount(2, $hashes); // /64 und /48
        foreach ($hashes as $h) {
            self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $h);
        }
        self::assertSame('2001:db8:abcd::/48', \Reticora\Lead\RateLimiter::prefix48('2001:db8:abcd:12::77'));
        self::assertNull(\Reticora\Lead\RateLimiter::prefix48('203.0.113.7'));
        self::assertNull(\Reticora\Lead\RateLimiter::prefix48('::ffff:203.0.113.7'));
    }

    public function testIpv6AddressesAreGroupedByTheir64Prefix(): void
    {
        $same = ['2001:db8:1:2::1', '2001:db8:1:2:ffff:ffff:ffff:fffe', '2001:DB8:1:2:0:0:0:3', '2001:db8:1:2::4', '2001:db8:1:2:aaaa::5'];
        foreach ($same as $ip) {
            self::assertSame(200, $this->post($this->validFields(), self::JSON, $ip)->status, $ip);
        }
        self::assertSame(429, $this->post($this->validFields(), self::JSON, '2001:db8:1:2::99')->status);
        // Nachbarnetz /64 ist eine eigene Herkunft.
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '2001:db8:1:3::1')->status);
    }

    public function testIpv4MappedIpv6CountsAsTheIpv4Address(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post($this->validFields(), self::JSON, $i % 2 === 0 ? '203.0.113.7' : '::ffff:203.0.113.7');
        }
        self::assertSame(429, $this->post($this->validFields(), self::JSON, '::ffff:203.0.113.7')->status);
        self::assertSame(429, $this->post($this->validFields(), self::JSON, '203.0.113.7')->status);
        // IPv4 bleibt ungekürzt: der Nachbar im selben /24 ist eine eigene Herkunft.
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '203.0.113.8')->status);
    }

    public function testIpIsNeverStoredOrLogged(): void
    {
        $ips = ['203.0.113.77', '2001:db8:abcd:12::77'];
        foreach ($ips as $ip) {
            $this->post($this->validFields(), self::JSON, $ip);
            $this->post($this->validFields(['name' => '']), self::JSON, $ip);
        }
        $dump = json_encode([
            $this->pdo->query('SELECT * FROM rate_limit')->fetchAll(),
            $this->pdo->query('SELECT * FROM rate_limit_key')->fetchAll(),
            $this->pdo->query('SELECT * FROM lead')->fetchAll(),
            $this->logLines,
        ]);
        foreach (['203.0.113.77', '2001:db8:abcd', '2001:0db8', 'db8:abcd:12'] as $needle) {
            self::assertStringNotContainsString($needle, $dump);
        }
        foreach ($this->pdo->query("SELECT hash FROM rate_limit WHERE hash <> 'global'")->fetchAll(PDO::FETCH_COLUMN) as $hash) {
            self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $hash);
        }
    }

    public function testExpiredRateLimitRowsAreDeletedOnEveryCall(): void
    {
        $this->pdo->exec("INSERT INTO rate_limit (hash, window_start, counter) VALUES ('alt', " . ($this->now - 3600) . ", 3)");
        $this->pdo->exec("INSERT INTO rate_limit (hash, window_start, counter) VALUES ('uralt', " . ($this->now - 90000) . ", 3)");
        // Auch eine ungültige Anfrage räumt auf (und legt selbst keinen Zähler an).
        $this->post(['lang' => 'de'], self::JSON);
        $left = $this->pdo->query('SELECT hash FROM rate_limit ORDER BY hash')->fetchAll(PDO::FETCH_COLUMN);
        self::assertSame([], $left);
    }

    public function testRateLimitKeyIsRandomAndOverwrittenDaily(): void
    {
        $this->post($this->validFields(), self::JSON);
        $day1 = $this->pdo->query('SELECT * FROM rate_limit_key')->fetchAll();
        self::assertCount(1, $day1);
        $hash1 = $this->pdo->query('SELECT hash FROM rate_limit')->fetchColumn();
        // gleicher Tag: gleicher Schlüssel
        $this->now += 3600;
        $this->post($this->validFields(), self::JSON);
        self::assertSame($day1, $this->pdo->query('SELECT * FROM rate_limit_key')->fetchAll());
        self::assertSame($hash1, $this->pdo->query('SELECT hash FROM rate_limit')->fetchColumn());
        // nächster Tag: Schlüssel überschrieben, eine Zeile, anderer Hash für dieselbe Adresse
        $this->now += 86400;
        $this->post($this->validFields(), self::JSON);
        $day2 = $this->pdo->query('SELECT * FROM rate_limit_key')->fetchAll();
        self::assertCount(1, $day2);
        self::assertNotSame($day1[0]['secret'], $day2[0]['secret']);
        self::assertNotSame($hash1, $this->pdo->query('SELECT hash FROM rate_limit')->fetchColumn());
    }

    // ---- Obergrenze für alle Anfragen ----------------------------------------------------------------------

    private function seedGlobal(int $count): void
    {
        $window = intdiv($this->now, 3600) * 3600;
        $this->pdo->exec("INSERT INTO rate_limit (hash, window_start, counter) VALUES ('global', $window, $count)");
    }

    public function testLeadsOverTheSoftCapAreHeldWithoutMailAndTheVisitorSeesSuccess(): void
    {
        $this->app = $this->makeApp(config: $this->config(['rate_limit' => ['global_max' => 2]]));
        // ungültig und Köderfeld zählen nicht zur Obergrenze
        $this->post($this->validFields(['name' => '']), self::JSON, '10.1.0.1');
        $this->post($this->validFields(['website' => 'x']), self::JSON, '10.1.0.2');
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '10.1.0.3')->status);
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '10.1.0.4')->status);
        self::assertCount(2, $this->mail->sent);

        $json = $this->post($this->validFields(['name' => 'Gehalten Eins']), self::JSON, '10.1.0.5');
        self::assertSame(200, $json->status);
        self::assertSame('{"ok":true}', $json->body);
        $html = $this->post($this->validFields(['name' => 'Gehalten Zwei']), [], '10.1.0.6');
        self::assertSame(303, $html->status);
        self::assertSame('/kontakt/danke/', $html->headers['Location']);
        $en = $this->post($this->validFields(['lang' => 'en']), [], '10.1.0.8');
        self::assertSame('/en/contact/thanks/', $en->headers['Location']);

        self::assertSame(5, $this->countLeads());
        self::assertCount(2, $this->mail->sent, 'über der Obergrenze geht keine Mail hinaus');
        self::assertSame(['delivered', 'delivered', 'held', 'held', 'held'], $this->pdo->query('SELECT delivery FROM lead ORDER BY id')->fetchAll(PDO::FETCH_COLUMN));
        self::assertContains('lead_held id=3', $this->logLines);
        // Eingabefehler werden weiterhin angezeigt.
        self::assertSame(422, $this->post($this->validFields(['name' => '']), self::JSON, '10.1.0.7')->status);
    }

    public function testOnlyTheHardCeilingOf10TimesTheSoftCapAnswers429(): void
    {
        $this->app = $this->makeApp(config: $this->config(['rate_limit' => ['global_max' => 3]]));
        $this->seedGlobal(29); // 30 = 10 × 3 sind noch erlaubt (gehalten), die 31. nicht
        $r = $this->post($this->validFields(), self::JSON, '10.2.0.1');
        self::assertSame(200, $r->status);
        self::assertSame('held', $this->pdo->query('SELECT delivery FROM lead')->fetchColumn());
        $r = $this->post($this->validFields(), self::JSON, '10.2.0.2');
        self::assertSame(429, $r->status);
        self::assertArrayHasKey('Retry-After', $r->headers);
        self::assertSame('{"ok":false}', $r->body);
        $html = $this->post($this->validFields(), [], '10.2.0.3');
        self::assertSame(429, $html->status);
        self::assertStringContainsString('kontakt@example.com', $html->body);
        self::assertSame(1, $this->countLeads());
        self::assertContains('global_ceiling', $this->logLines);
        $this->now += 3600;
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '10.2.0.2')->status);
    }

    public function testOneAttackerSpreadOver16Networks64CannotLockOutARealVisitor(): void
    {
        // Frühere Lücke: 16 /64-Netze aus einem /56 füllten alle Plätze, der echte Besucher bekam 429.
        $this->app = $this->makeApp(config: $this->config(['rate_limit' => ['global_max' => 10]]));
        for ($n = 0; $n < 16; $n++) {
            for ($i = 0; $i < 5; $i++) {
                $this->post($this->validFields(), self::JSON, sprintf('2001:db8:77:%x::1', $n));
            }
        }
        $real = $this->post($this->validFields(['name' => 'Echte Besucherin']), self::JSON, '198.51.100.20');
        self::assertSame(200, $real->status);
        self::assertSame(
            'held',
            $this->pdo->query("SELECT delivery FROM lead WHERE name = 'Echte Besucherin'")->fetchColumn(),
        );
        // Der Angreifer selbst ist am /48 hängengeblieben: höchstens 15 Anfragen aus dem /48 wurden gespeichert.
        self::assertLessThanOrEqual(15, (int) $this->pdo->query("SELECT COUNT(*) FROM lead WHERE name <> 'Echte Besucherin'")->fetchColumn());
    }

    /** @return array<string,array{mixed,int}> */
    public static function globalLimits(): array
    {
        return ['null' => [0, 1], 'zu hoch' => [5000, 1000], 'kein Wert' => ['x', 60]];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('globalLimits')]
    public function testGlobalMaxIsClampedTo1To1000(mixed $configured, int $effective): void
    {
        $this->app = $this->makeApp(config: $this->config(['rate_limit' => ['global_max' => $configured]]));
        // Zähler direkt vorbelegen statt tausend Anfragen
        $this->seedGlobal($effective - 1);
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '10.2.0.1')->status);
        self::assertCount(1, $this->mail->sent); // letzter Platz unter der weichen Grenze
        self::assertSame(200, $this->post($this->validFields(), self::JSON, '10.2.0.2')->status);
        self::assertCount(1, $this->mail->sent); // darüber: gehalten
        self::assertSame('held', $this->pdo->query('SELECT delivery FROM lead ORDER BY id DESC LIMIT 1')->fetchColumn());
    }

    public function testRateLimitedNoticeIsNeutralInBothLanguages(): void
    {
        $this->seedGlobal(600);
        $app = $this->makeApp(config: $this->config(['rate_limit' => ['global_max' => 60]]));
        $this->app = $app;
        $de = $this->post($this->validFields(), []);
        self::assertSame(429, $de->status);
        self::assertStringContainsString('Im Moment gehen sehr viele Anfragen ein. Bitte versuchen Sie es später noch einmal oder schreiben Sie uns direkt.', $de->body);
        self::assertStringNotContainsString('Zu viele', $de->body);
        $en = $this->post($this->validFields(['lang' => 'en']), []);
        self::assertSame(429, $en->status);
        self::assertStringContainsString('We are receiving a lot of inquiries right now. Please try again later or write to us directly.', $en->body);
        self::assertStringNotContainsString('Too many', $en->body);
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

    public function testOriginWithCaseAndTrailingSlashAccepted(): void
    {
        self::assertSame(303, $this->post($this->validFields(), ['Origin' => 'https://WWW.example.com'])->status);
        self::assertSame(303, $this->post($this->validFields(), ['Origin' => 'https://www.example.com/'], '198.51.100.9')->status);
        self::assertSame(403, $this->post($this->validFields(), ['Origin' => 'https://www.example.com/path'], '198.51.100.10')->status);
    }

    public function testMultipartIsRejectedWith415(): void
    {
        $body = "--b\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\nx\r\n--b--\r\n";
        $r = $this->postRaw($body, ['Content-Type' => 'multipart/form-data; boundary=b']);
        self::assertSame(415, $r->status);
        self::assertSame(0, $this->countLeads());
    }

    public function testDuplicateFieldsLastValueWinsAndNothingBreaks(): void
    {
        $body = http_build_query($this->validFields()) . '&name=Zweiter+Name&name=Dritter+Name';
        $r = $this->postRaw($body, self::JSON);
        self::assertSame(200, $r->status);
        self::assertSame('Dritter Name', $this->pdo->query('SELECT name FROM lead')->fetchColumn());
    }

    public function testRateLimiterFailsClosedWhenCounterCannotBeWritten(): void
    {
        $this->pdo->exec('DROP TABLE rate_limit');
        $r = $this->post($this->validFields(), self::JSON);
        self::assertSame(500, $r->status);
        self::assertSame('{"ok":false}', $r->body);
        self::assertSame(0, $this->countLeads());
        self::assertSame([], $this->mail->sent);
    }

    public function testNoticePageEscapesContactAddress(): void
    {
        $cfg = $this->config(['contact_email' => 'a"><script>alert(1)</script>@example.com']);
        $app = $this->makeApp(new ArrayTransport(), $cfg, function (): PDO {
            throw new \RuntimeException('db down');
        });
        $headers = ['origin' => 'https://www.example.com', 'content-type' => 'application/x-www-form-urlencoded'];
        $r = $app->handle(new Request('POST', $headers, [], http_build_query($this->validFields()), '1.2.3.4'));
        self::assertSame(500, $r->status);
        self::assertStringNotContainsString('<script>', $r->body);
        self::assertStringContainsString('&lt;script&gt;', $r->body);
        self::assertStringContainsString("default-src 'none'", $r->headers['Content-Security-Policy']);
    }

    public function testControlCharactersGiveInvalidCodes(): void
    {
        $r = $this->post($this->validFields(['name' => "a\nb", 'company' => "c\0d", 'message' => "\xC3"]), self::JSON);
        self::assertSame(['name' => 'name.invalid', 'company' => 'company.invalid', 'message' => 'message.invalid'], json_decode($r->body, true)['errors']);
    }

    public function testOnlyPostIsAllowedAndThereIsNoTokenEndpoint(): void
    {
        foreach (['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as $m) {
            $r = $this->app->handle(new Request($m, [], [], '', '1.2.3.4'));
            self::assertSame(405, $r->status, $m);
            self::assertSame('POST', $r->headers['Allow']);
        }
        foreach ([['token' => '1'], ['token' => '0'], ['topic' => 'demo']] as $query) {
            $r = $this->app->handle(new Request('GET', ['accept' => 'application/json'], $query, '', '1.2.3.4'));
            self::assertSame(405, $r->status);
            self::assertSame('{"ok":false}', $r->body);
        }
        self::assertFalse(class_exists('Reticora\\Lead\\Signer'));
    }

    public function testGetNeedsNoDatabase(): void
    {
        $app = $this->makeApp(pdoFactory: function (): PDO {
            throw new \RuntimeException('db down');
        });
        self::assertSame(405, $app->handle(new Request('GET', [], ['token' => '1'], '', '1.2.3.4'))->status);
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
        $r = $this->postRaw('name[]=a&email[x]=b&company=C&topic[]=demo&lang=de', [], '203.0.113.50');
        self::assertSame(422, $r->status);
    }

    // ---- Zustellung (Ä-09: nur an das Vertriebspostfach) ---------------------------------------------------

    public function testOnlyTheSalesInboxGetsMailWithReplyToTheValidatedAddress(): void
    {
        $this->post($this->validFields(), self::JSON);
        self::assertCount(1, $this->mail->sent);
        $m = $this->mail->sent[0];
        self::assertSame('vertrieb@example.com', $m->to);
        self::assertSame('erika@example.com', $m->replyTo);
    }

    public function testNoMailIsEverAddressedToTheEnteredAddress(): void
    {
        $cases = [
            [$this->validFields(['email' => 'opfer@example.org']), self::JSON],
            [$this->validFields(['email' => 'opfer@example.org', 'lang' => 'en']), []],
            [$this->validFields(['email' => 'opfer@example.org', 'website' => 'x']), self::JSON],
            [$this->validFields(['email' => 'opfer@example.org', 'name' => '']), []],
        ];
        foreach ($cases as $i => [$fields, $headers]) {
            $this->post($fields, $headers, "198.51.100.$i");
        }
        $failing = new ArrayTransport(fn () => true);
        $this->app = $this->makeApp($failing);
        $this->post($this->validFields(['email' => 'opfer@example.org']), self::JSON, '198.51.100.99');
        foreach ($this->mail->sent as $m) {
            self::assertSame('vertrieb@example.com', $m->to);
        }
        self::assertCount(2, $this->mail->sent);
        self::assertSame([], $failing->sent);
    }

    public function testMailFailureKeepsLeadMarksNotDeliveredAndStillThanks(): void
    {
        $mail = new ArrayTransport(fn () => true);
        $this->app = $this->makeApp($mail);
        $r = $this->post($this->validFields(), self::JSON);
        self::assertSame(200, $r->status);
        self::assertSame(1, $this->countLeads());
        self::assertSame('not_delivered', $this->pdo->query('SELECT delivery FROM lead')->fetchColumn());
        self::assertContains('mail_failed lead=1 RuntimeException', $this->logLines);
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

    public function testMailMisconfigurationGivesGeneric500AndStoresNothing(): void
    {
        $app = $this->makeApp(transportFactory: function (): MailTransport {
            throw new \InvalidArgumentException('SMTP ohne Anmeldung, Passwort=hunter2');
        });
        $headers = ['origin' => 'https://www.example.com', 'content-type' => 'application/x-www-form-urlencoded'];
        $r = $app->handle(new Request('POST', $headers + ['accept' => 'application/json'], [], http_build_query($this->validFields()), '1.2.3.4'));
        self::assertSame(500, $r->status);
        self::assertSame('{"ok":false}', $r->body);
        $r = $app->handle(new Request('POST', $headers, [], http_build_query($this->validFields()), '1.2.3.5'));
        self::assertSame(500, $r->status);
        self::assertStringContainsString('kontakt@example.com', $r->body);
        self::assertSame(0, $this->countLeads());
        self::assertStringNotContainsString('hunter2', $r->body . implode('', $this->logLines));
        // Eingabefehler brauchen keinen Mailversand und werden weiter angezeigt.
        $r = $app->handle(new Request('POST', $headers, [], http_build_query($this->validFields(['name' => ''])), '1.2.3.6'));
        self::assertSame(422, $r->status);
    }

    public function testLogContainsNoFormContentOrIp(): void
    {
        $this->post($this->validFields(['message' => 'GEHEIMER-TEXT']), self::JSON);
        $this->post($this->validFields(['website' => 'x']), self::JSON);
        $this->post($this->validFields(['name' => '']), [], '203.0.113.7');
        $log = implode("\n", $this->logLines);
        foreach (['GEHEIMER-TEXT', 'erika@example.com', 'Erika', 'Beispiel', '203.0.113.7'] as $needle) {
            self::assertStringNotContainsString($needle, $log);
        }
    }
}
