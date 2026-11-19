<?php

declare(strict_types=1);

namespace Reticora\Lead;

use InvalidArgumentException;

/** Fertige Nachricht. Alle Kopfzeilenwerte werden beim Bau auf CR/LF geprüft. */
final class MailMessage
{
    public function __construct(
        public readonly string $fromAddress,
        public readonly string $fromName,
        public readonly string $to,
        public readonly ?string $replyTo,
        public readonly string $subject,
        public readonly string $body,
        public readonly string $messageId,
        public readonly int $date,
    ) {
        foreach ([$fromAddress, $fromName, $to, $replyTo ?? '', $subject, $messageId] as $v) {
            if (preg_match('/[\r\n\x00]/', $v) === 1) {
                throw new InvalidArgumentException('Zeilenumbruch in Kopfzeilenwert');
            }
        }
        foreach ([$fromAddress, $to, $replyTo ?? ''] as $a) {
            if ($a !== '' && preg_match('/[<>\s,;"]/', $a) === 1) {
                throw new InvalidArgumentException('Ungültige Adresse');
            }
        }
    }
}
