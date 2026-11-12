<?php

declare(strict_types=1);

namespace Reticora\Lead;

/**
 * Kontaktseite mit Eingabefehlern ohne JavaScript (Spec Ä-08).
 *
 * Der Astro-Build legt die fertige Seite je Sprache als `contact.<lang>.html` in das Vorlagenverzeichnis (außerhalb
 * des Webroots), dazu `form-texts.json` mit den Fehlertexten aus `ui(lang).form`. Hier werden nur feste Marken
 * (siehe markers(), gleiche Liste wie scripts/lib/lead-templates.mjs) per strtr() ersetzt: kein HTML-Parser, kein
 * regulärer Ausdruck auf Eingaben. strtr() ersetzt in einem Durchgang über die Vorlage; eingesetzter Text wird nicht
 * erneut durchsucht. Jede Eingabe wird mit htmlspecialchars(ENT_QUOTES | ENT_SUBSTITUTE) maskiert; jede Marke enthält
 * ein Anführungszeichen, das in maskiertem Text nie vorkommt.
 */
final class ContactPage
{
    public const FIELDS = ['name', 'email', 'company', 'topic', 'message'];
    private const INPUTS = ['name', 'email', 'company'];

    private const FIELD = ' data-rt-field="%s">';
    private const TEXTAREA = ' data-rt-field="message"></textarea>';
    private const OPTION = ' data-rt-option="%s">';
    private const ERROR = ' data-rt-error="%s" hidden></p>';
    private const TITLE = ' data-rt="title">';
    private const SUMMARY = ' data-rt="summary" hidden>';
    private const SUMMARY_TITLE = ' data-rt="summary-title"></p>';
    private const SUMMARY_ITEMS = ' data-rt="summary-items"></ul>';

    /** @var array<string,mixed>|null */
    private ?array $texts = null;

    public function __construct(private readonly string $dir)
    {
    }

    /** @return list<string> */
    public static function markers(): array
    {
        $m = [];
        foreach (['name', 'email', 'company', 'topic'] as $n) {
            $m[] = sprintf(self::FIELD, $n);
        }
        $m[] = self::TEXTAREA;
        foreach (Validator::TOPICS as $t) {
            $m[] = sprintf(self::OPTION, $t);
        }
        foreach (self::FIELDS as $n) {
            $m[] = sprintf(self::ERROR, $n);
        }
        return [...$m, self::TITLE, self::SUMMARY, self::SUMMARY_TITLE, self::SUMMARY_ITEMS];
    }

    /**
     * Texte einer Sprache: titlePrefix, summaryOne, summaryMany, generic, errors (Code → Text). null, wenn die Datei fehlt oder kaputt ist.
     * @return array{titlePrefix:string, summaryOne:string, summaryMany:string, generic:string, errors:array<string,string>}|null
     */
    public function texts(string $lang): ?array
    {
        if ($this->texts === null) {
            $raw = @file_get_contents($this->dir . '/form-texts.json');
            $data = is_string($raw) ? json_decode($raw, true) : null;
            $this->texts = is_array($data) ? $data : [];
        }
        $t = $this->texts[$lang] ?? null;
        if (!is_array($t) || !is_array($t['errors'] ?? null)) {
            return null;
        }
        foreach (['titlePrefix', 'summaryOne', 'summaryMany', 'generic'] as $k) {
            if (!is_string($t[$k] ?? null)) {
                return null;
            }
        }
        return $t;
    }

    /**
     * Fertige Seite mit Fehlern und Eingaben, oder null, wenn Vorlage oder Texte fehlen bzw. eine Marke nicht genau einmal vorkommt.
     * @param string $lang 'de' oder 'en' (aus der festen Liste, nie aus der Anfrage übernommen)
     * @param array<string,string> $errors Feld → Fehlercode (aus dem Validator)
     * @param array<string,string> $input rohe Formularwerte
     */
    public function render(string $lang, array $errors, array $input): ?string
    {
        if (!in_array($lang, Validator::LANGS, true)) {
            return null;
        }
        $tpl = @file_get_contents($this->dir . '/contact.' . $lang . '.html');
        $texts = $this->texts($lang);
        if (!is_string($tpl) || $texts === null) {
            return null;
        }
        foreach (self::markers() as $m) {
            if (substr_count($tpl, $m) !== 1) {
                return null;
            }
        }

        $invalid = static fn (string $field): string => isset($errors[$field]) ? ' aria-invalid="true"' : '';
        $map = [];
        foreach (self::INPUTS as $n) {
            $map[sprintf(self::FIELD, $n)] = ' data-rt-field="' . $n . '" value="' . self::esc($input[$n] ?? '') . '"' . $invalid($n) . '>';
        }
        $map[sprintf(self::FIELD, 'topic')] = ' data-rt-field="topic"' . $invalid('topic') . '>';
        foreach (Validator::TOPICS as $t) {
            if (($input['topic'] ?? '') === $t) {
                $map[sprintf(self::OPTION, $t)] = ' data-rt-option="' . $t . '" selected>';
            }
        }
        // Zeilenumbruch nach <textarea>: der Parser entfernt genau einen führenden Umbruch, der Inhalt bleibt also unverändert.
        $map[self::TEXTAREA] = ' data-rt-field="message"' . $invalid('message') . ">\n" . self::esc($input['message'] ?? '') . '</textarea>';

        // Nur Fehler an echten Feldern stehen in der Liste: Besucher können sonst nichts „korrigieren“ (z. B. lang.invalid).
        $items = '';
        $n = 0;
        foreach ($errors as $field => $code) {
            if (!in_array($field, self::FIELDS, true)) {
                continue;
            }
            $text = self::esc($texts['errors'][$code] ?? $texts['generic']);
            $map[sprintf(self::ERROR, $field)] = ' data-rt-error="' . $field . '">' . $text . '</p>';
            $items .= '<li><a href="#f-' . $field . '">' . $text . '</a></li>';
            $n++;
        }
        $title = $n === 0 ? $texts['generic'] : ($n === 1 ? $texts['summaryOne'] : str_replace('{n}', (string) $n, $texts['summaryMany']));
        $map[self::TITLE] = ' data-rt="title">' . self::esc($texts['titlePrefix']);
        $map[self::SUMMARY] = ' data-rt="summary" autofocus>';
        $map[self::SUMMARY_TITLE] = ' data-rt="summary-title">' . self::esc($title) . '</p>';
        $map[self::SUMMARY_ITEMS] = ' data-rt="summary-items">' . $items . '</ul>';

        return strtr($tpl, $map);
    }

    public static function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
