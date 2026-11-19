<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

/**
 * Lokaler SMTP-Fänger (scripts/integration-local.sh): je Mail eine JSON-Datei mit Umschlag (mail_from, rcpt_tos),
 * Rohdaten (data), ob STARTTLS aktiv war (tls) und mit welchem Benutzer angemeldet wurde (auth_user).
 */
final class DirectoryMailbox implements Mailbox
{
    public function __construct(private readonly string $dir)
    {
    }

    public static function fromEnvironment(): self
    {
        return new self((string) getenv('RETICORA_IT_MAIL_DIR'));
    }

    public function clear(): void
    {
        foreach (glob($this->dir . '/*.json') ?: [] as $f) {
            unlink($f);
        }
    }

    public function messages(): array
    {
        $files = glob($this->dir . '/*.json') ?: [];
        sort($files);
        $out = [];
        foreach ($files as $f) {
            $j = json_decode((string) file_get_contents($f), true);
            [$head, $body] = array_pad(preg_split("/\r?\n\r?\n/", (string) $j['data'], 2) ?: [], 2, '');
            $headers = iconv_mime_decode_headers($head, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8') ?: [];
            $h = array_change_key_case($headers, CASE_LOWER);
            $one = static fn (string $name): string => is_array($h[$name] ?? null) ? (string) $h[$name][0] : (string) ($h[$name] ?? '');
            if (strtolower($one('content-transfer-encoding')) === 'base64') {
                $body = (string) base64_decode(preg_replace('/\s+/', '', $body) ?? '', true);
            }
            $out[] = [
                'recipients' => array_values(array_unique(array_map('strtolower', array_merge($j['rcpt_tos'], self::addresses($one('to')), self::addresses($one('cc')))))),
                'to' => self::addresses($one('to')),
                'reply_to' => self::addresses($one('reply-to')),
                'from' => self::addresses($one('from'))[0] ?? '',
                'subject' => $one('subject'),
                'text' => str_replace("\r\n", "\n", $body),
                'tls' => (bool) $j['tls'],
                'auth_user' => isset($j['auth_user']) ? (string) $j['auth_user'] : null,
            ];
        }
        return $out;
    }

    /** @return list<string> */
    private static function addresses(string $value): array
    {
        preg_match_all('/[A-Za-z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+/', $value, $m);
        return array_values(array_map('strtolower', $m[0]));
    }
}
