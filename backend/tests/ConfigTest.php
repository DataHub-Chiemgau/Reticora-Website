<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\Config;

final class ConfigTest extends TestCase
{
    public function testExampleConfigLoadsAndHasEmptySignature(): void
    {
        $c = Config::load(__DIR__ . '/../config.example.php');
        self::assertSame(90, $c->int('retention_days'));
        self::assertSame('', $c->string('signature.de'));
        self::assertSame('https://www.reticora.de', $c->siteOrigin());
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
