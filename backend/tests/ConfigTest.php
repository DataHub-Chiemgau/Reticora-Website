<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\Config;

final class ConfigTest extends TestCase
{
    /** @return array<string,mixed> */
    private function example(): array
    {
        return require __DIR__ . '/../config.example.php';
    }

    /** @return array<string,mixed> */
    private function filledExample(): array
    {
        $v = $this->example();
        $v['db'] = ['dsn' => 'mysql:host=localhost;dbname=reticora;charset=utf8mb4', 'user' => 'reticora', 'pass' => 'db-pass-from-host'];
        $v['mail']['pass'] = 'smtp-pass-from-host';
        return $v;
    }

    public function testExampleLoadsOnceThePlaceholdersAreReplaced(): void
    {
        $c = Config::fromArray($this->filledExample());
        self::assertSame(90, $c->int('retention_days'));
        self::assertSame('https://www.reticora.de', $c->siteOrigin());
        self::assertSame(5, $c->rateLimitMax());
        self::assertSame(60, $c->globalMax());
        self::assertFalse($c->get('mail.allow_insecure', false));
    }

    public function testUnchangedExampleIsRejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Config::load(__DIR__ . '/../config.example.php');
    }

    public function testPlaceholderAnywhereIsRejected(): void
    {
        $v = $this->filledExample();
        $v['mail']['to_address'] = 'AENDERN@example.com';
        $this->expectException(InvalidArgumentException::class);
        Config::fromArray($v);
    }

    public function testSecretIsNoLongerNeeded(): void
    {
        // Der Rate-Limit-Schlüssel ist zufällig und liegt in der Datenbank (Ä-10); die Zeitfalle entfällt (Ä-07).
        $c = Config::fromArray(['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'db' => [], 'mail' => []]);
        self::assertSame('https://x.example', $c->siteOrigin());
        self::assertStringNotContainsString("'secret'", (string) file_get_contents(__DIR__ . '/../config.example.php'));
    }

    /** @return array<string,array{array<string,mixed>,int,int}> */
    public static function limits(): array
    {
        return [
            'Standard' => [[], 5, 60],
            'gültig' => [['max' => 7, 'global_max' => 200], 7, 200],
            'zu klein' => [['max' => 0, 'global_max' => -1], 1, 1],
            'zu groß' => [['max' => 100000, 'global_max' => 100000], 100, 1000],
            'Grenzen' => [['max' => 100, 'global_max' => 1000], 100, 1000],
            'kein Wert' => [['max' => 'x', 'global_max' => null], 5, 60],
        ];
    }

    /** @param array<string,mixed> $rl */
    #[DataProvider('limits')]
    public function testRateLimitsAreClamped(array $rl, int $max, int $global): void
    {
        $c = Config::fromArray(['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'db' => [], 'mail' => [], 'rate_limit' => $rl]);
        self::assertSame($max, $c->rateLimitMax());
        self::assertSame($global, $c->globalMax());
    }

    public function testRequiredKeysAndSections(): void
    {
        foreach (['site_url', 'contact_email', 'db', 'mail'] as $key) {
            $v = $this->filledExample();
            unset($v[$key]);
            try {
                Config::fromArray($v);
                self::fail("$key fehlt, aber akzeptiert");
            } catch (InvalidArgumentException) {
                self::assertTrue(true);
            }
        }
    }

    public function testExampleIsNotAPlaceholderSecretLeak(): void
    {
        // config.example.php darf keine echten Zugangsdaten enthalten.
        $src = (string) file_get_contents(__DIR__ . '/../config.example.php');
        self::assertStringNotContainsString('reticora.de/', $src . '/');
        self::assertDoesNotMatchRegularExpression('/@(?!example\.com)[a-z0-9-]+\.[a-z]{2,}/i', $src);
    }
}
