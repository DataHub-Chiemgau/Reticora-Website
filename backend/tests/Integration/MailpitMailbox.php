<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use RuntimeException;

/** Mailpit über seine HTTP-API (GET /api/v1/messages, GET /api/v1/message/{ID}, DELETE /api/v1/messages). */
final class MailpitMailbox implements Mailbox
{
    public function __construct(private readonly string $baseUrl)
    {
    }

    public static function fromEnvironment(): self
    {
        return new self(rtrim((string) getenv('RETICORA_IT_MAILPIT_URL'), '/'));
    }

    public function clear(): void
    {
        $this->request('DELETE', '/api/v1/messages');
    }

    public function messages(): array
    {
        $list = $this->request('GET', '/api/v1/messages?limit=1000');
        $out = [];
        foreach (array_reverse($list['messages'] ?? []) as $summary) {
            $m = $this->request('GET', '/api/v1/message/' . rawurlencode((string) $summary['ID']));
            $addr = static fn (?array $l): array => array_values(array_map(static fn (array $a): string => strtolower((string) $a['Address']), $l ?? []));
            $out[] = [
                'recipients' => array_values(array_unique([...$addr($m['To'] ?? []), ...$addr($m['Cc'] ?? []), ...$addr($m['Bcc'] ?? [])])),
                'to' => $addr($m['To'] ?? []),
                'reply_to' => $addr($m['ReplyTo'] ?? []),
                'from' => strtolower((string) ($m['From']['Address'] ?? '')),
                'subject' => (string) ($m['Subject'] ?? ''),
                'text' => str_replace("\r\n", "\n", (string) ($m['Text'] ?? '')),
                'tls' => null,
                'auth_user' => null,
            ];
        }
        return $out;
    }

    /** @return array<string,mixed> */
    private function request(string $method, string $path): array
    {
        $ctx = stream_context_create(['http' => ['method' => $method, 'ignore_errors' => true, 'timeout' => 10, 'header' => "Accept: application/json\r\n"]]);
        $body = @file_get_contents($this->baseUrl . $path, false, $ctx);
        $headers = function_exists('http_get_last_response_headers') ? (http_get_last_response_headers() ?? []) : ($http_response_header ?? []);
        $status = isset($headers[0]) && preg_match('/\s(\d{3})\b/', $headers[0], $m) === 1 ? (int) $m[1] : 0;
        if ($body === false || $status !== 200) {
            throw new RuntimeException("Mailpit $method $path: Status $status");
        }
        $data = json_decode($body, true);
        return is_array($data) ? $data : [];
    }
}
