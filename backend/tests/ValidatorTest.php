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
        // null im Override entfernt das Feld ganz
        $in = $o + ['name' => 'Erika', 'email' => 'erika@example.com', 'company' => 'Beispiel GmbH', 'topic' => 'demo', 'message' => '', 'lang' => 'de'];
        return array_filter($in, fn ($v) => $v !== null);
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
            'topic leer' => [['topic' => ''], ['topic' => 'topic.required']],
            'topic fehlt' => [['topic' => null], ['topic' => 'topic.required']],
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
        self::assertSame('name.invalid', $r['errors']['name']);
        $r = (new Validator())->validate($this->ok(['message' => "a\xC3"]));
        self::assertSame('message.invalid', $r['errors']['message']);
        $r = (new Validator())->validate($this->ok(['company' => "A\0B"]));
        self::assertSame('company.invalid', $r['errors']['company']);
    }

    /** @return array<string,array{string}> */
    public static function invisible(): array
    {
        return ['ZWSP' => ["\u{200B}"], 'BOM' => ["\u{FEFF}"], 'soft hyphen' => ["\u{00AD}"], 'ZWJ+space' => ["\u{200D} \u{2060}"], 'word joiner' => ["\u{2060}\u{2060}"]];
    }

    #[DataProvider('invisible')]
    public function testNamesWithoutVisibleCharacterAreRequiredErrors(string $v): void
    {
        $r = (new Validator())->validate($this->ok(['name' => $v, 'company' => $v]));
        self::assertSame('name.required', $r['errors']['name']);
        self::assertSame('company.required', $r['errors']['company']);
    }

    public function testZeroWidthJoinerAndNonJoinerAllowedInNamesAndCompanies(): void
    {
        // U+200C/U+200D gehören in manchen Schriften zur richtigen Schreibung (z. B. Persisch, Devanagari).
        foreach (["\u{0645}\u{06CC}\u{200C}\u{062E}\u{0648}\u{0627}\u{0647}\u{0645}", "\u{0915}\u{094D}\u{200D}\u{0937}", "Er\u{200C}ika"] as $v) {
            $r = (new Validator())->validate($this->ok(['name' => $v, 'company' => $v . ' GmbH']));
            self::assertSame([], $r['errors'], $v);
            self::assertSame($v, $r['lead']['name']);
        }
        // nur unsichtbare Zeichen bleiben ein Pflichtfehler, in der E-Mail-Adresse bleiben sie ungültig
        $r = (new Validator())->validate($this->ok(['name' => "\u{200C}\u{200D}", 'email' => "a\u{200D}b@example.com"]));
        self::assertSame(['name' => 'name.required', 'email' => 'email.invalid'], $r['errors']);
    }

    public function testBidiAndZeroWidthRejectedInsideSingleLineFields(): void
    {
        foreach (["Er\u{202E}ika", "Er\u{200B}ika", "Er\u{FEFF}ika", "Er\u{2066}ika", "Er\u{200E}ika", "Er\u{061C}ika", "Er\u{2060}ika", "Er\u{00AD}ika"] as $v) {
            $r = (new Validator())->validate($this->ok(['name' => $v, 'company' => $v, 'email' => "a{$v}@example.com"]));
            self::assertSame('name.invalid', $r['errors']['name']);
            self::assertSame('company.invalid', $r['errors']['company']);
            self::assertSame('email.invalid', $r['errors']['email']);
        }
    }

    public function testC1ControlsStrippedFromMessage(): void
    {
        $r = (new Validator())->validate($this->ok(['message' => "a\u{0085}b\u{009F}c äöü"]));
        self::assertSame('abc äöü', $r['lead']['message']);
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

    public function testUnknownOrMissingLangIsRejected(): void
    {
        foreach (['fr', '/evil', '', 'DE'] as $l) {
            self::assertSame(['lang' => 'lang.invalid'], (new Validator())->validate($this->ok(['lang' => $l]))['errors'], $l);
        }
        $in = $this->ok();
        unset($in['lang']);
        self::assertSame(['lang' => 'lang.invalid'], (new Validator())->validate($in)['errors']);
        self::assertSame([], (new Validator())->validate($this->ok(['lang' => 'en']))['errors']);
    }

    public function testErrorCodesAreFromTheFixedList(): void
    {
        $r = (new Validator())->validate(['name' => '', 'email' => '', 'company' => '', 'topic' => 'x', 'message' => str_repeat('a', 5000), 'lang' => 'x']);
        foreach ($r['errors'] as $code) {
            self::assertContains($code, Validator::ERROR_CODES);
        }
        self::assertCount(6, $r['errors']);
        self::assertSame('topic.invalid', $r['errors']['topic']);
        self::assertContains('topic.required', Validator::ERROR_CODES);
    }
}
