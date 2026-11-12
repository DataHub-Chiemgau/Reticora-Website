<?php

declare(strict_types=1);

namespace Reticora\Lead;

/** Zeitstempel-Token der Seite (Zeitfalle): ts + HMAC. */
final class Signer
{
    public const MIN_AGE = 3;
    public const MAX_AGE = 7200;

    public const OK = 'ok';
    public const TOO_EARLY = 'too_early';
    public const TOO_OLD = 'too_old';
    public const INVALID = 'invalid';

    private readonly string $key;

    public function __construct(string $secret)
    {
        $this->key = hash_hmac('sha256', 'reticora/form-token/v1', $secret, true);
    }

    /** @return array{ts:int, sig:string} */
    public function issue(int $now): array
    {
        return ['ts' => $now, 'sig' => $this->sign((string) $now)];
    }

    /** @return string eine der Konstanten OK, TOO_EARLY, TOO_OLD, INVALID */
    public function verify(string $ts, string $sig, int $now): string
    {
        if (preg_match('/^[0-9]{1,12}$/', $ts) !== 1 || !hash_equals($this->sign($ts), $sig)) {
            return self::INVALID;
        }
        $age = $now - (int) $ts;
        if ($age < self::MIN_AGE) {
            return self::TOO_EARLY;
        }
        if ($age > self::MAX_AGE) {
            return self::TOO_OLD;
        }
        return self::OK;
    }

    private function sign(string $ts): string
    {
        return hash_hmac('sha256', 'ts|' . $ts, $this->key);
    }
}
