<?php

declare(strict_types=1);

namespace Reticora\Lead;

use InvalidArgumentException;

/** Unveränderliche Konfiguration aus config.php (liegt außerhalb des Webroots). */
final class Config
{
    /** @param array<string,mixed> $values */
    private function __construct(private readonly array $values)
    {
    }

    /** @param array<string,mixed> $values */
    public static function fromArray(array $values): self
    {
        foreach (['site_url', 'contact_email', 'secret'] as $key) {
            if (!isset($values[$key]) || !is_string($values[$key]) || $values[$key] === '') {
                throw new InvalidArgumentException("Konfiguration: '$key' fehlt");
            }
        }
        if (strlen($values['secret']) < 32) {
            throw new InvalidArgumentException("Konfiguration: 'secret' muss mindestens 32 Zeichen haben");
        }
        if (parse_url($values['site_url'], PHP_URL_HOST) === null || parse_url($values['site_url'], PHP_URL_HOST) === false) {
            throw new InvalidArgumentException("Konfiguration: 'site_url' ist keine gültige Adresse");
        }
        foreach (['db', 'mail'] as $section) {
            if (!isset($values[$section]) || !is_array($values[$section])) {
                throw new InvalidArgumentException("Konfiguration: Abschnitt '$section' fehlt");
            }
        }
        return new self($values);
    }

    public static function load(string $path): self
    {
        if (!is_file($path)) {
            throw new InvalidArgumentException('Konfigurationsdatei nicht gefunden');
        }
        $values = (static function () use ($path) {
            return require $path;
        })();
        if (!is_array($values)) {
            throw new InvalidArgumentException('Konfigurationsdatei liefert kein Array');
        }
        return self::fromArray($values);
    }

    /** Zugriff mit Punktschreibweise, z. B. "mail.host". */
    public function get(string $path, mixed $default = null): mixed
    {
        $node = $this->values;
        foreach (explode('.', $path) as $part) {
            if (!is_array($node) || !array_key_exists($part, $node)) {
                return $default;
            }
            $node = $node[$part];
        }
        return $node;
    }

    public function string(string $path, string $default = ''): string
    {
        $v = $this->get($path, $default);
        return is_scalar($v) ? (string) $v : $default;
    }

    public function int(string $path, int $default = 0): int
    {
        $v = $this->get($path, $default);
        return is_numeric($v) ? (int) $v : $default;
    }

    /** Origin der Website ("https://www.reticora.de") aus site_url. */
    public function siteOrigin(): string
    {
        $u = parse_url($this->string('site_url'));
        $origin = strtolower(($u['scheme'] ?? 'https') . '://' . ($u['host'] ?? ''));
        if (isset($u['port'])) {
            $origin .= ':' . $u['port'];
        }
        return $origin;
    }
}
