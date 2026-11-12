<?php

declare(strict_types=1);

namespace Reticora\Lead;

use Closure;
use PDO;
use Throwable;

/**
 * Anwendungslogik: Request -> Response. Keine Globals, kein header()/exit.
 * Uhr, PDO (lazy), Mail-Transport und Protokoll werden injiziert.
 */
final class App
{
    public const TARGETS = [
        'de' => ['thanks' => '/kontakt/danke/', 'form' => '/kontakt/', 'param' => 'fehler', 'anchor' => 'fehler'],
        'en' => ['thanks' => '/en/contact/thanks/', 'form' => '/en/contact/', 'param' => 'error', 'anchor' => 'error'],
    ];

    /**
     * @param Closure():PDO $pdoFactory
     * @param Closure():int $clock
     * @param Closure(string):void $log
     */
    public function __construct(
        private readonly Config $config,
        private readonly Closure $pdoFactory,
        private readonly MailTransport $transport,
        private readonly Closure $clock,
        private readonly Closure $log,
    ) {
    }

    public function handle(Request $request): Response
    {
        try {
            return $this->dispatch($request);
        } catch (Throwable $e) {
            // Nur Klasse und Ort, keine Meldung (Meldungen könnten Eingaben enthalten).
            ($this->log)('error ' . $e::class . ' at ' . basename($e->getFile()) . ':' . $e->getLine());
            return $this->failure($request, 500);
        }
    }

    private function dispatch(Request $request): Response
    {
        $now = ($this->clock)();
        $signer = new Signer($this->config->string('secret'));

        if ($request->method === 'GET' && ($request->query['token'] ?? null) === '1') {
            return Response::json(200, $signer->issue($now));
        }
        if ($request->method !== 'POST') {
            return $this->reject($request, 405, 'Method Not Allowed', ['Allow' => 'GET, POST']);
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

        $pdo = ($this->pdoFactory)();
        [$allowed, $retryAfter] = (new RateLimiter($pdo, $this->config->string('secret')))->hit($request->ip, $now);
        $form = $request->form();
        $lang = $this->lang($form);
        if (!$allowed) {
            ($this->log)('rate_limited');
            return $this->tooManyRequests($request, $lang, $retryAfter);
        }

        if (($form['website'] ?? '') !== '') {
            ($this->log)('honeypot');
            return $this->accepted($request, $lang);
        }
        $ts = $form['ts'] ?? '';
        $sig = $form['sig'] ?? '';
        if ($ts !== '' || $sig !== '') {
            if ($ts === '' || $sig === '' || $signer->verify($ts, $sig, $now) !== Signer::OK) {
                ($this->log)('time_trap');
                return $this->accepted($request, $lang);
            }
        }

        $result = (new Validator())->validate($form);
        if (!$result['valid']) {
            return $this->validationError($request, $lang, $result['errors']);
        }

        $leads = new LeadRepository($pdo);
        $lead = $result['lead'];
        $id = $leads->insert($lead, $now);
        $mailer = new Mailer($this->transport, $this->config, $this->clock);
        $status = LeadRepository::DELIVERED;
        try {
            $mailer->sendToSales($lead);
        } catch (Throwable $e) {
            $status = LeadRepository::NOT_DELIVERED;
            ($this->log)('mail_failed sales lead=' . $id . ' ' . $e::class);
        }
        if ($status === LeadRepository::DELIVERED) {
            try {
                $mailer->sendConfirmation($lead);
            } catch (Throwable $e) {
                $status = LeadRepository::CONFIRMATION_FAILED;
                ($this->log)('mail_failed confirmation lead=' . $id . ' ' . $e::class);
            }
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

    /** @param array<string,string> $errors */
    private function validationError(Request $request, string $lang, array $errors): Response
    {
        if ($request->wantsJson()) {
            return Response::json(422, ['ok' => false, 'errors' => $errors]);
        }
        $codes = array_values(array_intersect(Validator::ERROR_CODES, array_values($errors)));
        $t = self::TARGETS[$lang];
        return Response::redirect($t['form'] . '?' . $t['param'] . '=' . implode(',', $codes) . '#' . $t['anchor']);
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

    private function noticePage(string $lang, bool $rateLimited): string
    {
        $mail = htmlspecialchars($this->config->string('contact_email'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        if ($lang === 'en') {
            $title = $rateLimited ? 'Too many requests' : 'Something went wrong';
            $text = $rateLimited ? 'Please try again later.' : 'Your enquiry could not be processed.';
            $contact = 'Please write to us directly:';
        } else {
            $title = $rateLimited ? 'Zu viele Anfragen' : 'Es ist ein Fehler aufgetreten';
            $text = $rateLimited ? 'Bitte versuchen Sie es später erneut.' : 'Ihre Anfrage konnte nicht verarbeitet werden.';
            $contact = 'Schreiben Sie uns bitte direkt:';
        }
        return '<!doctype html><html lang="' . $lang . '"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<meta name="robots" content="noindex"><title>' . $title . '</title></head><body>'
            . '<h1>' . $title . '</h1><p>' . $text . '</p><p>' . $contact . ' <a href="mailto:' . $mail . '">' . $mail . '</a></p>'
            . "</body></html>\n";
    }
}
