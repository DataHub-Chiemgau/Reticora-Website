<?php

declare(strict_types=1);

namespace Reticora\Lead;

use Closure;

/**
 * Baut die beiden Mails. Kopfzeilenwerte (From, To, Betreff) kommen aus der Konfiguration bzw. festen Texten;
 * einzig Reply-To (und bei der Bestätigung To) ist die bereits validierte Adresse der anfragenden Person.
 * Alle Rümpfe sind Klartext (UTF-8); HTML aus Formularfeldern wird nie interpretiert.
 */
final class Mailer
{
    private const TOPIC_LABELS = [
        'de' => ['demo' => 'Vorführung', 'enterprise' => 'Enterprise', 'security' => 'Sicherheit und Datenschutz', 'other' => 'Sonstiges'],
        'en' => ['demo' => 'Demo', 'enterprise' => 'Enterprise', 'security' => 'Security and privacy', 'other' => 'Other'],
    ];

    /** @param Closure():int $clock */
    public function __construct(
        private readonly MailTransport $transport,
        private readonly Config $config,
        private readonly Closure $clock,
    ) {
    }

    /** @param array<string,string> $lead validierte Felder; wirft bei Transportfehlern */
    public function sendToSales(array $lead): void
    {
        $now = ($this->clock)();
        $label = self::TOPIC_LABELS['de'][$lead['topic']];
        $body = "Neue Anfrage über das Kontaktformular\r\n\r\n"
            . "Name: {$lead['name']}\r\n"
            . "E-Mail: {$lead['email']}\r\n"
            . "Unternehmen: {$lead['company']}\r\n"
            . "Anliegen: $label\r\n"
            . "Sprache: {$lead['lang']}\r\n"
            . 'Eingang: ' . gmdate('Y-m-d H:i:s', $now) . " UTC\r\n\r\n"
            . "Nachricht:\r\n" . ($lead['message'] === '' ? '(keine)' : $lead['message']) . "\r\n";
        $this->transport->send($this->message(
            $this->config->string('mail.to_address'),
            $lead['email'],
            '[Website] Neue Anfrage: ' . $label,
            $body,
            $now,
        ));
    }

    /** Bestätigung ohne Wiedergabe der Nachricht. @param array<string,string> $lead */
    public function sendConfirmation(array $lead): void
    {
        $now = ($this->clock)();
        $en = $lead['lang'] === 'en';
        $subject = $en ? 'Your enquiry to Reticora' : 'Ihre Anfrage an Reticora';
        $text = $en
            ? "Hello {$lead['name']},\r\n\r\nthank you for your enquiry. We have received it and will reply to this address.\r\n"
            : "Guten Tag {$lead['name']},\r\n\r\nvielen Dank für Ihre Anfrage. Sie ist bei uns eingegangen, wir antworten an diese Adresse.\r\n";
        $signature = $this->config->string('signature.' . ($en ? 'en' : 'de'));
        if ($signature !== '') {
            $text .= "\r\n-- \r\n" . $signature . "\r\n";
        }
        $this->transport->send($this->message($lead['email'], null, $subject, $text, $now));
    }

    private function message(string $to, ?string $replyTo, string $subject, string $body, int $now): MailMessage
    {
        $host = parse_url($this->config->string('site_url'), PHP_URL_HOST);
        return new MailMessage(
            $this->config->string('mail.from_address'),
            $this->config->string('mail.from_name'),
            $to,
            $replyTo,
            $subject,
            $body,
            bin2hex(random_bytes(12)) . '@' . (is_string($host) ? $host : 'localhost'),
            $now,
        );
    }
}
