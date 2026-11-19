<?php

declare(strict_types=1);

namespace Reticora\Lead;

use RuntimeException;

/**
 * Nur für lokale E2E-Tests: schreibt Nachrichten als JSON-Zeilen in eine Datei.
 * Im Betrieb nicht verwenden (enthält Personendaten aus dem Formular).
 */
final class FileTransport implements MailTransport
{
    public function __construct(private readonly string $path)
    {
    }

    public function send(MailMessage $message): void
    {
        $line = json_encode([
            'to' => $message->to,
            'reply_to' => $message->replyTo,
            'subject' => $message->subject,
            'body' => $message->body,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
        if (file_put_contents($this->path, $line, FILE_APPEND | LOCK_EX) === false) {
            throw new RuntimeException('Mail-Datei nicht beschreibbar');
        }
    }
}
