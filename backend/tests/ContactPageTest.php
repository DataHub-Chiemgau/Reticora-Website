<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\ContactPage;
use Reticora\Lead\Response;
use Reticora\Lead\Validator;

/** Ä-08: Kontaktseite mit Fehlern und Eingaben aus der Build-Vorlage. */
final class ContactPageTest extends TestCase
{
    private const DIR = __DIR__ . '/fixtures/templates';
    private const BUILT = __DIR__ . '/../templates';

    /** @return array<string,string> */
    private function input(array $o = []): array
    {
        return $o + ['name' => 'Erika Beispiel', 'email' => 'erika@example.com', 'company' => 'Beispiel GmbH', 'topic' => 'demo', 'message' => 'Hallo', 'lang' => 'de', 'website' => ''];
    }

    private function dom(string $html): DOMXPath
    {
        $doc = new DOMDocument();
        // Nur im Test: ein Parser prüft, wie ein Browser das Ergebnis liest.
        $prev = libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="utf-8"?>' . $html);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);
        return new DOMXPath($doc);
    }

    /** Inhalt einer textarea, wie ein Browser ihn liest: libxml entfernt den ersten Zeilenumbruch nicht, HTML schon. */
    private function textarea(DOMXPath $x): string
    {
        $t = $x->query('//textarea[@id="f-message"]')->item(0)->textContent;
        return str_starts_with($t, "\n") ? substr($t, 1) : $t;
    }

    private function attr(DOMXPath $x, string $query, string $attr): ?string
    {
        $n = $x->query($query)->item(0);
        return $n instanceof DOMElement && $n->hasAttribute($attr) ? $n->getAttribute($attr) : null;
    }

    public function testErrorsAppearAtTheFieldsAndInTheSummary(): void
    {
        $html = (new ContactPage(self::DIR))->render('de', ['name' => 'name.required', 'topic' => 'topic.invalid'], $this->input(['name' => '', 'topic' => 'x']));
        self::assertNotNull($html);
        $x = $this->dom($html);
        self::assertSame('Bitte geben Sie Ihren Namen an.', $x->query('//p[@id="f-name-err"]')->item(0)->textContent);
        self::assertNull($this->attr($x, '//p[@id="f-name-err"]', 'hidden'));
        self::assertSame('Bitte wählen Sie eines der vier Anliegen aus der Liste.', $x->query('//p[@id="f-topic-err"]')->item(0)->textContent);
        self::assertSame('', $this->attr($x, '//p[@id="f-email-err"]', 'hidden'));
        self::assertSame('true', $this->attr($x, '//input[@id="f-name"]', 'aria-invalid'));
        self::assertSame('true', $this->attr($x, '//select[@id="f-topic"]', 'aria-invalid'));
        self::assertNull($this->attr($x, '//input[@id="f-email"]', 'aria-invalid'));
        // Zusammenfassung sichtbar, mit Fokus beim Laden, Überschrift für zwei Fehler, Links zu den Feldern
        self::assertNull($this->attr($x, '//div[@id="form-summary"]', 'hidden'));
        self::assertSame('', $this->attr($x, '//div[@id="form-summary"]', 'autofocus'));
        self::assertSame('Bitte korrigieren Sie 2 Angaben.', $x->query('//p[@id="form-summary-title"]')->item(0)->textContent);
        $links = $x->query('//div[@id="form-summary"]//li/a');
        self::assertSame(2, $links->length);
        self::assertSame('#f-name', $links->item(0)->getAttribute('href'));
        self::assertSame('Bitte geben Sie Ihren Namen an.', $links->item(0)->textContent);
        self::assertSame('#f-topic', $links->item(1)->getAttribute('href'));
    }

    public function testOneErrorUsesSummaryOneAndEnglishTexts(): void
    {
        $html = (new ContactPage(self::DIR))->render('en', ['company' => 'company.required'], $this->input(['company' => '', 'lang' => 'en']));
        $x = $this->dom((string) $html);
        self::assertSame('Please correct 1 entry.', $x->query('//p[@id="form-summary-title"]')->item(0)->textContent);
        self::assertSame('Please enter your company.', $x->query('//p[@id="f-company-err"]')->item(0)->textContent);
        self::assertSame('en', $x->query('//html')->item(0)->getAttribute('lang'));
    }

