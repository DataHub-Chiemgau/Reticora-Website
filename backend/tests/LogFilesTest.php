<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PHPUnit\Framework\TestCase;
use Reticora\Lead\LogFiles;

/** DS-04: Protokolle als Tagesdateien, gelöscht nach retention_days. */
final class LogFilesTest extends TestCase
{
    private const NOW = 1_800_000_000; // 2027-01-15 08:00 UTC

    private string $dir;

    protected function setUp(): void
    {
        $this->dir = sys_get_temp_dir() . '/reticora-logfiles-' . bin2hex(random_bytes(4));
        mkdir($this->dir);
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->dir . '/*') ?: []);
        rmdir($this->dir);
    }

    public function testDailyPathFromConfiguredPath(): void
    {
        self::assertSame('/x/y/lead-2027-01-15.log', LogFiles::daily('/x/y/lead.log', self::NOW));
        self::assertSame('/x/y/app-2027-01-16.log', LogFiles::daily('/x/y/app.log', self::NOW + 86400));
        self::assertSame('/x/y/protokoll-2027-01-15.log', LogFiles::daily('/x/y/protokoll', self::NOW), 'ohne Endung');
        self::assertSame('', LogFiles::daily('', self::NOW), 'leer: PHP-Fehlerprotokoll des Hosters');
    }

    public function testPurgeDeletesOnlyOwnDailyFilesOlderThanTheRetention(): void
    {
        $day = static fn (int $ago): string => gmdate('Y-m-d', self::NOW - $ago * 86400);
        $gone = ['lead-' . $day(8) . '.log', 'purge-' . $day(30) . '.log', 'retry-' . $day(8) . '.log'];
        $kept = [
            'lead-' . $day(7) . '.log', 'lead-' . $day(0) . '.log', 'retry-' . $day(1) . '.log',
            'lead.log', 'config.php', 'fremd-' . $day(30) . '.log', 'lead-' . $day(30) . '.log.gz', 'lead-2027-13-45.log',
        ];
        foreach ([...$gone, ...$kept] as $f) {
            file_put_contents($this->dir . '/' . $f, "x\n");
        }
        self::assertSame(3, LogFiles::purge($this->dir . '/lead.log', self::NOW, 7));
        foreach ($gone as $f) {
            self::assertFileDoesNotExist($this->dir . '/' . $f);
        }
        foreach ($kept as $f) {
            self::assertFileExists($this->dir . '/' . $f);
        }
    }

    public function testPurgeWithoutLogPathOrDirectoryDoesNothing(): void
    {
        self::assertSame(0, LogFiles::purge('', self::NOW, 1));
        self::assertSame(0, LogFiles::purge($this->dir . '/gibt-es-nicht/lead.log', self::NOW, 1));
    }
}
