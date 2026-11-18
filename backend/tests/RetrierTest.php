<?php

declare(strict_types=1);

namespace Reticora\Lead\Tests;

use PDO;
use PHPUnit\Framework\TestCase;
use Reticora\Lead\ArrayTransport;
use Reticora\Lead\Config;
use Reticora\Lead\Database;
use Reticora\Lead\LeadRepository;
use Reticora\Lead\MailMessage;
use Reticora\Lead\MailTransport;
use Reticora\Lead\Mailer;
use Reticora\Lead\Retrier;
use RuntimeException;

final class RetrierTest extends TestCase
{
    private const NOW = 1_800_000_000;

    private PDO $pdo;
    private LeadRepository $repo;

    protected function setUp(): void
    {
        $this->pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        Database::migrate($this->pdo, __DIR__ . '/../sql');
        $this->repo = new LeadRepository($this->pdo);
    }

    private function mailer(MailTransport $transport): Mailer
    {
        $config = Config::fromArray([
            'site_url' => 'https://www.example.com', 'contact_email' => 'k@example.com', 'retention_days' => 90, 'db' => [],
            'mail' => ['from_address' => 'v@example.com', 'from_name' => 'W', 'to_address' => 'vertrieb@example.com'],
        ]);
        return new Mailer($transport, $config, static fn (): int => self::NOW + 99999);
    }

    private function add(string $status, int $at = self::NOW, string $name = 'Erika'): int
    {
        $id = $this->repo->insert(['lang' => 'de', 'name' => $name, 'email' => 'e@example.com', 'company' => 'X', 'topic' => 'demo', 'message' => 'Hallo'], $at);
        $this->repo->setDelivery($id, $status);
        return $id;
    }

    public function testSendsHeldAndNotDeliveredOldestFirstAndMarksThemDelivered(): void
    {
        $mail = new ArrayTransport();
        $a = $this->add(LeadRepository::HELD, self::NOW, 'Erster');
        $b = $this->add(LeadRepository::NOT_DELIVERED, self::NOW + 10, 'Zweiter');
        $skip = $this->add(LeadRepository::DELIVERED, self::NOW, 'Fertig');
        $r = (new Retrier($this->pdo, $this->mailer($mail)))->run();
        self::assertSame(['sent' => 2, 'failed' => 0, 'remaining' => 0], $r);
        self::assertCount(2, $mail->sent);
        self::assertStringContainsString('Erster', $mail->sent[0]->body);
        self::assertStringContainsString('Zweiter', $mail->sent[1]->body);
        self::assertSame('vertrieb@example.com', $mail->sent[0]->to);
        self::assertSame('delivered', $this->repo->find($a)['delivery']);
        self::assertSame('delivered', $this->repo->find($b)['delivery']);
        self::assertSame('delivered', $this->repo->find($skip)['delivery']);
    }

    public function testPendingOlderThan15MinutesIsDeliveredLikeNotDeliveredButFreshPendingIsLeftAlone(): void
    {
        // DS-05: Ein Lead bleibt auf pending, wenn der Prozess zwischen Speichern und Zustellstatus endet (z. B. Zeitlimit beim SMTP-Versand).
        $mail = new ArrayTransport();
        $now = self::NOW + 86400;
        $stale = $this->add(LeadRepository::PENDING, $now - 16 * 60, 'Abgebrochen');
        $edge = $this->add(LeadRepository::PENDING, $now - 15 * 60 + 1, 'Gerade erst');
        $fresh = $this->add(LeadRepository::PENDING, $now - 5, 'Läuft noch');
        $r = (new Retrier($this->pdo, $this->mailer($mail)))->run(Retrier::DEFAULT_MAX, $now);
        self::assertSame(['sent' => 1, 'failed' => 0, 'remaining' => 0], $r);
        self::assertCount(1, $mail->sent);
        self::assertStringContainsString('Abgebrochen', $mail->sent[0]->body);
        self::assertSame('delivered', $this->repo->find($stale)['delivery']);
        self::assertSame('pending', $this->repo->find($edge)['delivery']);
        self::assertSame('pending', $this->repo->find($fresh)['delivery']);
        // eine Viertelstunde später sind auch die beiden anderen fällig
        $r = (new Retrier($this->pdo, $this->mailer($mail)))->run(Retrier::DEFAULT_MAX, $now + 15 * 60);
        self::assertSame(['sent' => 2, 'failed' => 0, 'remaining' => 0], $r);
        self::assertSame('delivered', $this->repo->find($edge)['delivery']);
        self::assertSame('delivered', $this->repo->find($fresh)['delivery']);
    }

    public function testStalePendingThatFailsBecomesNotDelivered(): void
    {
        $id = $this->add(LeadRepository::PENDING, self::NOW - 3600);
        $failing = new class implements MailTransport {
            public function send(MailMessage $message): void
            {
                throw new RuntimeException('down');
            }
        };
        $r = (new Retrier($this->pdo, $this->mailer($failing)))->run(Retrier::DEFAULT_MAX, self::NOW);
        self::assertSame(['sent' => 0, 'failed' => 1, 'remaining' => 1], $r);
        self::assertSame('not_delivered', $this->repo->find($id)['delivery']);
    }

    public function testMailCarriesTheTimeOfReceiptNotOfTheRetry(): void
    {
        $mail = new ArrayTransport();
        $this->add(LeadRepository::HELD, self::NOW);
        (new Retrier($this->pdo, $this->mailer($mail)))->run();
        self::assertStringContainsString('Eingang: ' . gmdate('Y-m-d H:i:s', self::NOW) . ' UTC', $mail->sent[0]->body);
    }

    public function testStopsAtMaxPerRun(): void
    {
        $mail = new ArrayTransport();
        for ($i = 0; $i < 5; $i++) {
            $this->add(LeadRepository::HELD, self::NOW + $i, "Lead$i");
        }
        $r = (new Retrier($this->pdo, $this->mailer($mail)))->run(3);
        self::assertSame(['sent' => 3, 'failed' => 0, 'remaining' => 2], $r);
        self::assertSame(2, (int) $this->pdo->query("SELECT COUNT(*) FROM lead WHERE delivery = 'held'")->fetchColumn());
    }

    public function testDefaultMaxIs20(): void
    {
        self::assertSame(20, Retrier::DEFAULT_MAX);
        $mail = new ArrayTransport();
        for ($i = 0; $i < 25; $i++) {
            $this->add(LeadRepository::HELD, self::NOW + $i);
        }
        self::assertSame(['sent' => 20, 'failed' => 0, 'remaining' => 5], (new Retrier($this->pdo, $this->mailer($mail)))->run());
    }

    public function testFailureKeepsTheStatusAndAbortsTheRun(): void
    {
        $failing = new class implements MailTransport {
            public int $calls = 0;
            public function send(MailMessage $message): void
            {
                $this->calls++;
                throw new RuntimeException('smtp down');
            }
        };
        $a = $this->add(LeadRepository::HELD);
        $b = $this->add(LeadRepository::NOT_DELIVERED);
        $r = (new Retrier($this->pdo, $this->mailer($failing)))->run();
        self::assertSame(['sent' => 0, 'failed' => 1, 'remaining' => 2], $r);
        self::assertSame(1, $failing->calls, 'nach dem ersten Fehler kein weiterer Versuch');
        self::assertSame('not_delivered', $this->repo->find($a)['delivery']);
        self::assertSame('not_delivered', $this->repo->find($b)['delivery']);
    }
}
