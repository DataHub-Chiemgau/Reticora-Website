<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\ArrayTransport;
use Reticora\Lead\Config;
use Reticora\Lead\MailMessage;
use Reticora\Lead\Mailer;

final class MailerTest extends TestCase
{
    private function cfg(): Config
    {
        return Config::fromArray([
            'site_url' => 'https://www.example.com', 'contact_email' => 'k@example.com', 'db' => [],
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
        self::assertStringContainsString("Name: Erika Beispiel\r\n", $m->body);
        self::assertStringContainsString("Nachricht:\r\nHallo", $m->body);
    }

    public function testSubjectAndSenderNeverContainUserInput(): void
    {
        $t = new ArrayTransport();
        (new Mailer($t, $this->cfg(), fn () => 1_800_000_000))->sendToSales($this->lead(['name' => 'NAME-X', 'company' => 'COMPANY-X', 'message' => 'MSG-X']));
        $m = $t->sent[0];
        self::assertDoesNotMatchRegularExpression('/NAME-X|COMPANY-X|MSG-X/', $m->subject . $m->fromName . $m->fromAddress . $m->to);
    }

    public function testThereIsNoConfirmationMail(): void
    {
        // Ä-09: Es geht keine automatische Mail an die eingegebene Adresse.
        self::assertFalse(method_exists(Mailer::class, 'sendConfirmation'));
        $methods = array_map(fn (\ReflectionMethod $m) => $m->getName(), (new \ReflectionClass(Mailer::class))->getMethods(\ReflectionMethod::IS_PUBLIC));
        self::assertSame(['__construct', 'sendToSales'], $methods);
    }

    public function testHtmlInMessageIsCarriedVerbatimInThePlainTextBody(): void
    {
        $t = new ArrayTransport();
        $html = '<img src=x onerror=alert(1)> <b>x</b>';
        (new Mailer($t, $this->cfg(), fn () => 1_800_000_000))->sendToSales($this->lead(['message' => $html]));
        self::assertStringContainsString($html, $t->sent[0]->body);
        self::assertStringNotContainsString('<img', $t->sent[0]->subject);
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
}
