<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use Reticora\Lead\LeadRepository;

/** Anfrage speichern (utf8mb4) und genau eine Mail über SMTP mit STARTTLS und Anmeldung an das Vertriebspostfach. */
final class LeadDeliveryTest extends IntegrationTestCase
{
    private const NAME = 'Jürgen Größe-Öztürk 🚀 👩‍💻';
    private const COMPANY = 'Müller & Söhne GmbH ✨ 日本 Ελλάδα';
    private const MESSAGE = "Grüße aus Köln 🎉\nZweite Zeile: ÄÖÜäöüß € 𝄞 👨‍👩‍👧 <b>kein HTML</b>";
    private const EMAIL = 'juergen.groesse@example.com';

    public function testLeadWithUmlautsAndEmojiIsStoredByteExactAndMailedOnceToSales(): void
    {
        $app = $this->app($this->config());
        $r = $this->post($app, $this->fields(['name' => self::NAME, 'company' => self::COMPANY, 'message' => self::MESSAGE, 'email' => self::EMAIL, 'topic' => 'security']));

        self::assertSame(200, $r->status, implode("\n", $this->logLines));
        self::assertSame('{"ok":true}', $r->body);

        $leads = $this->leads();
        self::assertCount(1, $leads);
        $row = $leads[0];
        self::assertSame(self::NAME, $row['name']);
        self::assertSame(self::COMPANY, $row['company']);
        self::assertSame(self::MESSAGE, $row['message']);
        self::assertSame(bin2hex(self::NAME), bin2hex((string) $row['name']), '4-Byte-Zeichen unverändert (utf8mb4, nicht utf8mb3)');
        self::assertSame(self::EMAIL, $row['email']);
        self::assertSame('security', $row['topic']);
        self::assertSame('de', $row['lang']);
        self::assertSame(LeadRepository::DELIVERED, $row['delivery']);
        self::assertSame(gmdate('Y-m-d H:i:s', $this->now), $row['created_at']);

        $mails = $this->mails();
        self::assertCount(1, $mails, 'genau eine Mail');
        $m = $mails[0];
        self::assertSame([self::SALES], $m['recipients'], 'nur an das Vertriebspostfach');
        self::assertSame([self::SALES], $m['to']);
        self::assertSame([self::EMAIL], $m['reply_to']);
        self::assertSame('versand@example.com', $m['from']);
        self::assertSame('[Website] Neue Anfrage: Sicherheit und Datenschutz', $m['subject']);
        self::assertStringContainsString('Name: ' . self::NAME . "\n", $m['text']);
        self::assertStringContainsString('Unternehmen: ' . self::COMPANY . "\n", $m['text']);
        self::assertStringContainsString("Nachricht:\n" . self::MESSAGE, $m['text']);
        self::assertStringContainsString('E-Mail: ' . self::EMAIL, $m['text']);
        if ($m['tls'] !== null) {
            self::assertTrue($m['tls'], 'Mail kam über STARTTLS');
            self::assertSame(self::env('RETICORA_IT_SMTP_USER'), $m['auth_user'], 'Mail kam mit Anmeldung');
        }
        foreach ($mails as $mail) {
            self::assertNotContains(self::EMAIL, $mail['recipients'], 'keine Mail an die eingegebene Adresse');
        }
        self::assertSame(['lead_stored id=' . $row['id'] . ' delivery=delivered'], $this->logLines);
    }

    public function testFormPostWithoutJsonRedirectsToThanksPagePerLanguage(): void
    {
        $app = $this->app($this->config());
        $de = $this->post($app, $this->fields(['email' => 'de@example.com']), '203.0.113.8', []);
        $en = $this->post($app, $this->fields(['email' => 'en@example.com', 'lang' => 'en', 'name' => 'Zoë 😀']), '203.0.113.9', []);

        self::assertSame(303, $de->status);
        self::assertSame('/kontakt/danke/', $de->headers['Location']);
        self::assertSame(303, $en->status);
        self::assertSame('/en/contact/thanks/', $en->headers['Location']);
        self::assertSame(['de', 'en'], array_column($this->leads(), 'lang'));
        self::assertSame('Zoë 😀', $this->leads()[1]['name']);
        self::assertCount(2, $this->mails());
    }

    public function testEmojiInEmailIsRejectedBeforeAnythingIsStored(): void
    {
        $r = $this->post($this->app($this->config()), $this->fields(['email' => 'jürgen🚀@example.com']));

        self::assertSame(422, $r->status);
        self::assertSame('{"ok":false,"errors":{"email":"email.invalid"}}', $r->body);
        self::assertSame([], $this->leads());
        self::assertSame([], $this->mails());
    }

    public function testLongestAllowedValuesFitTheColumns(): void
    {
        // Grenzwerte des Validators (Codepunkte, wie VARCHAR(200) in utf8mb4 zählt) aus 4-Byte-Zeichen. Über HTTP kämen sie nicht
        // an (Anfragekörper höchstens 16 KB), daher direkt über das Repository: Strict Mode von MariaDB darf nichts abschneiden.
        $name = str_repeat('😀', 200);
        $company = str_repeat('ß', 200);
        $message = str_repeat('𝄞', 4000);
        $id = (new LeadRepository($this->pdo))->insert(['lang' => 'de', 'name' => $name, 'email' => str_repeat('a', 242) . '@example.com', 'company' => $company, 'topic' => 'other', 'message' => $message], $this->now);
        $row = (new LeadRepository($this->pdo))->find($id);

        self::assertSame($name, $row['name'] ?? null);
        self::assertSame($company, $row['company'] ?? null);
        self::assertSame($message, $row['message'] ?? null);
        self::assertSame(254, strlen((string) ($row['email'] ?? '')));
    }
}
