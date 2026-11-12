<?php

declare(strict_types=1);

namespace Reticora\Lead;

use Closure;

/**
 * Baut die einzige Mail: an das Vertriebspostfach (Spec Ä-09; keine Mail an die eingegebene Adresse).
 * Kopfzeilenwerte (From, To, Betreff) kommen aus der Konfiguration bzw. festen Texten; einzig Reply-To ist die
 * bereits validierte Adresse der anfragenden Person. Der Rumpf ist Klartext (UTF-8); HTML wird nie interpretiert.
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

    /**
     * @param array<string,string> $lead validierte Felder; wirft bei Transportfehlern
     * @param int|null $receivedAt Eingangszeit (UTC-Sekunden); null = jetzt. bin/retry.php gibt hier die Zeit des Eingangs an.
     */
    public function sendToSales(array $lead, ?int $receivedAt = null): void
    {
        $now = ($this->clock)();
        $label = self::TOPIC_LABELS['de'][$lead['topic']];
        $body = "Neue Anfrage über das Kontaktformular\r\n\r\n"
            . "Name: {$lead['name']}\r\n"
            . "E-Mail: {$lead['email']}\r\n"
            . "Unternehmen: {$lead['company']}\r\n"
            . "Anliegen: $label\r\n"
            . "Sprache: {$lead['lang']}\r\n"
            . 'Eingang: ' . gmdate('Y-m-d H:i:s', $receivedAt ?? $now) . " UTC\r\n\r\n"
            . "Nachricht:\r\n" . ($lead['message'] === '' ? '(keine)' : $lead['message']) . "\r\n";
        $this->transport->send($this->message(
            $this->config->string('mail.to_address'),
            $lead['email'],
            '[Website] Neue Anfrage: ' . $label,
            $body,
            $now,
        ));
    }

    private function message(string $to, string $replyTo, string $subject, string $body, int $now): MailMessage
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