    public function testCodeWithoutFieldIsNotListedAsSomethingToFix(): void
    {
        $html = (new ContactPage(self::DIR))->render('de', ['lang' => 'lang.invalid'], $this->input(['lang' => 'fr']));
        $x = $this->dom($html);
        self::assertSame(0, $x->query('//div[@id="form-summary"]//li')->length);
        self::assertSame('Das Formular wurde nicht gesendet. Bitte prüfen Sie Ihre Angaben.', $x->query('//p[@id="form-summary-title"]')->item(0)->textContent);
        // zusammen mit einem Feldfehler: nur der Feldfehler wird gezählt und aufgelistet
        $html = (new ContactPage(self::DIR))->render('de', ['name' => 'name.required', 'lang' => 'lang.invalid'], $this->input(['name' => '', 'lang' => 'fr']));
        $x = $this->dom($html);
        self::assertSame('Bitte korrigieren Sie 1 Angabe.', $x->query('//p[@id="form-summary-title"]')->item(0)->textContent);
        self::assertSame(1, $x->query('//div[@id="form-summary"]//li')->length);
    }

    public function testPageTitleGetsAnErrorPrefixInBothLanguages(): void
    {
        $de = $this->dom((string) (new ContactPage(self::DIR))->render('de', ['name' => 'name.required'], $this->input()));
        self::assertSame('Fehler: Fixture', $de->query('//title')->item(0)->textContent);
        $en = $this->dom((string) (new ContactPage(self::DIR))->render('en', ['name' => 'name.required'], $this->input(['lang' => 'en'])));
        self::assertSame('Error: Fixture', $en->query('//title')->item(0)->textContent);
    }

    public function testInputsAreReinsertedVerbatim(): void
    {
        $in = $this->input(['name' => 'Jürgen Ölmann', 'email' => 'keine-adresse', 'company' => 'A & B <GmbH>', 'topic' => 'security', 'message' => "\nZeile 1\r\nZeile 2\n\n  eingerückt"]);
        $html = (string) (new ContactPage(self::DIR))->render('de', ['email' => 'email.invalid'], $in);
        $x = $this->dom($html);
        self::assertSame('Jürgen Ölmann', $this->attr($x, '//input[@id="f-name"]', 'value'));
        self::assertSame('keine-adresse', $this->attr($x, '//input[@id="f-email"]', 'value'));
        self::assertSame('A & B <GmbH>', $this->attr($x, '//input[@id="f-company"]', 'value'));
        // Textarea: genau der eingegebene Text (der Parser entfernt nur den eingefügten ersten Zeilenumbruch)
        self::assertStringContainsString(">\n\nZeile 1\r\nZeile 2\n\n  eingerückt</textarea>", $html);
        self::assertNull($this->attr($x, '//input[@id="f-website"]', 'value'));
    }

    /** @return array<string,array{string}> */
    public static function topics(): array
    {
        return array_combine(Validator::TOPICS, array_map(fn ($t) => [$t], Validator::TOPICS));
    }

    #[DataProvider('topics')]
    public function testSelectReselectsTheChosenTopicOnly(string $topic): void
    {
        $x = $this->dom((string) (new ContactPage(self::DIR))->render('de', ['name' => 'name.required'], $this->input(['topic' => $topic])));
        $selected = $x->query('//select[@id="f-topic"]/option[@selected]');
        self::assertSame(1, $selected->length);
        self::assertSame($topic, $selected->item(0)->getAttribute('value'));
    }

    public function testUnknownOrEmptyTopicSelectsNothing(): void
    {
        foreach (['', 'Demo', 'demo" selected x="', '"><script>', 'other ', 'demo,security'] as $topic) {
            $html = (string) (new ContactPage(self::DIR))->render('de', ['topic' => 'topic.invalid'], $this->input(['topic' => $topic]));
            self::assertSame(0, $this->dom($html)->query('//option[@selected]')->length, $topic);
            self::assertStringNotContainsString('"><script>', $html);
        }
    }

