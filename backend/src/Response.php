<?php

declare(strict_types=1);

namespace Reticora\Lead;

final class Response
{
    /** @param array<string,string> $headers */
    private function __construct(
        public readonly int $status,
        public readonly array $headers,
        public readonly string $body,
    ) {
    }

    /** @param array<string,string> $extra */
    public static function make(int $status, string $contentType, string $body, array $extra = []): self
    {
        $headers = [
            'Content-Type' => $contentType,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-store',
            'Referrer-Policy' => 'no-referrer',
        ];
        foreach ($extra as $k => $v) {
            $headers[$k] = $v;
        }
        return new self($status, $headers, $body);
    }

    /** @param array<string,mixed> $data @param array<string,string> $extra */
    public static function json(int $status, array $data, array $extra = []): self
    {
        return self::make($status, 'application/json; charset=utf-8', json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES), $extra);
    }

    public static function text(int $status, string $text, array $extra = []): self
    {
        return self::make($status, 'text/plain; charset=utf-8', $text . "\n", $extra);
    }

    public static function html(int $status, string $html, array $extra = []): self
    {
        return self::make($status, 'text/html; charset=utf-8', $html, $extra + [
            'Content-Security-Policy' => "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        ]);
    }

    /** Weiterleitung 303; $location stammt immer aus festen Konstanten. */
    public static function redirect(string $location): self
    {
        return self::make(303, 'text/plain; charset=utf-8', '', ['Location' => $location]);
    }
}
