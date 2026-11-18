<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use Reticora\Lead\LeadRepository;

/**
 * Fehlverhalten beim Versand (Spec Ä-10, Ä-11): Die Anfrage bleibt mit not_delivered gespeichert, die Besucherin sieht
 * die Bestätigung, purge.php meldet sie mit Exit-Code 1, retry.php stellt nach der Korrektur zu.
 */
final class DeliveryFailureTest extends IntegrationTestCase
{
    public function testWrongSmtpPasswordKeepsLeadUntilRetryWithFixedConfigDelivers(): void
    {
        $wrong = $this->configArray([], ['pass' => 'falsch-' . self::secret('RETICORA_IT_SMTP_PASS')]);
        $r = $this->post($this->app($this->config([], $wrong['mail'])), $this->fields(['email' => 'retry@example.com', 'name' => 'Ünal 🚀']));

        self::assertSame(200, $r->status, 'die Besucherin sieht die Bestätigung');
        $lead = $this->leads()[0];
        self::assertSame(LeadRepository::NOT_DELIVERED, $lead['delivery']);
        self::assertSame([], $this->mails());
        self::assertMatchesRegularExpression('/^mail_failed lead=\d+ RuntimeException$/', $this->logLines[0]);

        $wrongFile = $this->configFile($wrong);
        [$code, $out, $err] = $this->runBin('purge', $wrongFile);
        self::assertSame(1, $code, 'purge.php meldet nicht zugestellte Anfragen');
        self::assertMatchesRegularExpression('/ purge leads_deleted=0 rate_limit_deleted=0 logs_deleted=0 undelivered=1 held=0 not_delivered=1 pending=0 key_rotated=[01]\n$/', $out);
        self::assertStringContainsString('ACHTUNG: 1 Anfragen sind nicht zugestellt', $err);

        [$code, $out] = $this->runBin('retry', $wrongFile);
        self::assertSame(1, $code, 'retry.php mit falschem Passwort scheitert');
        self::assertStringEndsWith(" retry sent=0 failed=1 remaining=1\n", $out);
        self::assertSame(LeadRepository::NOT_DELIVERED, $this->leads()[0]['delivery']);
        self::assertSame([], $this->mails());

        $fixed = $this->configFile($this->configArray());
        [$code, $out, $err] = $this->runBin('retry', $fixed);
        self::assertSame(0, $code, $err);
        self::assertStringEndsWith(" retry sent=1 failed=0 remaining=0\n", $out);
        self::assertSame(LeadRepository::DELIVERED, $this->leads()[0]['delivery']);
        $mails = $this->mails();
        self::assertCount(1, $mails);
        self::assertSame([self::SALES], $mails[0]['recipients']);
        self::assertSame(['retry@example.com'], $mails[0]['reply_to']);
        self::assertStringContainsString('Name: Ünal 🚀', $mails[0]['text']);
        // ursprüngliche Eingangszeit, nicht die Zeit des Nachversands
        self::assertStringContainsString('Eingang: ' . $lead['created_at'] . ' UTC', $mails[0]['text']);

        [$code, $out] = $this->runBin('purge', $fixed);
        self::assertSame(0, $code);
        self::assertStringContainsString(' undelivered=0 held=0 not_delivered=0 ', $out);
    }

    public function testCertificateIsVerified(): void
    {
        $host = getenv('RETICORA_IT_SMTP_MISMATCH_HOST');
        if (!is_string($host) || $host === '') {
            self::markTestSkipped('RETICORA_IT_SMTP_MISMATCH_HOST nicht gesetzt');
        }
        // Derselbe Server unter einem Namen, der nicht im Zertifikat steht: Versand muss scheitern (keine abgeschaltete Prüfung).
        $r = $this->post($this->app($this->config([], ['host' => $host])), $this->fields());

        self::assertSame(200, $r->status);
        self::assertSame(LeadRepository::NOT_DELIVERED, $this->leads()[0]['delivery']);
        self::assertSame([], $this->mails());
    }

    public function testSilentServerFailsWithinTheTimeout(): void
    {
        // Nimmt Verbindungen an (Warteschlange des Kernels), sagt aber nie etwas: Zeitlimit statt Hängen.
        $server = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
        self::assertNotFalse($server, $errstr);
        $port = (int) substr((string) strrchr((string) stream_socket_get_name($server, false), ':'), 1);

        $start = microtime(true);
        $r = $this->post($this->app($this->config([], ['host' => '127.0.0.1', 'port' => $port, 'timeout' => 2, 'deadline' => 3])), $this->fields());
        $elapsed = microtime(true) - $start;
        fclose($server);

        self::assertSame(200, $r->status);
        self::assertSame(LeadRepository::NOT_DELIVERED, $this->leads()[0]['delivery']);
        self::assertLessThan(6.0, $elapsed, 'Versand bricht nach dem Zeitlimit ab');
        self::assertGreaterThanOrEqual(1.5, $elapsed);
    }
}
