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
        $c = Config::fromArray(['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'retention_days' => 90, 'db' => [], 'mail' => []]);
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
        $c = Config::fromArray(['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'retention_days' => 90, 'db' => [], 'mail' => [], 'rate_limit' => $rl]);
        self::assertSame($max, $c->rateLimitMax());
        self::assertSame($global, $c->globalMax());
    }

    /** @return array<string,array{mixed,int}> */
    public static function heldLimits(): array
    {
        return ['Standard' => [null, 500], 'gültig' => [800, 800], 'zu klein' => [3, 50], 'zu groß' => [100000, 5000], 'kein Wert' => ['x', 500]];
    }

    /** S-01: Obergrenze für den Bestand zurückgehaltener Anfragen, Standard 500, begrenzt auf 50–5000. */
    #[DataProvider('heldLimits')]
    public function testHeldMaxIsClamped(mixed $configured, int $effective): void
    {
        $rl = $configured === null ? [] : ['held_max' => $configured];
        $c = Config::fromArray(['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'retention_days' => 90, 'db' => [], 'mail' => [], 'rate_limit' => $rl]);
        self::assertSame($effective, $c->heldMax());
    }

    /** @return array<string,array{mixed}> */
    public static function badRetention(): array
    {
        return ['fehlt' => [null], 'null Tage' => [0], 'negativ' => [-5], 'zu groß' => [3651], 'Text' => ['90'], 'Kommazahl' => [90.5], 'leer' => ['']];
    }

    /** DS-09: Die Frist ist Pflicht; ohne gültigen Wert startet nichts (geschlossen scheitern, klare Meldung). */
    #[DataProvider('badRetention')]
    public function testRetentionDaysIsRequiredAndBounded(mixed $value): void
    {
        $v = $this->filledExample();
        if ($value === null) {
            unset($v['retention_days']);
        } else {
            $v['retention_days'] = $value;
        }
        try {
            Config::fromArray($v);
            self::fail('ungültige retention_days akzeptiert: ' . var_export($value, true));
        } catch (InvalidArgumentException $e) {
            self::assertStringContainsString("'retention_days'", $e->getMessage());
            self::assertStringContainsString('1–3650', $e->getMessage());
        }
    }

    public function testRetentionDaysIsReadAsGiven(): void
    {
        foreach ([1, 30, 90, 3650] as $days) {
            $v = $this->filledExample();
            $v['retention_days'] = $days;
            self::assertSame($days, Config::fromArray($v)->retentionDays());
        }
    }

    public function testRequiredKeysAndSections(): void
    {
        foreach (['site_url', 'contact_email', 'retention_days', 'db', 'mail'] as $key) {
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
