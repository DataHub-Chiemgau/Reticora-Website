<?php

declare(strict_types=1);

namespace Reticora\Lead;

use InvalidArgumentException;

/** Wählt den Mail-Transport aus der Konfiguration (lead.php und bin/retry.php teilen sich diese Regel). */
final class TransportFactory
{
    public static function fromConfig(Config $config): MailTransport
    {
        if ($config->string('mail.transport', 'smtp') === 'file') {
            // Nur lokale Tests: schreibt Personendaten in eine Datei.
            if ($config->get('mail.allow_insecure') !== true) {
                throw new InvalidArgumentException("mail.transport 'file' nur mit mail.allow_insecure");
            }
            return new FileTransport($config->string('mail.file_path'));
        }
        return PhpMailerTransport::fromConfig($config);
    }
}
