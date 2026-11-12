<?php

declare(strict_types=1);

namespace Reticora\Lead;

use Closure;
use PDO;
use Throwable;

/**
 * Anwendungslogik: Request -> Response. Keine Globals, kein header()/exit.
 * Uhr, PDO (lazy), Mail-Transport (lazy), Protokoll und Kontaktseiten-Vorlage werden injiziert.
 * Fehler in Datenbank- oder Mail-Konfiguration entstehen erst in handle() und ergeben dort das allgemeine 500.
 */
final class App
{
    public const TARGETS = [
        'de' => ['thanks' => '/kontakt/danke/', 'form' => '/kontakt/'],
        'en' => ['thanks' => '/en/contact/thanks/', 'form' => '/en/contact/'],
    ];

    /**
     * @param Closure():PDO $pdoFactory
     * @param Closure():MailTransport $transportFactory
     * @param Closure():int $clock
     * @param Closure(string):void $log
     */
    public function __construct(
        private readonly Config $config,
        private readonly Closure $pdoFactory,
        private readonly Closure $transportFactory,
        private readonly Closure $clock,
        private readonly Closure $log,
        private readonly ContactPage $contactPage,
    ) {
    }

    public function handle(Request $request): Response
    {
        try {
            return $this->dispatch($request);
        } catch (Throwable $e) {
            // Nur Klasse und Ort, keine Meldung (Meldungen könnten Eingaben oder Zugangsdaten enthalten).
            ($this->log)('error ' . $e::class . ' at ' . basename($e->getFile()) . ':' . $e->getLine());
            return $this->failure($request, 500);
        }
    }

    private function dispatch(Request $request): Response
    {
        // Ä-07: kein Token-Endpunkt; jede andere Methode als POST ist 405.
        if ($request->method !== 'POST') {
            return $this->reject($request, 405, 'Method Not Allowed', ['Allow' => 'POST']);
        }
        $declared = (int) ($request->header('content-length') ?? 0);
        if ($declared > Request::MAX_BODY || strlen($request->body) > Request::MAX_BODY) {
            return $this->reject($request, 413, 'Payload Too Large');
        }
        if (!$this->originAllowed($request)) {
            return $this->reject($request, 403, 'Forbidden');
        }
        $ctype = strtolower(trim(explode(';', $request->header('content-type') ?? '')[0]));
        if ($ctype !== 'application/x-www-form-urlencoded') {
            return $this->reject($request, 415, 'Unsupported Media Type');
        }

        $now = ($this->clock)();
        $pdo = ($this->pdoFactory)();
        $limiter = new RateLimiter($pdo, $this->config->rateLimitMax(), $this->config->globalMax());
        $limiter->purgeExpired($now); // Ä-10: abgelaufene Zähler bei jedem Aufruf löschen
        $form = $request->form();
        $lang = $this->lang($form);
        // Nur lesend: wer schon über der Grenze ist, wird abgewiesen. Gezählt wird erst nach der Prüfung der Eingaben,
        // ungültige Absendungen verbrauchen also kein Kontingent (wer ohne JavaScript Fehler korrigiert, sperrt sich nicht aus).
        [$blocked, $retryAfter] = $limiter->blocked($request->ip, $now);
        if ($blocked) {
            ($this->log)('rate_limited');
            return $this->tooManyRequests($request, $lang, $retryAfter);
        }

        // Prüfen vor allem anderen: Ein ungültiges oder leeres Formular endet nie auf der Dankeseite.
        $result = (new Validator())->validate($form);
        if (!$result['valid']) {
            return $this->validationError($request, $lang, $result['errors'], $form);
        }
        [$allowed, $retryAfter] = $limiter->hit($request->ip, $now);
        if (!$allowed) {
            ($this->log)('rate_limited');
            return $this->tooManyRequests($request, $lang, $retryAfter);
        }
        if (($form['website'] ?? '') !== '') {
            ($this->log)('honeypot');
            return $this->accepted($request, $lang);
        }

        $transport = ($this->transportFactory)(); // Fehlkonfiguration: 500, bevor etwas gespeichert ist
        [$state, $retryAfter] = $limiter->hitGlobal($now);
        if ($state === RateLimiter::REJECTED) {
            ($this->log)('global_ceiling');
            return $this->tooManyRequests($request, $lang, $retryAfter);
        }

        $leads = new LeadRepository($pdo);
        $lead = $result['lead'];
        $id = $leads->insert($lead, $now);
        if ($state === RateLimiter::HELD) {
            // Über der Obergrenze für alle: gespeichert, keine Mail; bin/retry.php stellt später zu. Die Besucherin sieht den Normalfall.
            $leads->setDelivery($id, LeadRepository::HELD);
            ($this->log)('lead_held id=' . $id);
            return $this->accepted($request, $lead['lang']);
        }
        $status = LeadRepository::DELIVERED;
        try {
            // Ä-09: nur an das Vertriebspostfach; an die eingegebene Adresse geht nie eine Mail.
            (new Mailer($transport, $this->config, $this->clock))->sendToSales($lead);
        } catch (Throwable $e) {
            $status = LeadRepository::NOT_DELIVERED;
            ($this->log)('mail_failed lead=' . $id . ' ' . $e::class);
        }
        $leads->setDelivery($id, $status);
        ($this->log)('lead_stored id=' . $id . ' delivery=' . $status);
        return $this->accepted($request, $lead['lang']);
    }

