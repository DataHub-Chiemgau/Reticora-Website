<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\Validator;

final class ValidatorTest extends TestCase
{
    /** @return array<string,string> */
    private function ok(array $o = []): array
    {
        return $o + ['name' => 'Erika', 'email' => 'erika@example.com', 'company' => 'Beispiel GmbH', 'topic' => 'demo', 'message' => '', 'lang' => 'de'];
    }

    public function testValidInputPasses(): void
    {
        $r = (new Validator())->validate($this->ok());
        self::assertTrue($r['valid']);
        self::assertSame([], $r['errors']);
    }

    /** @return array<string,array{array<string,string>,array<string,string>}> */
    public static function limits(): array
    {
        return [
            'name leer' => [['name' => ''], ['name' => 'name.required']],
            'name nur Leerzeichen' => [['name' => "   \u{00A0} "], ['name' => 'name.required']],
            'name 200 ok' => [['name' => str_repeat('ä', 200)], []],
            'name 201' => [['name' => str_repeat('ä', 201)], ['name' => 'name.too_long']],
            'email leer' => [['email' => ''], ['email' => 'email.required']],
            'email ungültig' => [['email' => 'keine-adresse'], ['email' => 'email.invalid']],
            'email ohne Punkt in Domain' => [['email' => 'a@localhost'], ['email' => 'email.invalid']],
            'email mit Leerzeichen' => [['email' => 'a b@example.com'], ['email' => 'email.invalid']],
            'email mit Anführungszeichen' => [['email' => '"a b"@example.com'], ['email' => 'email.invalid']],
            'email 254 ok' => [['email' => str_repeat('a', 64) . '@' . str_repeat('b', 63) . '.' . str_repeat('c', 63) . '.' . str_repeat('d', 58) . '.de'], []],
            'email 255' => [['email' => str_repeat('a', 64) . '@' . str_repeat('b', 63) . '.' . str_repeat('c', 63) . '.' . str_repeat('d', 59) . '.de'], ['email' => 'email.too_long']],
            'company leer' => [['company' => ''], ['company' => 'company.required']],
            'company 200 ok' => [['company' => str_repeat('x', 200)], []],
            'company 201' => [['company' => str_repeat('x', 201)], ['company' => 'company.too_long']],
            'topic leer' => [['topic' => ''], ['topic' => 'topic.invalid']],
            'topic unbekannt' => [['topic' => 'verkauf'], ['topic' => 'topic.invalid']],
            'topic Gross' => [['topic' => 'Demo'], ['topic' => 'topic.invalid']],
            'topic enterprise' => [['topic' => 'enterprise'], []],
            'topic security' => [['topic' => 'security'], []],
            'topic other' => [['topic' => 'other'], []],
            'message 4000 ok' => [['message' => str_repeat('ö', 4000)], []],
            'message 4001' => [['message' => str_repeat('ö', 4001)], ['message' => 'message.too_long']],
            'message mit Zeilenumbruch erlaubt' => [['message' => "a\r\nb\nc"], []],
        ];
    }

    /** @param array<string,string> $override @param array<string,string> $expected */
    #[DataProvider('limits')]
    public function testFieldLimits(array $override, array $expected): void
    {
        self::assertSame($expected, (new Validator())->validate($this->ok($override))['errors']);
    }

    /** @return array<string,array{string}> */
    public static function controlChars(): array
    {
        return ["LF" => ["\n"], 'CR' => ["\r"], 'CRLF' => ["\r\n"], 'NUL' => ["\0"], 'TAB' => ["\t"], 'ESC' => ["\x1b"], 'DEL' => ["\x7f"], 'U+2028' => ["\u{2028}"], 'U+2029' => ["\u{2029}"], 'NEL' => ["\u{0085}"]]
            + [] ;
    }

    #[DataProvider('controlChars')]
    public function testControlCharactersRejectedInEverySingleLineField(string $c): void
    {
        $v = new Validator();
        self::assertArrayHasKey('name', $v->validate($this->ok(['name' => "Erika{$c}Bcc: x@example.com"]))['errors']);
        self::assertArrayHasKey('company', $v->validate($this->ok(['company' => "Firma{$c}X"]))['errors']);
        self::assertArrayHasKey('email', $v->validate($this->ok(['email' => "a@example.com{$c}Bcc: x@example.com"]))['errors']);
        self::assertArrayHasKey('email', $v->validate($this->ok(['email' => "a{$c}@example.com"]))['errors']);
    }

    public function testInvalidUtf8Rejected(): void
    {
        $r = (new Validator())->validate($this->ok(['name' => "Er\xC3ika"]));
        self::assertSame('name.required', $r['errors']['name']);
    }

    public function testHtmlInMessageIsKeptVerbatim(): void
    {
        $html = '<script>alert(1)</script> & <b>fett</b>';
        $r = (new Validator())->validate($this->ok(['message' => $html]));
        self::assertTrue($r['valid']);
        self::assertSame($html, $r['lead']['message']);
    }

    public function testMessageDropsOtherControlCharsButKeepsNewlines(): void
    {
        $r = (new Validator())->validate($this->ok(['message' => "a\0b\x1b\r\nc\td"]));
        self::assertSame("ab\nc\td", $r['lead']['message']);
    }

    public function testUnknownLangFallsBackToGerman(): void
    {
        self::assertSame('de', (new Validator())->validate($this->ok(['lang' => 'fr']))['lead']['lang']);
        self::assertSame('de', (new Validator())->validate($this->ok(['lang' => '/evil']))['lead']['lang']);
        self::assertSame('en', (new Validator())->validate($this->ok(['lang' => 'en']))['lead']['lang']);
    }

    public function testErrorCodesAreFromTheFixedList(): void
    {
        $r = (new Validator())->validate(['name' => '', 'email' => '', 'company' => '', 'topic' => 'x', 'message' => str_repeat('a', 5000)]);
        foreach ($r['errors'] as $code) {
            self::assertContains($code, Validator::ERROR_CODES);
        }
        self::assertCount(5, $r['errors']);
    }
}
