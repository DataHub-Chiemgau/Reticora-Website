<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use PDO;
use Reticora\Lead\Database;
use Reticora\Lead\Purger;
use Reticora\Lead\RateLimiter;
use Reticora\Lead\RateLimitKey;

/** Täglicher Schlüsselwechsel des Rate-Limits in MariaDB (Spec Ä-10): eine Zeile, überschrieben, alte Hashes nicht nachrechenbar. */
final class KeyRotationTest extends IntegrationTestCase
{
    private const DAY1 = 1_800_000_000; // 2027-01-15 08:00 UTC

    public function testOneRowOverwrittenOncePerUtcDay(): void
    {
        $key = new RateLimitKey($this->pdo);
        $first = $key->current(self::DAY1);
        self::assertSame(32, strlen($first));
        self::assertSame($first, $key->current(self::DAY1 + 15 * 3600), 'gleicher UTC-Tag');
        $hashDay1 = (new RateLimiter($this->pdo))->hash('198.51.100.7', self::DAY1);

        self::assertTrue($key->rotateIfStale(self::DAY1 + 86400));
        self::assertFalse($key->rotateIfStale(self::DAY1 + 86400 + 60));
        $rows = $this->pdo->query('SELECT id, day, secret FROM rate_limit_key')->fetchAll(PDO::FETCH_ASSOC);
        self::assertCount(1, $rows);
        self::assertSame('2027-01-16', $rows[0]['day']);
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $rows[0]['secret']);
        self::assertNotSame(bin2hex($first), $rows[0]['secret']);
        self::assertNotSame($hashDay1, (new RateLimiter($this->pdo))->hash('198.51.100.7', self::DAY1 + 86400));
    }

    public function testPurgeRotatesOnNewDayAndConcurrentConnectionsAgree(): void
    {
        (new RateLimitKey($this->pdo))->current(self::DAY1);
        self::assertSame(0, (new Purger($this->pdo))->run(self::DAY1 + 3600, 90)['key_rotated']);
        self::assertSame(1, (new Purger($this->pdo))->run(self::DAY1 + 86400, 90)['key_rotated']);

        // zwei Verbindungen (zwei gleichzeitige Anfragen) am nächsten Tag: genau ein Wechsel, beide sehen denselben Schlüssel
        $other = Database::connect($this->config());
        $a = new RateLimitKey($this->pdo);
        $b = new RateLimitKey($other);
        $rotatedA = $a->rotateIfStale(self::DAY1 + 2 * 86400);
        $rotatedB = $b->rotateIfStale(self::DAY1 + 2 * 86400);
        self::assertSame([true, false], [$rotatedA, $rotatedB]);
        self::assertSame($a->current(self::DAY1 + 2 * 86400), $b->current(self::DAY1 + 2 * 86400));
        self::assertSame(1, (int) $this->pdo->query('SELECT COUNT(*) FROM rate_limit_key')->fetchColumn());
    }

    public function testFirstKeyOnEmptyTableFromTwoConnections(): void
    {
        $other = Database::connect($this->config());
        $k1 = (new RateLimitKey($this->pdo))->current(self::DAY1);
        $k2 = (new RateLimitKey($other))->current(self::DAY1);
        self::assertSame($k1, $k2);
        self::assertSame(1, (int) $this->pdo->query('SELECT COUNT(*) FROM rate_limit_key')->fetchColumn());
    }
}
