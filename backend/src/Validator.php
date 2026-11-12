<?php

declare(strict_types=1);

namespace Reticora\Lead;

/** Prüft die Formularfelder (Spec §6.1). Fehlercodes stammen aus einer festen Liste. */
final class Validator
{
    public const TOPICS = ['demo', 'enterprise', 'security', 'other'];
    public const LANGS = ['de', 'en'];
    public const ERROR_CODES = [
        'name.required', 'name.too_long', 'name.invalid',
        'email.required', 'email.invalid', 'email.too_long',
        'company.required', 'company.too_long', 'company.invalid',
        'topic.invalid',
        'message.too_long', 'message.invalid',
        'lang.invalid',
    ];

    /**
     * @param array<string,string> $input
     * @return array{valid: bool, errors: array<string,string>, lead: array<string,string>}
     */
    public function validate(array $input): array
    {
        $errors = [];
        $name = $this->singleLine($input['name'] ?? '');
        $email = $this->singleLine($input['email'] ?? '');
        $company = $this->singleLine($input['company'] ?? '');

        if ($name === null) {
            $errors['name'] = 'name.invalid';
        } elseif ($name === '') {
            $errors['name'] = 'name.required';
        } elseif (mb_strlen($name, 'UTF-8') > 200) {
            $errors['name'] = 'name.too_long';
        }

        if ($email === '') {
            $errors['email'] = 'email.required';
        } elseif ($email === null) {
            $errors['email'] = 'email.invalid';
        } elseif (strlen($email) > 254) {
            $errors['email'] = 'email.too_long';
        } elseif (!$this->validEmail($email)) {
            $errors['email'] = 'email.invalid';
        }

        if ($company === null) {
            $errors['company'] = 'company.invalid';
        } elseif ($company === '') {
            $errors['company'] = 'company.required';
        } elseif (mb_strlen($company, 'UTF-8') > 200) {
            $errors['company'] = 'company.too_long';
        }

        $topic = $input['topic'] ?? '';
        if (!in_array($topic, self::TOPICS, true)) {
            $errors['topic'] = 'topic.invalid';
        }

        $message = $this->message($input['message'] ?? '');
        if ($message === null) {
            $errors['message'] = 'message.invalid';
        } elseif (mb_strlen($message, 'UTF-8') > 4000) {
            $errors['message'] = 'message.too_long';
        }

        $lang = $input['lang'] ?? '';
        if (!in_array($lang, self::LANGS, true)) {
            $errors['lang'] = 'lang.invalid';
            $lang = 'de';
        }

        return [
            'valid' => $errors === [],
            'errors' => $errors,
            'lead' => [
                'lang' => $lang,
                'name' => $name ?? '',
                'email' => $email ?? '',
                'company' => $company ?? '',
                'topic' => $topic,
                'message' => $message ?? '',
            ],
        ];
    }

    /**
     * Getrimmt. '' wenn kein sichtbares Zeichen übrig bleibt (Leerraum, Cf, Steuerzeichen);
     * null bei ungültigem UTF-8, Steuerzeichen, Zeilenumbruch (auch U+2028/2029) oder Cf (Bidi/Zero-Width).
     */
    private function singleLine(string $value): ?string
    {
        if (!mb_check_encoding($value, 'UTF-8')) {
            return null;
        }
        $trimmed = preg_replace('/^[\s\x{00A0}]+|[\s\x{00A0}]+$/u', '', $value);
        if ($trimmed === null) {
            return null;
        }
        if (preg_replace('/[\p{Cf}\p{Z}\p{C}]/u', '', $trimmed) === '') {
            return '';
        }
        if (preg_match('/[\p{C}\p{Zl}\p{Zp}]/u', $trimmed) === 1) {
            return null; // \p{C} umfasst Cc und Cf
        }
        return $trimmed;
    }

    /** Nachricht: Zeilenumbrüche normalisiert, sonstige Steuerzeichen entfernt, HTML unverändert. */
    private function message(string $value): ?string
    {
        if (!mb_check_encoding($value, 'UTF-8')) {
            return null;
        }
        $value = str_replace(["\r\n", "\r"], "\n", $value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\x{0080}-\x{009F}]/u', '', $value) ?? '';
        return trim($value);
    }

    private function validEmail(string $email): bool
    {
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return false;
        }
        // Strenger als filter_var: keine Anführungszeichen, Klammern, Kommas, Leerzeichen; Domain mit Punkt.
        if (preg_match('/^[A-Za-z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/', $email) !== 1) {
            return false;
        }
        return true;
    }
}
