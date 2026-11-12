<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PHPUnit\Framework\TestCase;
use Reticora\Lead\MailMessage;
use Reticora\Lead\SmtpTransport;
use RuntimeException;

final class SmtpTransportTest extends TestCase
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
        $sock = stream_socket_server('tcp://127.0.0.1:0', $e, $s);
        $port = (int) substr(strrchr((string) stream_socket_get_name($sock, false), ':'), 1);
        fclose($sock);
        $this->out = sys_get_temp_dir() . '/reticora-smtp-' . bin2hex(random_bytes(4)) . '.json';
        $cmd = [PHP_BINARY, __DIR__ . '/fake_smtp_server.php', (string) $port, $this->out, $mode];
        $this->proc = proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        fgets($pipes[1]); // "ready"
        return $port;
    }

    /** @return array{log: list<string>, message: string} */
    private function serverResult(): array
    {
        for ($i = 0; $i < 50 && !is_file($this->out); $i++) {
            usleep(100_000);
        }
        return json_decode((string) file_get_contents($this->out), true);
    }

    public function testDeliversWithAuthLoginAndStrictCrlf(): void
    {
        $port = $this->startServer();
        $t = new SmtpTransport('127.0.0.1', $port, 'none', 'user@example.com', 'pw', 'www.example.com', 5, 15, true);
        $t->send(new MailMessage('versand@example.com', 'Reticora', 'vertrieb@example.com', 'erika@example.com', 'Betreff', ".Punkt am Anfang\nZeile", 'id1@example.com', 1_800_000_000));
        $r = $this->serverResult();
        self::assertSame('EHLO www.example.com', $r['log'][0]);
        self::assertContains('AUTH LOGIN', $r['log']);
        self::assertContains('MAIL FROM:<versand@example.com>', $r['log']);
        self::assertContains('RCPT TO:<vertrieb@example.com>', $r['log']);
        self::assertContains('DATA-END', $r['log']);
        self::assertSame(0, preg_match('/(?<!\r)\n/', $r['message']));
        self::assertStringContainsString("Reply-To: <erika@example.com>\r\n", $r['message']);
    }

    public function testAuthFailureThrows(): void
    {
        $port = $this->startServer('fail-auth');
        $t = new SmtpTransport('127.0.0.1', $port, 'none', 'u', 'wrong', 'h.example.com', 5, 15, true);
        $this->expectException(RuntimeException::class);
        $t->send(new MailMessage('v@example.com', 'N', 'a@example.com', null, 's', 'b', 'i@example.com', 1));
    }

    public function testConnectionFailureThrows(): void
    {
        $sock = stream_socket_server('tcp://127.0.0.1:0');
        $port = (int) substr(strrchr((string) stream_socket_get_name($sock, false), ':'), 1);
        fclose($sock);
        $t = new SmtpTransport('127.0.0.1', $port, 'none', '', '', 'h', 1, 15, true);
        $this->expectException(RuntimeException::class);
        $t->send(new MailMessage('v@example.com', 'N', 'a@example.com', null, 's', 'b', 'i@example.com', 1));
    }

    public function testRejectsUnknownEncryption(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new SmtpTransport('h', 25, 'plain', 'u', 'p', 'h');
    }

    public function testOverallDeadlineStopsTricklingServer(): void
    {
        $port = $this->startServer('trickle');
        $t = new SmtpTransport('127.0.0.1', $port, 'none', 'u', 'p', 'h.example.com', 5, 1, true);
        $start = microtime(true);
        try {
            $t->send(new MailMessage('v@example.com', 'N', 'a@example.com', null, 's', 'b', 'i@example.com', 1));
            self::fail('keine Ausnahme');
        } catch (RuntimeException) {
            self::assertLessThan(3.0, microtime(true) - $start);
        }
    }

    public function testInsecureConfigurationsRefusedUnlessExplicitlyAllowed(): void
    {
        foreach ([['none', 'u'], ['ssl', ''], ['starttls', '']] as [$enc, $user]) {
            try {
                new SmtpTransport('h.example.com', 465, $enc, $user, 'p', 'h');
                self::fail("$enc/$user akzeptiert");
            } catch (\InvalidArgumentException) {
                self::assertTrue(true);
            }
        }
        self::assertInstanceOf(SmtpTransport::class, new SmtpTransport('h.example.com', 465, 'ssl', 'u', 'p', 'h'));
        self::assertInstanceOf(SmtpTransport::class, new SmtpTransport('h.example.com', 25, 'none', '', '', 'h', 10, 15, true));
    }
}
