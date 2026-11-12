<?php

declare(strict_types=1);

namespace Reticora\Lead;

use InvalidArgumentException;
use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;
use RuntimeException;

/**
 * SMTP-Versand über PHPMailer (Spec Ä-11). Verschlüsselung 'ssl' (implizites TLS, Port 465) oder 'starttls' (Port 587),
 * immer mit Anmeldung und Zertifikatsprüfung. 'none' oder Versand ohne Anmeldung nur mit allow_insecure (lokale Tests).
 */
final class PhpMailerTransport implements MailTransport
{
    private const SECURE = ['ssl' => PHPMailer::ENCRYPTION_SMTPS, 'starttls' => PHPMailer::ENCRYPTION_STARTTLS, 'none' => ''];

    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $encryption,
        private readonly string $user,
        private readonly string $pass,
        private readonly string $heloName,
        private readonly int $timeout = 10,
        private readonly int $deadline = 15,
        private readonly bool $allowInsecure = false,
    ) {
        if ($host === '') {
            throw new InvalidArgumentException('SMTP-Host fehlt');
        }
        if (!array_key_exists($encryption, self::SECURE)) {
            throw new InvalidArgumentException('Unbekannte Verschlüsselung');
        }
        if (!$allowInsecure && ($encryption === 'none' || $user === '' || $pass === '')) {
            throw new InvalidArgumentException('Unverschlüsselter oder unauthentifizierter SMTP-Versand ist nicht erlaubt (nur mit mail.allow_insecure, nur für Tests)');
        }
    }

    public static function fromConfig(Config $config): self
    {
        return new self(
            $config->string('mail.host'),
            $config->int('mail.port', 465),
            $config->string('mail.encryption', 'ssl'),
            $config->string('mail.user'),
            $config->string('mail.pass'),
            $config->string('mail.helo_name', 'localhost'),
            $config->clampedInt('mail.timeout', 10, 1, 60),
            $config->clampedInt('mail.deadline', 15, 1, 120),
            $config->get('mail.allow_insecure') === true,
        );
    }

    public function send(MailMessage $message): void
    {
        $mail = null;
        try {
            $mail = $this->build($message);
            $mail->send();
        } catch (PHPMailerException) {
            // Meldung bewusst nicht weitergeben (kann Adressen oder Serverantworten enthalten).
            throw new RuntimeException('SMTP-Versand fehlgeschlagen');
        } finally {
            $mail?->smtpClose();
        }
    }

    /** Fertige MIME-Nachricht ohne Versand (für Tests). */
    public function mime(MailMessage $message): string
    {
        $mail = $this->build($message);
        $mail->preSend();
        return $mail->getSentMIMEMessage();
    }

    private function build(MailMessage $m): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $this->host;
        $mail->Port = $this->port;
        $mail->SMTPSecure = self::SECURE[$this->encryption];
        $mail->SMTPAutoTLS = $this->encryption !== 'none';
        $mail->SMTPAuth = $this->user !== '';
        $mail->Username = $this->user;
        $mail->Password = $this->pass;
        $mail->Helo = $this->heloName;
        $mail->Hostname = $this->heloName;
        $mail->Timeout = $this->timeout;
        $smtp = new DeadlineSmtp();
        $smtp->deadlineAt = microtime(true) + $this->deadline;
        $mail->setSMTPInstance($smtp);
        $mail->SMTPDebug = 0;
        $mail->XMailer = ' '; // keine X-Mailer-Kopfzeile
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Encoding = PHPMailer::ENCODING_BASE64;
        $mail->isHTML(false);
        $mail->setFrom($m->fromAddress, $m->fromName, false);
        $mail->addAddress($m->to);
        if ($m->replyTo !== null) {
            $mail->addReplyTo($m->replyTo);
        }
        $mail->Subject = $m->subject;
        $mail->Body = $m->body;
        $mail->MessageID = '<' . $m->messageId . '>';
        $mail->MessageDate = gmdate('D, d M Y H:i:s', $m->date) . ' +0000';
        return $mail;
    }
}
