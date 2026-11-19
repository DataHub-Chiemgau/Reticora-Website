<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;
use Throwable;

/**
 * Stellt zurückgehaltene (held) und nicht zugestellte (not_delivered) Anfragen nachträglich an das Vertriebspostfach zu
 * (bin/retry.php, per Cron). Höchstens $max Mails je Lauf, älteste zuerst. Beim ersten Fehler bricht der Lauf ab
 * (der Mailserver ist dann vermutlich nicht erreichbar; weitere Versuche kosten nur Zeit). Gibt nie Formularinhalte aus.
 */
final class Retrier
{
    public const DEFAULT_MAX = 20;

    public function __construct(private readonly PDO $pdo, private readonly Mailer $mailer)
    {
    }

    /** @return array{sent:int, failed:int, remaining:int} */
    public function run(int $max = self::DEFAULT_MAX): array
    {
        $repo = new LeadRepository($this->pdo);
        $sent = 0;
        $failed = 0;
        foreach ($repo->undelivered(max(1, $max)) as $row) {
            $received = strtotime((string) $row['created_at'] . ' UTC');
            try {
                $this->mailer->sendToSales([
                    'lang' => (string) $row['lang'],
                    'name' => (string) $row['name'],
                    'email' => (string) $row['email'],
                    'company' => (string) $row['company'],
                    'topic' => (string) $row['topic'],
                    'message' => (string) $row['message'],
                ], $received === false ? null : $received);
            } catch (Throwable) {
                $repo->setDelivery((int) $row['id'], LeadRepository::NOT_DELIVERED);
                $failed++;
                break;
            }
            $repo->setDelivery((int) $row['id'], LeadRepository::DELIVERED);
            $sent++;
        }
        return ['sent' => $sent, 'failed' => $failed, 'remaining' => $this->remaining()];
    }

    private function remaining(): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM lead WHERE delivery IN (:a, :b)');
        $stmt->execute([':a' => LeadRepository::HELD, ':b' => LeadRepository::NOT_DELIVERED]);
        return (int) $stmt->fetchColumn();
    }
}
