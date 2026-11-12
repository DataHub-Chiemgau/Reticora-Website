<?php

declare(strict_types=1);

namespace Reticora\Lead;

/** Prüft die Formularfelder (Spec §6.1). Fehlercodes stammen aus einer festen Liste. */
final class Validator
{
    public const TOPICS = ['demo', 'enterprise', 'security', 'other'];
    public const LANGS = ['de', 'en'];
    public const ERROR_CODES = [
        'name.required', 'name.too_long',
        'email.required', 'email.invalid', 'email.too_long',
        'company.required', 'company.too_long',
        'topic.invalid',
        'message.too_long',
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

        if ($name === null || $name === '') {
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

        if ($company === null || $company === '') {
            $errors['company'] = 'company.required';
        } elseif (mb_strlen($company, 'UTF-8') > 200) {
            $errors['company'] = 'company.too_long';
        }

        $topic = $input['topic'] ?? '';
        if (!in_array($topic, self::TOPICS, true)) {
            $errors['topic'] = 'topic.invalid';
        }

        $message = $this->message($input['message'] ?? '');
        if ($message === null || mb_strlen($message, 'UTF-8') > 4000) {
            $errors['message'] = 'message.too_long';
        }

        // Unbekannte Sprache fällt auf Deutsch zurück (es gibt dafür keinen Fehlercode).
        $lang = in_array($input['lang'] ?? '', self::LANGS, true) ? $input['lang'] : 'de';

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

    /** Getrimmt; null bei ungültigem UTF-8, Steuerzeichen oder Zeilenumbruch (auch U+2028/2029). */
    private function singleLine(string $value): ?string
    {
        if (!mb_check_encoding($value, 'UTF-8')) {
            return null;
        }
        $trimmed = preg_replace('/^[\s\x{00A0}]+|[\s\x{00A0}]+$/u', '', $value);
        if ($trimmed === null) {
            return null;
        }
        if (preg_match('/[\p{Cc}\p{Zl}\p{Zp}]/u', $trimmed) === 1) {
            return null;
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
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value) ?? '';
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
