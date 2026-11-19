<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PHPMailer\PHPMailer\SMTP;

/**
 * SMTP von PHPMailer mit einer Gesamtfrist für alle Antworten eines Versands. PHPMailer selbst begrenzt nur jede
 * einzelne Antwort (Timelimit); ein Server, der langsam Zeilen tröpfelt, hielte die Anfrage sonst sehr lange auf.
 */
final class DeadlineSmtp extends SMTP
{
    public float $deadlineAt = INF;

    protected function get_lines()
    {
        $left = $this->deadlineAt - microtime(true);
        if ($left <= 0) {
            $this->setError('Gesamtfrist überschritten');
            return ''; // leere Antwort: der laufende Befehl scheitert, PHPMailer wirft
        }
        $this->Timelimit = max(1, (int) ceil(min($left, 300)));
        return parent::get_lines();
    }
}
