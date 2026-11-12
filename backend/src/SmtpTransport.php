<?php

declare(strict_types=1);

namespace Reticora\Lead;

use RuntimeException;

/**
 * SMTP-Versand über Sockets: Verschlüsselung 'ssl' (implizites TLS, Port 465) oder
 * 'starttls' (Port 587), Anmeldung per AUTH LOGIN. 'none' ist nur für Tests gegen einen lokalen Fake-Server.
 */
final class SmtpTransport implements MailTransport
{
    /** @var resource|null */
    private $socket = null;

    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $encryption,
        private readonly string $user,
        private readonly string $pass,
        private readonly string $heloName,
        private readonly int $timeout = 10,
    ) {
        if (!in_array($encryption, ['ssl', 'starttls', 'none'], true)) {
            throw new \InvalidArgumentException('Unbekannte Verschlüsselung');
        }
    }

    public function send(MailMessage $m): void
    {
        $this->connect();
        try {
            $this->expect(220);
            $this->command('EHLO ' . $this->heloName, 250);
            if ($this->encryption === 'starttls') {
                $this->command('STARTTLS', 220);
                if (@stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) !== true) {
                    throw new RuntimeException('STARTTLS fehlgeschlagen');
                }
                $this->command('EHLO ' . $this->heloName, 250);
            }
            if ($this->user !== '') {
                $this->command('AUTH LOGIN', 334);
                $this->command(base64_encode($this->user), 334);
                $this->command(base64_encode($this->pass), 235);
            }
            $this->command('MAIL FROM:<' . $this->address($m->fromAddress) . '>', 250);
            $this->command('RCPT TO:<' . $this->address($m->to) . '>', [250, 251]);
            $this->command('DATA', 354);
            $this->write(self::dotStuff(self::render($m)) . ".\r\n");
            $this->expect(250);
            try {
                $this->command('QUIT', 221);
            } catch (RuntimeException) {
                // Ergebnis von QUIT ist unerheblich, die Nachricht ist angenommen.
            }
        } finally {
            $this->close();
        }
    }

    /** Vollständige Nachricht (Kopfzeilen + Rumpf) mit strikt CRLF, ohne Schlusspunkt. */
    public static function render(MailMessage $m): string
    {
        $headers = [
            'Date: ' . gmdate('D, d M Y H:i:s', $m->date) . ' +0000',
            'From: ' . self::encodeWord($m->fromName) . ' <' . $m->fromAddress . '>',
            'To: <' . $m->to . '>',
        ];
        if ($m->replyTo !== null && $m->replyTo !== '') {
            $headers[] = 'Reply-To: <' . $m->replyTo . '>';
        }
        $headers[] = 'Subject: ' . self::encodeWord($m->subject);
        $headers[] = 'Message-ID: <' . $m->messageId . '>';
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: base64';
        $headers[] = 'Auto-Submitted: auto-generated';
        $body = chunk_split(base64_encode($m->body), 76, "\r\n");
        return implode("\r\n", $headers) . "\r\n\r\n" . $body;
    }

    /** RFC 2047 "B"-Wörter, höchstens 75 Zeichen je Wort; ASCII bleibt unverändert. */
    public static function encodeWord(string $s): string
    {
        if (preg_match('/^[\x20-\x7E]*$/', $s) === 1) {
            return $s;
        }
        $words = [];
        $chunk = '';
        foreach (mb_str_split($s, 1, 'UTF-8') as $ch) {
            if (strlen($chunk . $ch) > 42) {
                $words[] = $chunk;
                $chunk = '';
            }
            $chunk .= $ch;
        }
        if ($chunk !== '') {
            $words[] = $chunk;
        }
        return implode("\r\n ", array_map(static fn (string $w): string => '=?UTF-8?B?' . base64_encode($w) . '?=', $words));
    }

    /** Punkt am Zeilenanfang verdoppeln; nur CRLF als Zeilenende. */
    public static function dotStuff(string $data): string
    {
        $data = preg_replace('/\r\n|\r|\n/', "\r\n", $data) ?? $data;
        $data = preg_replace('/^\./m', '..', $data) ?? $data;
        return rtrim($data, "\r\n") . "\r\n";
    }

    private function address(string $a): string
    {
        if (preg_match('/[\r\n<>\s]/', $a) === 1) {
            throw new RuntimeException('Ungültige Adresse');
        }
        return $a;
    }

    private function connect(): void
    {
        $scheme = $this->encryption === 'ssl' ? 'ssl' : 'tcp';
        $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $this->host]]);
        $errno = 0;
        $errstr = '';
        $s = @stream_socket_client("$scheme://{$this->host}:{$this->port}", $errno, $errstr, $this->timeout, STREAM_CLIENT_CONNECT, $ctx);
        if ($s === false) {
            throw new RuntimeException('SMTP-Verbindung fehlgeschlagen');
        }
        stream_set_timeout($s, $this->timeout);
        $this->socket = $s;
    }

    private function close(): void
    {
        if (is_resource($this->socket)) {
            fclose($this->socket);
        }
        $this->socket = null;
    }

    private function write(string $data): void
    {
        $len = strlen($data);
        $off = 0;
        while ($off < $len) {
            $n = @fwrite($this->socket, substr($data, $off));
            if ($n === false || $n === 0) {
                throw new RuntimeException('SMTP-Schreibfehler');
            }
            $off += $n;
        }
    }

    /** @param int|list<int> $codes */
    private function command(string $line, int|array $codes): void
    {
        if (preg_match('/[\r\n]/', $line) === 1) {
            throw new RuntimeException('Zeilenumbruch im SMTP-Befehl');
        }
        $this->write($line . "\r\n");
        $this->expect($codes);
    }

    /** @param int|list<int> $codes */
    private function expect(int|array $codes): void
    {
        $codes = (array) $codes;
        $code = 0;
        for ($i = 0; $i < 100; $i++) {
            $line = fgets($this->socket, 1024);
            if ($line === false) {
                throw new RuntimeException('SMTP-Zeitüberschreitung oder Verbindungsabbruch');
            }
            if (preg_match('/^(\d{3})([ -])/', $line, $mm) !== 1) {
                throw new RuntimeException('SMTP-Antwort nicht lesbar');
            }
            $code = (int) $mm[1];
            if ($mm[2] === ' ') {
                break;
            }
        }
        if (!in_array($code, $codes, true)) {
            throw new RuntimeException("SMTP-Fehlercode $code");
        }
    }
}
