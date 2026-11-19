<?php

declare(strict_types=1);

namespace Reticora\Lead;

use RuntimeException;

/** Testtransport: sammelt Nachrichten im Speicher; optional Fehler erzwingen. */
final class ArrayTransport implements MailTransport
{
    /** @var list<MailMessage> */
    public array $sent = [];

    /** @param (callable(MailMessage):bool)|null $failWhen */
    public function __construct(private $failWhen = null)
    {
    }

    public function send(MailMessage $message): void
    {
        if ($this->failWhen !== null && ($this->failWhen)($message)) {
            throw new RuntimeException('Versand fehlgeschlagen (Test)');
        }
        $this->sent[] = $message;
    }
}
