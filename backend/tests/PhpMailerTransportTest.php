<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PHPUnit\Framework\TestCase;
use Reticora\Lead\MailMessage;
use Reticora\Lead\Config;
use Reticora\Lead\PhpMailerTransport;
use RuntimeException;

/** Versand über PHPMailer gegen einen lokalen Fake-Server (ohne TLS, daher allow_insecure). */
final class PhpMailerTransportTest extends TestCase
{
    /** @var resource|null */
    private $proc = null;
    private string $out = '';

    protected function tearDown(): void
    {
        if (is_resource($this->proc)) {
            proc_terminate($this->proc);
            proc_close($this->proc);
        }
        if ($this->out !== '' && is_file($this->out)) {
            unlink($this->out);
        }
    }

    private function startServer(string $mode = ''): int
    {
        $this->out = sys_get_temp_dir() . '/reticora-smtp-' . bin2hex(random_bytes(4)) . '.json';
        // Port 0: der Hilfsserver bindet selbst und meldet den Port (kein Wettlauf zwischen Prüfen und Binden).
        $cmd = [PHP_BINARY, __DIR__ . '/fake_smtp_server.php', '0', $this->out, $mode];
        $this->proc = proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        $line = (string) fgets($pipes[1]);
        if (preg_match('/^ready (\d+)$/', trim($line), $m) !== 1) {
            self::fail('Der SMTP-Hilfsserver ist nicht bereit: ' . trim($line . ' ' . (string) stream_get_contents($pipes[2])));
        }
        return (int) $m[1];
    }

