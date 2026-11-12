<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\ArrayTransport;
use Reticora\Lead\Config;
use Reticora\Lead\MailMessage;
use Reticora\Lead\Mailer;
use Reticora\Lead\SmtpTransport;

final class MailerTest extends TestCase
{
    private function cfg(array $sig = ['de' => '', 'en' => '']): Config
    {
        return Config::fromArray([
            'site_url' => 'https://www.example.com', 'contact_email' => 'k@example.com',
            'secret' => str_repeat('s', 40), 'db' => [], 'signature' => $sig,
            'mail' => ['from_address' => 'versand@example.com', 'from_name' => 'Reticora Website', 'to_address' => 'vertrieb@example.com'],
        ]);
    }

    /** @return array<string,string> */
    private function lead(array $o = []): array
    {
        return $o + ['lang' => 'de', 'name' => 'Erika Beispiel', 'email' => 'erika@example.com', 'company' => 'Beispiel GmbH', 'topic' => 'security', 'message' => 'Hallo'];
    }

    public function testSalesMailHeadersAreFixedExceptReplyTo(): void
    {
        $t = new ArrayTransport();
        (new Mailer($t, $this->cfg(), fn () => 1_800_000_000))->sendToSales($this->lead());
        $m = $t->sent[0];
        self::assertSame('vertrieb@example.com', $m->to);
        self::assertSame('versand@example.com', $m->fromAddress);
        self::assertSame('erika@example.com', $m->replyTo);
        self::assertSame('[Website] Neue Anfrage: Sicherheit und Datenschutz', $m->subject);
    }

    public function testSubjectNeverContainsUserInput(): void
    {
        $t = new ArrayTransport();
        $mailer = new Mailer($t, $this->cfg(), fn () => 1_800_000_000);
        $mailer->sendToSales($this->lead(['name' => 'NAME-X', 'company' => 'COMPANY-X', 'message' => 'MSG-X']));
        $mailer->sendConfirmation($this->lead(['name' => 'NAME-X']));
        foreach ($t->sent as $m) {
            self::assertDoesNotMatchRegularExpression('/NAME-X|COMPANY-X|MSG-X/', $m->subject . $m->fromName . $m->fromAddress);
        }
    }

    public function testConfirmationDoesNotEchoMessageAndGoesToRequester(): void
    {
        $t = new ArrayTransport();
        (new Mailer($t, $this->cfg(), fn () => 1_800_000_000))->sendConfirmation($this->lead(['message' => 'VERTRAULICHER-TEXT']));
        $m = $t->sent[0];
        self::assertSame('erika@example.com', $m->to);
        self::assertNull($m->replyTo);
        self::assertStringNotContainsString('VERTRAULICHER-TEXT', $m->body);
        self::assertStringContainsString('Guten Tag Erika Beispiel', $m->body);
    }

    public function testEnglishConfirmation(): void
    {
        $t = new ArrayTransport();
        (new Mailer($t, $this->cfg(), fn () => 1))->sendConfirmation($this->lead(['lang' => 'en']));
        self::assertSame('Your enquiry to Reticora', $t->sent[0]->subject);
        self::assertStringContainsString('Hello Erika Beispiel', $t->sent[0]->body);
    }

    public function testSignatureFromConfigOnlyWhenSet(): void
    {
        $t = new ArrayTransport();
        (new Mailer($t, $this->cfg(), fn () => 1))->sendConfirmation($this->lead());
        self::assertStringNotContainsString("\n-- ", $t->sent[0]->body);
        $t = new ArrayTransport();
        (new Mailer($t, $this->cfg(['de' => "Beispiel GmbH\r\nMusterweg 1", 'en' => 'x']), fn () => 1))->sendConfirmation($this->lead());
        self::assertStringContainsString("-- \r\nBeispiel GmbH\r\nMusterweg 1", $t->sent[0]->body);
    }

    public function testHtmlInMessageOnlyAppearsInPlainTextMailVerbatim(): void
    {
        $t = new ArrayTransport();
        $html = '<img src=x onerror=alert(1)> <b>x</b>';
        (new Mailer($t, $this->cfg(), fn () => 1_800_000_000))->sendToSales($this->lead(['message' => $html]));
        $raw = SmtpTransport::render($t->sent[0]);
        self::assertStringContainsString('Content-Type: text/plain; charset=UTF-8', $raw);
        self::assertStringNotContainsString('text/html', $raw);
        self::assertStringContainsString($html, $t->sent[0]->body);
        // Im übertragenen Rumpf (base64) steht das Zeichenmuster nie als Roh-HTML in den Kopfzeilen.
        [$head] = explode("\r\n\r\n", $raw, 2);
        self::assertStringNotContainsString('<img', $head);
    }

    public function testMailMessageRejectsLineBreaksInHeaderValues(): void
    {
        foreach ([['to', "a@example.com\r\nBcc: x@example.com"], ['replyTo', "a@example.com\nX: y"], ['subject', "s\r\nBcc: x"], ['fromName', "n\rx"]] as [$field, $value]) {
            $args = ['fromAddress' => 'v@example.com', 'fromName' => 'N', 'to' => 'a@example.com', 'replyTo' => null, 'subject' => 's', 'body' => 'b', 'messageId' => 'id@example.com', 'date' => 1];
            $args[$field] = $value;
            try {
                new MailMessage(...$args);
                self::fail("$field akzeptiert");
            } catch (InvalidArgumentException) {
                self::assertTrue(true);
            }
        }
    }

    public function testRenderUsesOnlyCrlfAndEncodesUmlautSubjectAndBody(): void
    {
        $m = new MailMessage('v@example.com', 'Reticora Würzburg', 'a@example.com', 'r@example.com', 'Ihre Anfrage – Größe', "Zeile1\nZeile2\r\n.Punkt", 'id@example.com', 1_800_000_000);
        $raw = SmtpTransport::render($m);
        self::assertSame(0, preg_match('/(?<!\r)\n/', $raw));
        self::assertStringContainsString('Subject: =?UTF-8?B?', $raw);
        self::assertStringContainsString('Reply-To: <r@example.com>', $raw);
        [, $body] = explode("\r\n\r\n", $raw, 2);
        self::assertSame("Zeile1\nZeile2\r\n.Punkt", base64_decode($body));
    }

    public function testDotStuffing(): void
    {
        self::assertSame("a\r\n..b\r\n...\r\nc\r\n", SmtpTransport::dotStuff("a\n.b\r\n..\rc"));
    }
}
