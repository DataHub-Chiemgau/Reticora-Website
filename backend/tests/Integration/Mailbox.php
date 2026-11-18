<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests\Integration;

/**
 * Empfangene Mails des SMTP-Fängers. Im Container Mailpit (HTTP-API), lokal der aiosmtpd-Fänger aus
 * scripts/integration-local.sh (eine JSON-Datei je Mail).
 *
 * Eine Mail: ['recipients' => alle Empfänger (To, Cc, Bcc bzw. Umschlag), 'to' => To-Kopfzeile, 'reply_to' => Adressen,
 * 'from' => Adresse, 'subject' => Betreff, 'text' => Klartext mit \n, 'tls' => bool|null, 'auth_user' => string|null]
 * (tls und auth_user kennt nur der lokale Fänger; Mailpit nimmt ohne STARTTLS und Anmeldung gar nichts an).
 */
interface Mailbox
{
    public function clear(): void;

    /** @return list<array{recipients:list<string>,to:list<string>,reply_to:list<string>,from:string,subject:string,text:string,tls:?bool,auth_user:?string}> */
    public function messages(): array;

    public static function fromEnvironment(): self;
}