    /** @return array<string,array{string}> */
    public static function attacks(): array
    {
        return [
            'Attribut-Ausbruch doppelt' => ['"><script>alert(1)</script>'],
            'Attribut-Ausbruch einfach' => ["' autofocus onfocus='alert(1)"],
            'Attribut ohne Anführung' => ['" autofocus onfocus=alert(1) x="'],
            'Textarea-Ausbruch' => ['</textarea><script>alert(1)</script>'],
            'Bild' => ['<img src=x onerror=alert(1)>'],
            'Entität' => ['&lt;script&gt;alert(1)&lt;/script&gt;'],
            'Kommentar' => ['--><script>alert(1)</script><!--'],
            'Marke nachgebaut' => [' data-rt="summary" hidden> data-rt-field="message"></textarea><script>alert(1)</script>'],
            'ungültiges UTF-8' => ["\xC3\x28\"><script>alert(1)</script>"],
            'Null-Byte' => ["a\0\"><script>alert(1)</script>"],
        ];
    }

    #[DataProvider('attacks')]
    public function testXssAttemptsInEveryFieldStayText(string $evil): void
    {
        $page = new ContactPage(self::DIR);
        $template = (string) file_get_contents(self::DIR . '/contact.de.html');
        $in = $this->input(['name' => $evil, 'email' => $evil, 'company' => $evil, 'topic' => $evil, 'message' => $evil]);
        $errors = ['name' => 'name.invalid', 'email' => 'email.invalid', 'company' => 'company.invalid', 'topic' => 'topic.invalid', 'message' => 'message.invalid'];
        $html = (string) $page->render('de', $errors, $in);
        if (str_contains($evil, "\0")) {
            // libxml bricht an NUL ab; Browser lesen NUL als U+FFFD. Hier genügt der Blick auf die Zeichenfolge.
            self::assertSame(substr_count($template, '<script'), substr_count($html, '<script'));
            self::assertStringNotContainsString('"><script>', $html);
            self::assertStringContainsString('value="a' . "\0" . '&quot;&gt;&lt;script&gt;', $html);
            return;
        }
        $x = $this->dom($html);
        // Keine neuen Elemente außer den fünf Einträgen der Zusammenfassung (je <li><a>), keine neuen Ereignis-Attribute
        self::assertSame(substr_count($template, '<script'), substr_count($html, '<script'));
        self::assertSame($this->dom($template)->query('//*')->length + 10, $x->query('//*')->length);
        self::assertSame(0, $x->query('//*[@onfocus or @onerror or @onload or @onmouseover]')->length);
        self::assertSame(1, $x->query('//*[@autofocus]')->length);
        self::assertSame('form-summary', $this->attr($x, '//*[@autofocus]', 'id'));
        self::assertSame(0, $x->query('//img')->length);
        self::assertSame(0, $x->query('//option[@selected]')->length);
        // Text kommt Zeichen für Zeichen zurück; ungültiges UTF-8 wird durch U+FFFD ersetzt (ENT_SUBSTITUTE)
        {
            $expected = html_entity_decode(htmlspecialchars($evil, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), ENT_QUOTES, 'UTF-8');
            foreach (['name', 'email', 'company'] as $f) {
                self::assertSame($expected, $this->attr($x, "//input[@id=\"f-$f\"]", 'value'), $f);
            }
            self::assertSame($expected, $this->textarea($x));
        }
        self::assertTrue(mb_check_encoding($html, 'UTF-8'));
    }

