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
    public const HELD = 'held';
    /** Standard für rate_limit.held_max (S-01). */
    public const HELD_MAX = 500;
    /** Ein Lead, der länger als so viele Sekunden auf pending steht, gilt als abgebrochen (DS-05) und wird wie not_delivered behandelt. */
    public const STALE_PENDING = 900;

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

    /**
     * Noch nicht zugestellte Anfragen (held, not_delivered und seit über 15 Minuten pending), älteste zuerst.
     * @return list<array<string,mixed>>
     */
    public function undelivered(int $limit, int $now): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM lead WHERE delivery IN (:a, :b) OR (delivery = :p AND created_at < :stale) ORDER BY id ASC LIMIT ' . max(1, $limit)
        );
        $stmt->execute([':a' => self::HELD, ':b' => self::NOT_DELIVERED, ':p' => self::PENDING, ':stale' => self::staleBefore($now)]);
        return array_values($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Anzahl je Status; für pending nur die hängengebliebenen (älter als STALE_PENDING).
     * @return array{undelivered:int, held:int, not_delivered:int, pending:int}
     */
    public function countUndelivered(int $now): array
    {
        /** @param array<string,string> $params */
        $count = function (string $sql, array $params): int {
            $q = $this->pdo->prepare($sql);
            $q->execute($params);
            return (int) $q->fetchColumn();
        };
        $held = $count('SELECT COUNT(*) FROM lead WHERE delivery = :s', [':s' => self::HELD]);
        $notDelivered = $count('SELECT COUNT(*) FROM lead WHERE delivery = :s', [':s' => self::NOT_DELIVERED]);
        $pending = $count('SELECT COUNT(*) FROM lead WHERE delivery = :s AND created_at < :stale', [':s' => self::PENDING, ':stale' => self::staleBefore($now)]);
        return ['undelivered' => $held + $notDelivered + $pending, 'held' => $held, 'not_delivered' => $notDelivered, 'pending' => $pending];
    }

    public function countHeld(): int
    {
        $q = $this->pdo->prepare('SELECT COUNT(*) FROM lead WHERE delivery = :s');
        $q->execute([':s' => self::HELD]);
        return (int) $q->fetchColumn();
    }

    /** created_at (UTC, 'Y-m-d H:i:s') vor diesem Wert: pending gilt als hängengeblieben. */
    private static function staleBefore(int $now): string
    {
        return gmdate('Y-m-d H:i:s', $now - self::STALE_PENDING);
    }
}
