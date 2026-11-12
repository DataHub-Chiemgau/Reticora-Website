<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PHPUnit\Framework\TestCase;
use Reticora\Lead\Signer;

final class SignerTest extends TestCase
{
    private const SECRET = 'test-secret-test-secret-test-secret-123456';

    public function testIssueAndVerifyWindow(): void
    {
        $s = new Signer(self::SECRET);
        $t = $s->issue(1000);
        self::assertSame(1000, $t['ts']);
        self::assertSame(Signer::TOO_EARLY, $s->verify((string) $t['ts'], $t['sig'], 1002));
        self::assertSame(Signer::OK, $s->verify((string) $t['ts'], $t['sig'], 1003));
        self::assertSame(Signer::OK, $s->verify((string) $t['ts'], $t['sig'], 1000 + 7200));
        self::assertSame(Signer::TOO_OLD, $s->verify((string) $t['ts'], $t['sig'], 1000 + 7201));
    }

    public function testForgedSignatureAndOtherSecret(): void
    {
        $s = new Signer(self::SECRET);
        $t = $s->issue(1000);
        self::assertSame(Signer::INVALID, $s->verify('1000', str_repeat('0', 64), 1100));
        self::assertSame(Signer::INVALID, $s->verify('999', $t['sig'], 1100));
        self::assertSame(Signer::INVALID, $s->verify('abc', $t['sig'], 1100));
        self::assertSame(Signer::INVALID, (new Signer('other-secret-other-secret-other-secret-1'))->verify('1000', $t['sig'], 1100));
    }
}
