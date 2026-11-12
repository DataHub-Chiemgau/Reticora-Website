<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\Config;

final class ConfigTest extends TestCase
{
    /** @return array<string,mixed> */
    private function example(): array
    {
        return require __DIR__ . '/../config.example.php';
    }

    public function testExampleLoadsOnlyWithAnOverriddenSecret(): void
    {
        $v = $this->example();
        $v['secret'] = 'test-secret-test-secret-test-secret-123456';
        $c = Config::fromArray($v);
        self::assertSame(90, $c->int('retention_days'));
        self::assertSame('', $c->string('signature.de'));
        self::assertSame('https://www.reticora.de', $c->siteOrigin());
    }

    public function testUnchangedExampleIsRejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Config::load(__DIR__ . '/../config.example.php');
    }

    /** @return array<string,array{string}> */
    public static function weakSecrets(): array
    {
        return [
            'Platzhalter' => ['AENDERN-mindestens-32-zufaellige-zeichen-AENDERN'],
            'Platzhalter gemischt' => ['xK9aEnDeRnQ7wP2zLm4vB8tYc3Rh6JfNd'],
            'zu kurz' => ['abcdefghijklmnopqrstuvwxyz12345'],
            'wenige Zeichen' => [str_repeat('abcabcabc', 6)],
            'nur ein Zeichen' => [str_repeat('s', 64)],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('weakSecrets')]
    public function testWeakSecretsRejected(string $secret): void
    {
        $this->expectException(InvalidArgumentException::class);
        Config::fromArray(['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'secret' => $secret, 'db' => [], 'mail' => []]);
    }

    public function testShortSecretRejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Config::fromArray(['site_url' => 'https://x.example', 'contact_email' => 'a@example.com', 'secret' => 'kurz', 'db' => [], 'mail' => []]);
    }

    public function testExampleIsNotAPlaceholderSecretLeak(): void
    {
        // config.example.php darf keine echten Zugangsdaten enthalten.
        $src = (string) file_get_contents(__DIR__ . '/../config.example.php');
        self::assertStringNotContainsString('reticora.de/', $src . '/');
        self::assertDoesNotMatchRegularExpression('/@(?!example\.com)[a-z0-9-]+\.[a-z]{2,}/i', $src);
    }
}
