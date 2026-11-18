<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

use PDO;
use Reticora\Lead\Database;
use Reticora\Lead\Purger;
use Reticora\Lead\RateLimiter;
use Reticora\Lead\RateLimitKey;

/** Stündlicher Schlüsselwechsel des Rate-Limits in MariaDB (Spec Ä-10, Ä-36): eine Zeile, überschrieben, alte Hashes nicht nachrechenbar. */
final class KeyRotationTest extends IntegrationTestCase
{
    private const HOUR1 = 1_800_000_000; // 2027-01-15 08:00 UTC, Beginn eines Stundenfensters

    public function testOneRowOverwrittenOncePerHourWindow(): void
    {
        $key = new RateLimitKey($this->pdo);
        $first = $key->current(self::HOUR1);
        self::assertSame(32, strlen($first));
        self::assertSame($first, $key->current(self::HOUR1 + 3599), 'gleiches Stundenfenster');
        $hashHour1 = (new RateLimiter($this->pdo))->hash('198.51.100.7', self::HOUR1);

        self::assertTrue($key->rotateIfStale(self::HOUR1 + 3600));
        self::assertFalse($key->rotateIfStale(self::HOUR1 + 3600 + 60));
        $rows = $this->pdo->query('SELECT id, window_start, secret FROM rate_limit_key')->fetchAll(PDO::FETCH_ASSOC);
        self::assertCount(1, $rows);
        self::assertSame(self::HOUR1 + 3600, (int) $rows[0]['window_start']);
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $rows[0]['secret']);
        self::assertNotSame(bin2hex($first), $rows[0]['secret']);
        self::assertNotSame($hashHour1, (new RateLimiter($this->pdo))->hash('198.51.100.7', self::HOUR1 + 3600));
    }

    public function testPurgeRotatesOnNewHourAndConcurrentConnectionsAgree(): void
    {
        (new RateLimitKey($this->pdo))->current(self::HOUR1);
        self::assertSame(0, (new Purger($this->pdo))->run(self::HOUR1 + 1800, 90)['key_rotated']);
        self::assertSame(1, (new Purger($this->pdo))->run(self::HOUR1 + 3600, 90)['key_rotated']);

        // zwei Verbindungen (zwei gleichzeitige Anfragen) im nächsten Fenster: genau ein Wechsel, beide sehen denselben Schlüssel
        $other = Database::connect($this->config());
        $a = new RateLimitKey($this->pdo);
        $b = new RateLimitKey($other);
        $rotatedA = $a->rotateIfStale(self::HOUR1 + 2 * 3600);
        $rotatedB = $b->rotateIfStale(self::HOUR1 + 2 * 3600);
        self::assertSame([true, false], [$rotatedA, $rotatedB]);
        self::assertSame($a->current(self::HOUR1 + 2 * 3600), $b->current(self::HOUR1 + 2 * 3600));
        self::assertSame(1, (int) $this->pdo->query('SELECT COUNT(*) FROM rate_limit_key')->fetchColumn());
    }

    public function testFirstKeyOnEmptyTableFromTwoConnections(): void
    {
        $other = Database::connect($this->config());
        $k1 = (new RateLimitKey($this->pdo))->current(self::HOUR1);
        $k2 = (new RateLimitKey($other))->current(self::HOUR1);
        self::assertSame($k1, $k2);
        self::assertSame(1, (int) $this->pdo->query('SELECT COUNT(*) FROM rate_limit_key')->fetchColumn());
    }
}
