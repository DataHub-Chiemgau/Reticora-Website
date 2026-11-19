<?php

declare(strict_types=1);

namespace Reticora\Lead;

/** Eingehende Anfrage als reines Wertobjekt (keine Globals in der Logik). */
final class Request
{
    public const MAX_BODY = 16384;

    /**
     * @param array<string,string> $headers Kleinschreibung der Namen
     * @param array<string,string> $query
     */
    public function __construct(
        public readonly string $method,
        public readonly array $headers,
        public readonly array $query,
        public readonly string $body,
        public readonly string $ip,
    ) {
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function wantsJson(): bool
    {
        return stripos($this->header('accept') ?? '', 'application/json') !== false;
    }

    /** @return array<string,string> */
    public function form(): array
    {
        $parsed = [];
        parse_str($this->body, $parsed);
        $out = [];
        foreach ($parsed as $k => $v) {
            // Nur Skalare; Arrays (name[]=...) werden verworfen.
            if (is_string($v)) {
                $out[(string) $k] = $v;
            }
        }
        return $out;
    }

    public static function fromGlobals(): self
    {
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (!is_string($v)) {
                continue;
            }
            if (strncmp($k, 'HTTP_', 5) === 0) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = $v;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE']) && is_string($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH']) && is_string($_SERVER['CONTENT_LENGTH'])) {
            $headers['content-length'] = $_SERVER['CONTENT_LENGTH'];
        }
        $body = '';
        $declared = (int) ($headers['content-length'] ?? 0);
        if ($declared <= self::MAX_BODY) {
            // Höchstens MAX_BODY+1 Bytes lesen: reicht, um "zu groß" zu erkennen.
            $body = (string) file_get_contents('php://input', false, null, 0, self::MAX_BODY + 1);
        }
        $query = [];
        foreach ($_GET as $k => $v) {
            if (is_string($v)) {
                $query[(string) $k] = $v;
            }
        }
        return new self(
            strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            $headers,
            $query,
            $body,
            (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
        );
    }
}