    /**
     * Strenge Regel: Eine Origin muss exakt der Origin aus site_url entsprechen. Fehlt der Header,
     * wird nur zugelassen, wenn der Browser Sec-Fetch-Site: same-origin sendet. "null" und alles andere: abgelehnt.
     */
    private function originAllowed(Request $request): bool
    {
        $origin = $request->header('origin');
        if ($origin !== null) {
            return strtolower(rtrim($origin, '/')) === $this->config->siteOrigin() && $origin !== 'null';
        }
        return strtolower($request->header('sec-fetch-site') ?? '') === 'same-origin';
    }

    /** @param array<string,string> $form */
    private function lang(array $form): string
    {
        $l = $form['lang'] ?? '';
        return in_array($l, Validator::LANGS, true) ? $l : 'de';
    }

    private function accepted(Request $request, string $lang): Response
    {
        if ($request->wantsJson()) {
            return Response::json(200, ['ok' => true]);
        }
        return Response::redirect(self::TARGETS[$lang]['thanks']);
    }

    /**
     * Ä-08: ohne JSON die Kontaktseite selbst mit 422, Fehlern am Feld und den maskierten Eingaben. Keine Weiterleitung,
     * nichts davon in einer Adresse. Fehlt die Vorlage, eine kurze Hinweisseite (ebenfalls 422).
     * @param array<string,string> $errors
     * @param array<string,string> $form
     */
    private function validationError(Request $request, string $lang, array $errors, array $form): Response
    {
        if ($request->wantsJson()) {
            return Response::json(422, ['ok' => false, 'errors' => $errors]);
        }
        $page = $this->contactPage->render($lang, $errors, $form);
        if ($page !== null) {
            return Response::page(422, $page);
        }
        ($this->log)('template_missing ' . $lang);
        return Response::html(422, $this->invalidNotice($lang, $errors));
    }

    private function tooManyRequests(Request $request, string $lang, int $retryAfter): Response
    {
        $extra = ['Retry-After' => (string) $retryAfter];
        if ($request->wantsJson()) {
            return Response::json(429, ['ok' => false], $extra);
        }
        return Response::html(429, $this->noticePage($lang, true), $extra);
    }

    private function failure(Request $request, int $status): Response
    {
        $lang = $this->lang($request->method === 'POST' ? $request->form() : []);
        if ($request->wantsJson()) {
            return Response::json($status, ['ok' => false]);
        }
        return Response::html($status, $this->noticePage($lang, false));
    }

    /** @param array<string,string> $extra */
    private function reject(Request $request, int $status, string $text, array $extra = []): Response
    {
        if ($request->wantsJson()) {
            return Response::json($status, ['ok' => false], $extra);
        }
        return Response::text($status, $text, $extra);
    }

    /** Ersatz, wenn die Vorlage fehlt: Fehlertexte als Liste und ein Link zurück. Keine Eingaben. @param array<string,string> $errors */
    private function invalidNotice(string $lang, array $errors): string
    {
        $texts = $this->contactPage->texts($lang);
        $en = $lang === 'en';
        $title = $texts['generic'] ?? ($en ? 'The form was not sent. Please check your entries.' : 'Das Formular wurde nicht gesendet. Bitte prüfen Sie Ihre Angaben.');
        $items = '';
        foreach ($errors as $field => $code) {
            if (!in_array($field, ContactPage::FIELDS, true)) {
                continue;
            }
            $text = $texts['errors'][$code] ?? null;
            if (is_string($text)) {
                $items .= '<li>' . ContactPage::esc($text) . '</li>';
            }
        }
        $back = $en ? 'Back to the form' : 'Zurück zum Formular';
        $prefix = $texts['titlePrefix'] ?? ($en ? 'Error: ' : 'Fehler: ');
        return $this->shell($lang, $title, ($items !== '' ? '<ul>' . $items . '</ul>' : '')
            . '<p><a href="' . self::TARGETS[$lang]['form'] . '">' . $back . '</a></p>', $prefix);
    }

    private function noticePage(string $lang, bool $rateLimited): string
    {
        $mail = ContactPage::esc($this->config->string('contact_email'));
        if ($lang === 'en') {
            $title = $rateLimited ? 'Very busy right now' : 'Something went wrong';
            $text = $rateLimited ? 'We are receiving a lot of inquiries right now. Please try again later or write to us directly.' : 'Your inquiry could not be processed.';
            $contact = 'Please write to us directly:';
        } else {
            $title = $rateLimited ? 'Gerade sehr viele Anfragen' : 'Es ist ein Fehler aufgetreten';
            $text = $rateLimited ? 'Im Moment gehen sehr viele Anfragen ein. Bitte versuchen Sie es später noch einmal oder schreiben Sie uns direkt.' : 'Ihre Anfrage konnte nicht verarbeitet werden.';
            $contact = 'Schreiben Sie uns bitte direkt:';
        }
        return $this->shell($lang, $title, '<p>' . $text . '</p><p>' . $contact . ' <a href="mailto:' . $mail . '">' . $mail . '</a></p>');
    }

    private function shell(string $lang, string $title, string $body, string $titlePrefix = ''): string
    {
        $headTitle = ContactPage::esc($titlePrefix . $title);
        $title = ContactPage::esc($title);
        return '<!doctype html><html lang="' . $lang . '"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<meta name="robots" content="noindex"><title>' . $headTitle . '</title></head><body>'
            . '<h1>' . $title . '</h1>' . $body . "</body></html>\n";
    }
}
