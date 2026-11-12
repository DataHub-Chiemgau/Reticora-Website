# Lead-Backend (PHP)

Nimmt das Kontaktformular der statischen Website entgegen (Spezifikation `docs/specs/2026-11-12-website-spec.md` §6).
Reines PHP 8.2+ ohne Framework; zur Laufzeit nur PDO und Sockets. Composer und PHPUnit sind ausschließlich Entwicklungswerkzeuge.

## Aufbau

```
backend/
  public/lead.php     einzige über das Web erreichbare Datei
  src/                Klassen und autoload.php (nicht im Webroot)
  bin/                migrate.php, purge.php (nur CLI)
  sql/                001_init.sql (MariaDB), 001_init.sqlite.sql (Tests)
  config.example.php  Vorlage für config.php
  tests/              PHPUnit (SQLite, ArrayTransport)
```

## Installation auf dem Hosting (Apache, PHP, MariaDB)

Zielstruktur (Beispiel; Pfade des Hosters anpassen):

```
~/reticora/                  außerhalb des Webroots
    config.php               aus config.example.php erzeugt, nie ins Repository
    src/  bin/  sql/         Inhalt von backend/src, backend/bin, backend/sql
~/public_html/               Webroot (Inhalt von dist/)
    api/lead.php             backend/public/lead.php
```

1. `src/`, `bin/`, `sql/` nach `~/reticora/` kopieren, `lead.php` nach `<Webroot>/api/lead.php`. `vendor/` und `tests/` gehören nicht auf den Server.
2. `config.example.php` nach `~/reticora/config.php` kopieren und ausfüllen: Datenbankzugang, SMTP-Zugang, Empfänger, `secret` (`openssl rand -hex 32`), `site_url`, Signatur. Dateirechte `600`.
3. `lead.php` sucht `src/` nur unter `../../reticora` (neben dem Webroot) oder in der Umgebungsvariable `RETICORA_HOME` (Verzeichnis mit `src/` und `config.php`); `RETICORA_CONFIG` setzt den vollen Pfad der Konfiguration. Es gibt bewusst keinen Rückgriff auf `../`. Fehlt alles oder ist die Konfiguration abgelehnt, antwortet `lead.php` mit einem allgemeinen 500.
   Zusätzlich `backend/public/.htaccess` neben `lead.php` ablegen (`LimitRequestBody 16384`, nur `lead.php` erreichbar). `backend/.htaccess` und die Dateien in `src/`, `bin/`, `sql/`, `tests/` (`Require all denied`) sind Schutz für den Fall, dass versehentlich das ganze `backend/` ins Webroot gelangt; der richtige Ort bleibt außerhalb des Webroots.
4. Tabellen anlegen: `php ~/reticora/bin/migrate.php` (idempotent).
5. Cronjob täglich: `php ~/reticora/bin/purge.php >> ~/reticora/purge.log`. Ausgabe sind nur Anzahlen (`leads_deleted`, `rate_limit_deleted`, `undelivered`).
6. Aufbewahrungsfrist: `retention_days` in `config.php`, Vorschlag 90 Tage. **Der Auftraggeber muss die Frist bestätigen** (Spec §6.3); der Wert ist bis dahin nur ein Vorschlag.
7. `log_path` auf eine Datei außerhalb des Webroots setzen. Das Protokoll enthält Ereignisnamen und Lead-IDs, keine Formularinhalte, keine IP-Adressen.
8. In `config.php` `mail.transport` auf `smtp` lassen. `file` schreibt Personendaten in eine Datei und ist nur für lokale Tests gedacht.

Die Signatur der Mails (`signature.de`/`signature.en`) ist im Beispiel leer. Die gesetzlich erforderlichen Angaben (Firma, Anschrift, Vertretung, Register, USt-IdNr.) liefert der Anbieter.

## HTTP-Vertrag (wie implementiert)

`POST /api/lead.php`, `Content-Type: application/x-www-form-urlencoded`, Felder `name`, `email`, `company`, `topic` (`demo|enterprise|security|other`), `message`, `lang` (`de|en`, sonst `de`), `website` (Köderfeld, leer), `ts`, `sig`.

Prüfreihenfolge: Methode, Größe (höchstens 16384 Byte, sonst 413), Origin, Content-Type (415), Rate-Limit, Köderfeld, Zeitfalle, Eingaben, Speichern, Mails.

