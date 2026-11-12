<?php

declare(strict_types=1);

namespace Reticora\Lead;

use PDO;

/** Speicherung in der Tabelle lead; ausschließlich vorbereitete Anweisungen, portables SQL. */
final class LeadRepository
{
    public const PENDING = 'pending';
    public const DELIVERED = 'delivered';
    public const NOT_DELIVERED = 'not_delivered';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @param array<string,string> $lead */
    public function insert(array $lead, int $now): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO lead (created_at, lang, name, email, company, topic, message, delivery)
             VALUES (:created, :lang, :name, :email, :company, :topic, :message, :delivery)'
        );
        $stmt->execute([
            ':created' => gmdate('Y-m-d H:i:s', $now),
            ':lang' => $lead['lang'],
            ':name' => $lead['name'],
            ':email' => $lead['email'],
            ':company' => $lead['company'],
            ':topic' => $lead['topic'],
            ':message' => $lead['message'],
            ':delivery' => self::PENDING,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function setDelivery(int $id, string $status): void
    {
        $stmt = $this->pdo->prepare('UPDATE lead SET delivery = :d WHERE id = :id');
        $stmt->execute([':d' => $status, ':id' => $id]);
    }

    /** @return array<string,mixed>|null */
    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM lead WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }
}
