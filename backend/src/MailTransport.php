<?php

declare(strict_types=1);

namespace Reticora\Lead;

interface MailTransport
{
    /** @throws \RuntimeException bei Fehlern */
    public function send(MailMessage $message): void;
}