- **Origin-Regel (streng):** `Origin` muss exakt (Schema, Host, Port, Groß-/Kleinschreibung egal) der Origin aus `site_url` entsprechen. Fehlt `Origin`, wird nur mit `Sec-Fetch-Site: same-origin` zugelassen. Alles andere (auch `Origin: null`) ergibt 403.
- **Antworten:** siehe Spec §6.1. JSON bei `Accept: application/json`: 200 `{"ok":true}`, 422 `{"ok":false,"errors":{"feld":"code"}}`, 429 mit `Retry-After`, 500 `{"ok":false}`, 403/405/413/415 `{"ok":false}`. Ohne JSON: 303 auf `/kontakt/danke/` bzw. `/en/contact/thanks/`; Fehler 303 auf `/kontakt/?fehler=<codes>#fehler` bzw. `/en/contact/?error=<codes>#error` (Codes kommagetrennt); 429/500 eine kleine HTML-Hinweisseite mit der Kontaktadresse aus der Konfiguration; 403/405/413/415 Klartext. 405 trägt `Allow: GET, POST`.
- **Fehlercodes (feste Liste):** `name.required`, `name.too_long`, `name.invalid`, `email.required`, `email.invalid`, `email.too_long`, `company.required`, `company.too_long`, `company.invalid`, `topic.invalid`, `message.too_long`, `message.invalid`, `lang.invalid`. `*.invalid` bei `name`/`company`/`message` bedeutet ungültiges UTF-8 oder Steuerzeichen (bei `name`/`company` zusätzlich Zeilenumbruch und unsichtbare Formatzeichen wie Zero-Width oder Bidi); ein Wert ohne sichtbares Zeichen ist `*.required`. In `message` werden sonstige Steuerzeichen (auch C1) still entfernt. Fehlendes oder unbekanntes `lang` ergibt `lang.invalid` (Weiterleitung dann auf das deutsche Formular).
- **Bestätigungsmail:** fester Text, enthält keine Eingabe der Person (kein Name, keine Firma, keine Nachricht), damit das Formular nicht zum Versand beliebiger Texte an Dritte taugt.
- **Konfiguration schlägt geschlossen fehl:** `secret` mit `AENDERN`, unter 32 Bytes oder unter 10 verschiedenen Zeichen wird abgelehnt (`config.example.php` ist daher unverändert nicht lauffähig). Kann der Rate-Limit-Zähler nicht geschrieben werden, antwortet das Backend mit 500, nie mit „erlaubt“.
- **SMTP:** Gesamtfrist 15 s je Versand (`mail.deadline`), je Lese-/Schreibvorgang höchstens `mail.timeout`. `encryption='none'` oder fehlende Anmeldung werden abgelehnt, außer `mail.allow_insecure=true` (nur Tests).
- **Tagesschlüssel des Rate-Limits** wird deterministisch aus `secret` und UTC-Datum abgeleitet (nicht zufällig). Bei Verlust von `secret` ließen sich alte Hashes durchprobieren; die 24-Stunden-Löschung begrenzt das. Bewusst so belassen.
- **Token:** `GET /api/lead.php?token=1` liefert `{"ts":<int>,"sig":"<hex64>"}`, `Cache-Control: no-store`, kein Cookie, ohne Datenbankzugriff. Jeder andere GET ergibt 405.
- **Zeitfalle:** Alter von `ts` 3 s bis 7200 s. Fehlen `ts` und `sig` ganz, entfällt die Zeitfalle. Nur eines vorhanden, Signatur falsch, zu früh oder zu alt: Antwort wie bei Erfolg, nichts wird gespeichert oder gesendet. Gleiches gilt für ein gefülltes `website`.
- **Rate-Limit:** 5 Anfragen je Stunde (festes Stundenfenster) je HMAC(IP, Tagesschlüssel aus `secret` und UTC-Datum). Es zählt jede Anfrage, die die Prüfungen bis dahin besteht. Die IP stammt aus `REMOTE_ADDR` (kein `X-Forwarded-For`).
- **Zustellstatus** in `lead.delivery`: `pending`, `delivered`, `not_delivered` (Mail an den Vertrieb fehlgeschlagen), `confirmation_failed` (nur Bestätigung fehlgeschlagen). Die Besucherin sieht in allen Fällen die Bestätigung.
- **Antwort-Kopfzeilen:** `Content-Type` mit `charset=utf-8`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`.

## Entwicklung und Tests

```
cd backend
composer install
vendor/bin/phpunit
```

Lokaler Lauf für E2E-Tests mit SQLite und Datei-Transport (statt SMTP):

```
cat > /tmp/e2e-config.php <<'PHP'
<?php return [
  'site_url' => 'http://127.0.0.1:8099', 'contact_email' => 'kontakt@example.com',
  'secret' => 'e2e-only-secret-0123456789-abcdefghijkl',
  'db' => ['dsn' => 'sqlite:/tmp/e2e.sqlite'],
  'mail' => ['transport' => 'file', 'file_path' => '/tmp/e2e-mails.jsonl',
             'from_address' => 'versand@example.com', 'from_name' => 'Reticora Website', 'to_address' => 'vertrieb@example.com'],
  'signature' => ['de' => '', 'en' => ''], 'log_path' => '/tmp/e2e.log',
];
PHP
export RETICORA_CONFIG=/tmp/e2e-config.php RETICORA_HOME="$PWD"   # backend/
php bin/migrate.php
php -S 127.0.0.1:8099 -t public        # Endpunkt: http://127.0.0.1:8099/lead.php
```

## Noch nicht geprüft

- Betrieb gegen **MariaDB** auf dem echten Hosting: getestet wird nur mit SQLite (gleiche PDO-Schnittstelle, portables SQL). `sql/001_init.sql` ist nicht gegen eine MariaDB-Instanz ausgeführt worden.
- **Echter SMTP-Versand** (TLS-Zertifikatsprüfung, STARTTLS, AUTH LOGIN beim konkreten Anbieter, Zustellung und Spam-Bewertung): getestet wird nur gegen einen lokalen Fake-Server ohne TLS.
- Verhalten hinter dem Proxy/der PHP-Umgebung des Hosters (Umgebungsvariablen, `REMOTE_ADDR`, Dateirechte, Cron-PHP-Version).
- Die Aufbewahrungsfrist von 90 Tagen ist ein Vorschlag und vom Auftraggeber zu bestätigen.