    public function testMissingTemplateOrTextsGiveNull(): void
    {
        $empty = sys_get_temp_dir() . '/reticora-tpl-' . bin2hex(random_bytes(4));
        mkdir($empty);
        self::assertNull((new ContactPage($empty))->render('de', ['name' => 'name.required'], $this->input()));
        copy(self::DIR . '/contact.de.html', $empty . '/contact.de.html');
        self::assertNull((new ContactPage($empty))->render('de', ['name' => 'name.required'], $this->input()), 'Texte fehlen');
        file_put_contents($empty . '/form-texts.json', '{"de": {"errors": "kaputt"}}');
        self::assertNull((new ContactPage($empty))->render('de', ['name' => 'name.required'], $this->input()), 'Texte kaputt');
        copy(self::DIR . '/form-texts.json', $empty . '/form-texts.json');
        self::assertNotNull((new ContactPage($empty))->render('de', ['name' => 'name.required'], $this->input()));
        self::assertNull((new ContactPage($empty))->render('en', ['name' => 'name.required'], $this->input()), 'englische Vorlage fehlt');
        self::assertNull((new ContactPage($empty))->render('../de', ['name' => 'name.required'], $this->input()));
        array_map('unlink', glob($empty . '/*'));
        rmdir($empty);
    }

    public function testTemplateWithMissingOrDuplicatedMarkerIsRejected(): void
    {
        $dir = sys_get_temp_dir() . '/reticora-tpl-' . bin2hex(random_bytes(4));
        mkdir($dir);
        copy(self::DIR . '/form-texts.json', $dir . '/form-texts.json');
        $tpl = (string) file_get_contents(self::DIR . '/contact.de.html');
        foreach ([str_replace(' data-rt-field="email">', '>', $tpl), $tpl . '<p data-rt="summary-title"></p>'] as $broken) {
            file_put_contents($dir . '/contact.de.html', $broken);
            self::assertNull((new ContactPage($dir))->render('de', ['name' => 'name.required'], $this->input()));
        }
        array_map('unlink', glob($dir . '/*'));
        rmdir($dir);
    }

    public function testFixtureHasEveryMarkerExactlyOnce(): void
    {
        $tpl = (string) file_get_contents(self::DIR . '/contact.de.html');
        foreach (ContactPage::markers() as $m) {
            self::assertSame(1, substr_count($tpl, $m), $m);
            self::assertStringContainsString('"', $m, 'jede Marke enthält ein Anführungszeichen');
        }
    }

    public function testSiteCspIsTheOneFromHtaccess(): void
    {
        $ht = (string) file_get_contents(__DIR__ . '/../../public/.htaccess');
        self::assertMatchesRegularExpression('/Header always set Content-Security-Policy "' . preg_quote(Response::SITE_CSP, '/') . '"/', $ht);
        self::assertStringContainsString('Header always set Permissions-Policy "' . Response::SITE_PERMISSIONS . '"', $ht);
        self::assertStringContainsString('Header always set Referrer-Policy "' . Response::SITE_REFERRER . '"', $ht);
        self::assertStringContainsString('Header always set Cross-Origin-Opener-Policy "same-origin"', $ht);
    }

    public function testTheBuiltTemplateRendersWhenPresent(): void
    {
        if (!is_file(self::BUILT . '/contact.de.html')) {
            self::markTestSkipped('backend/templates/contact.de.html fehlt (entsteht bei npm run build)');
        }
        $evil = '"><script>alert(1)</script></textarea>';
        $built = new ContactPage(self::BUILT);
        $html = $built->render('de', ['name' => 'name.too_long', 'topic' => 'topic.required'], $this->input(['name' => $evil, 'message' => $evil, 'topic' => 'enterprise']));
        self::assertNotNull($html, 'Vorlage aus dem Build passt nicht zu den Marken');
        $x = $this->dom($html);
        self::assertSame($evil, $this->attr($x, '//input[@id="f-name"]', 'value'));
        self::assertSame($evil, $this->textarea($x));
        self::assertSame('enterprise', $this->attr($x, '//select[@id="f-topic"]/option[@selected]', 'value'));
        self::assertSame('Bitte korrigieren Sie 2 Angaben.', trim($x->query('//p[@id="form-summary-title"]')->item(0)->textContent));
        self::assertSame(0, $x->query('//script[not(@src)]')->length);
    }
}