    public function testHelperServerFailsLoudlyWhenThePortIsTaken(): void
    {
        $taken = stream_socket_server('tcp://127.0.0.1:0');
        $port = (int) substr(strrchr((string) stream_socket_get_name($taken, false), ':'), 1);
        $proc = proc_open([PHP_BINARY, __DIR__ . '/fake_smtp_server.php', (string) $port, sys_get_temp_dir() . '/unused.json'], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        $stdout = (string) stream_get_contents($pipes[1]);
        $stderr = (string) stream_get_contents($pipes[2]);
        $code = proc_close($proc);
        fclose($taken);
        self::assertNotSame(0, $code);
        self::assertStringNotContainsString('ready', $stdout);
        self::assertStringContainsString('bind fehlgeschlagen', $stderr);
    }

    /** @return array{log: list<string>, message: string} */
    private function serverResult(): array
    {
        // Der Hilfsserver schreibt die Datei, nachdem die Verbindung endet. Die Datei kann
        // schon existieren, aber noch leer oder unvollständig sein: warten, bis sie lesbar ist.
        for ($i = 0; $i < 100; $i++) {
            $data = is_file($this->out) ? json_decode((string) file_get_contents($this->out), true) : null;
            if (is_array($data)) {
                return $data;
            }
            usleep(50_000);
        }
        self::fail('Der SMTP-Hilfsserver hat kein Ergebnis geschrieben.');
    }

    public function testDeliversWithAuthLoginAndStrictCrlf(): void
    {
        $port = $this->startServer();
        $t = new PhpMailerTransport('127.0.0.1', $port, 'none', 'user@example.com', 'pw', 'www.example.com', 5, 15, true);
        $t->send(new MailMessage('versand@example.com', 'Reticora', 'vertrieb@example.com', 'erika@example.com', 'Betreff', ".Punkt am Anfang\nZeile", 'id1@example.com', 1_800_000_000));
        $r = $this->serverResult();
        self::assertSame('EHLO www.example.com', $r['log'][0]);
        self::assertNotContains('STARTTLS', $r['log']);
        self::assertContains('AUTH LOGIN', $r['log']);
        self::assertContains('MAIL FROM:<versand@example.com>', $r['log']);
        self::assertContains('RCPT TO:<vertrieb@example.com>', $r['log']);
        self::assertContains('DATA-END', $r['log']);
        self::assertSame(0, preg_match('/(?<!\r)\n/', $r['message']));
        self::assertMatchesRegularExpression("/\r\nReply-To: <?erika@example\\.com>?\r\n/", $r['message']);
        self::assertMatchesRegularExpression("/(^|\r\n)To: <?vertrieb@example\\.com>?\r\n/", $r['message']);
        self::assertStringContainsString("Message-ID: <id1@example.com>\r\n", $r['message']);
        self::assertStringNotContainsString('X-Mailer', $r['message']);
        self::assertContains('QUIT', $r['log']);
    }

    public function testAuthFailureThrows(): void
    {
        $port = $this->startServer('fail-auth');
        $t = new PhpMailerTransport('127.0.0.1', $port, 'none', 'u', 'wrong', 'h.example.com', 5, 15, true);
        $this->expectException(RuntimeException::class);
        $t->send(new MailMessage('v@example.com', 'N', 'a@example.com', null, 's', 'b', 'i@example.com', 1));
    }

    public function testConnectionFailureThrows(): void
    {
        $sock = stream_socket_server('tcp://127.0.0.1:0');
        $port = (int) substr(strrchr((string) stream_socket_get_name($sock, false), ':'), 1);
        fclose($sock);
        $t = new PhpMailerTransport('127.0.0.1', $port, 'none', '', '', 'h', 1, 15, true);
        $this->expectException(RuntimeException::class);
        $t->send(new MailMessage('v@example.com', 'N', 'a@example.com', null, 's', 'b', 'i@example.com', 1));
    }

    public function testRejectsUnknownEncryption(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new PhpMailerTransport('h', 25, 'plain', 'u', 'p', 'h');
    }

    public function testOverallDeadlineStopsTricklingServer(): void
    {
        $port = $this->startServer('trickle');
        $t = new PhpMailerTransport('127.0.0.1', $port, 'none', 'u', 'p', 'h.example.com', 5, 1, true);
        $start = microtime(true);
        try {
            $t->send(new MailMessage('v@example.com', 'N', 'a@example.com', null, 's', 'b', 'i@example.com', 1));
            self::fail('keine Ausnahme');
        } catch (RuntimeException) {
            self::assertLessThan(4.0, microtime(true) - $start);
        }
    }

    public function testInsecureConfigurationsRefusedUnlessExplicitlyAllowed(): void
    {
        foreach ([['none', 'u', 'p'], ['ssl', '', 'p'], ['starttls', '', 'p'], ['ssl', 'u', ''], ['starttls', 'u', '']] as [$enc, $user, $pass]) {
            try {
                new PhpMailerTransport('h.example.com', 465, $enc, $user, $pass, 'h');
                self::fail("$enc/$user akzeptiert");
            } catch (\InvalidArgumentException) {
                self::assertTrue(true);
            }
        }
        self::assertInstanceOf(PhpMailerTransport::class, new PhpMailerTransport('h.example.com', 465, 'ssl', 'u', 'p', 'h'));
        self::assertInstanceOf(PhpMailerTransport::class, new PhpMailerTransport('h.example.com', 25, 'none', '', '', 'h', 10, 15, true));
    }

    public function testFromConfigRequiresHostAndAuthenticatedEncryptedSmtp(): void
    {
        $base = ['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'db' => []];
        $ok = ['host' => 'smtp.example.com', 'port' => 587, 'encryption' => 'starttls', 'user' => 'u@example.com', 'pass' => 'p'];
        self::assertInstanceOf(PhpMailerTransport::class, PhpMailerTransport::fromConfig(Config::fromArray($base + ['mail' => $ok])));
        foreach ([['host' => ''], ['encryption' => 'none'], ['user' => ''], ['pass' => ''], ['encryption' => 'tls1']] as $bad) {
            try {
                PhpMailerTransport::fromConfig(Config::fromArray($base + ['mail' => $bad + $ok]));
                self::fail(json_encode($bad) . ' akzeptiert');
            } catch (\InvalidArgumentException) {
                self::assertTrue(true);
            }
        }
        // nur mit allow_insecure (Tests) ohne Verschlüsselung und Anmeldung
        $insecure = ['encryption' => 'none', 'user' => '', 'pass' => '', 'allow_insecure' => true] + $ok;
        self::assertInstanceOf(PhpMailerTransport::class, PhpMailerTransport::fromConfig(Config::fromArray($base + ['mail' => $insecure])));
        // allow_insecure muss wirklich true sein, nicht "1" oder "yes"
        $insecure['allow_insecure'] = 'yes';
        $this->expectException(\InvalidArgumentException::class);
        PhpMailerTransport::fromConfig(Config::fromArray($base + ['mail' => $insecure]));
    }

    public function testMimeIsPlainTextUtf8Base64WithCrlfAndFixedHeaders(): void
    {
        $t = new PhpMailerTransport('smtp.example.com', 465, 'ssl', 'u', 'p', 'www.example.com');
        $html = '<img src=x onerror=alert(1)>';
        $m = new MailMessage('v@example.com', 'Reticora Würzburg', 'a@example.com', 'r@example.com', 'Ihre Anfrage – Größe', "Zeile1\nZeile2\r\n.Punkt $html", 'id@example.com', 1_800_000_000);
        $raw = $t->mime($m);
        self::assertSame(0, preg_match('/(?<!\r)\n/', $raw));
        [$head, $body] = explode("\r\n\r\n", $raw, 2);
        self::assertMatchesRegularExpression('/^Content-Type: text\/plain; charset=utf-8\r?$/mi', $head);
        self::assertStringContainsString('Content-Transfer-Encoding: base64', $head);
        self::assertStringNotContainsString('text/html', $raw);
        self::assertMatchesRegularExpression('/^Subject: =\?utf-8\?/mi', $head);
        self::assertStringContainsString('Message-ID: <id@example.com>', $head);
        self::assertStringNotContainsString('<img', $head);
        self::assertStringContainsString($html, base64_decode(str_replace("\r\n", '', $body)));
    }
}
