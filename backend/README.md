# Lead-Backend (PHP)

Nimmt das Kontaktformular der statischen Website entgegen (Spezifikation `docs/specs/2026-11-12-website-spec.md` §6 mit den Änderungen §14 Ä-07 bis Ä-11 und Ä-18 ff.).
PHP 8.3 oder neuer (Ziel auf dem Hosting: 8.4), ohne Framework. Einzige Laufzeitabhängigkeit ist PHPMailer über Composer (`composer.lock` liegt im Repository); PHPUnit ist nur Entwicklungswerkzeug.

## Aufbau

```
backend/
  public/lead.php     einzige über das Web erreichbare Datei (+ .htaccess)
  src/                Klassen (Autoload über vendor/autoload.php, PSR-4)
  bin/                migrate.php, purge.php (nur CLI)
  sql/                001_init.sql (MariaDB), 001_init.sqlite.sql (Tests)
  templates/          vom Build erzeugt, nicht im Repository: contact.de.html, contact.en.html, form-texts.json
  vendor/             composer install (nicht im Repository)
  config.example.php  Vorlage für config.php
  tests/              PHPUnit (SQLite, ArrayTransport, Fixture-Vorlagen)
```

## Installation auf dem Hosting (Apache, PHP 8.4, MariaDB)

Zielstruktur (Beispiel; Pfade des Hosters anpassen):

```
~/reticora/                  außerhalb des Webroots
    config.php               aus config.example.php erzeugt, nie ins Repository, Rechte 600
    vendor/                  composer install --no-dev --classmap-authoritative (enthält PHPMailer und den Autoloader)
    src/  bin/  sql/         Inhalt von backend/src, backend/bin, backend/sql
    templates/               Inhalt von backend/templates nach `npm run build:release`
~/public_html/               Webroot (Inhalt von dist/)
    api/lead.php             backend/public/lead.php
    api/.htaccess            backend/public/.htaccess
```

1. `src/`, `bin/`, `sql/`, `templates/` nach `~/reticora/` kopieren; dort `composer install --no-dev --classmap-authoritative` ausführen (oder `vendor/` aus einem CI-Lauf mit derselben `composer.lock` hochladen). `lead.php` und `public/.htaccess` nach `<Webroot>/api/`. `tests/` gehört nicht auf den Server.
2. **Vorlagen der Kontaktseite:** Der Astro-Build (`npm run build` bzw. `build:release`) schreibt nach dem Bauen `backend/templates/contact.de.html` (Kopie von `dist/kontakt/index.html`), `contact.en.html` (Kopie von `dist/en/contact/index.html`, sobald es die englische Seite gibt) und `form-texts.json` (Fehlertexte aus `src/i18n/{de,en}.ts`, `form`). Diese Dateien gehören nach jedem Deploy der Website nach `~/reticora/templates/`, aus **demselben** Build wie `dist/`, sonst verweisen sie auf nicht mehr vorhandene `/_astro/`-Dateien. Fehlt eine Vorlage, zeigt `lead.php` bei Eingabefehlern eine kurze Hinweisseite (422) mit den Fehlertexten und einem Link zurück; die Eingaben gehen dann verloren. `templates_dir` in `config.php` setzt einen anderen Ort.
3. `config.example.php` nach `~/reticora/config.php` kopieren und jeden Wert `AENDERN` ersetzen (sonst wird die Datei abgelehnt): Datenbankzugang (eigener Benutzer, zufälliges Passwort), SMTP-Zugang, Empfänger, `site_url`. Dateirechte `600`.
4. `lead.php` sucht `vendor/autoload.php` nur unter `../../reticora` (neben dem Webroot) oder in der Umgebungsvariable `RETICORA_HOME`; `RETICORA_CONFIG` setzt den vollen Pfad der Konfiguration. Es gibt bewusst keinen Rückgriff auf `../`. Fehlt etwas oder ist die Konfiguration abgelehnt, antwortet `lead.php` mit einem allgemeinen 500.
   `backend/.htaccess` und die Dateien in `src/`, `bin/`, `sql/`, `tests/`, `templates/` (`Require all denied`) sind Schutz für den Fall, dass versehentlich das ganze `backend/` ins Webroot gelangt; der richtige Ort bleibt außerhalb des Webroots.
5. Tabellen anlegen: `php ~/reticora/bin/migrate.php` (idempotent; legt auch `rate_limit_key` an).
6. **Cronjob stündlich** (Spec Ä-10):
   ```
   17 * * * *  php ~/reticora/bin/purge.php >> ~/reticora/purge.log 2>&1
   ```
   Löscht Leads nach `retention_days`, Rate-Limit-Zähler abgelaufener Stundenfenster und überschreibt den Rate-Limit-Schlüssel, sobald ein neuer UTC-Tag begonnen hat. Ausgabe sind nur Anzahlen (`leads_deleted`, `rate_limit_deleted`, `undelivered`, `key_rotated`). Ein `undelivered` größer 0 heißt: Mails an den Vertrieb sind gescheitert, die Anfragen stehen nur in der Datenbank.
7. Aufbewahrungsfrist: `retention_days` in `config.php`, Vorschlag 90 Tage. **Der Auftraggeber muss die Frist bestätigen** (Spec §6.3).
8. `log_path` auf eine Datei außerhalb des Webroots setzen. Das Protokoll enthält Ereignisnamen und Lead-IDs, keine Formularinhalte, keine IP-Adressen.
9. `mail.transport` bleibt `smtp`. `file` (schreibt Personendaten in eine Datei) und `encryption: none` bzw. SMTP ohne Anmeldung gehen nur mit `mail.allow_insecure => true` und sind ausschließlich für lokale Tests.

## HTTP-Vertrag (wie implementiert)

`POST /api/lead.php`, `Content-Type: application/x-www-form-urlencoded`, Felder `name`, `email`, `company`, `topic` (`demo|enterprise|security|other`), `message`, `lang` (`de|en`), `website` (Köderfeld, leer). Weitere Felder (auch alte `ts`/`sig`) werden ignoriert.

Prüfreihenfolge: Methode, Größe (höchstens 16384 Byte, sonst 413), Origin (403), Content-Type (415), abgelaufene Rate-Limit-Zähler löschen, Rate-Limit je Herkunft (429), **Eingaben (422)**, Köderfeld, Mail-Konfiguration, Obergrenze aller angenommenen Anfragen (429), Speichern, Mail an den Vertrieb.

- **Nur POST** (Ä-07): Es gibt keinen Token-Endpunkt. Jede andere Methode, jeder GET mit oder ohne Query ergibt 405 mit `Allow: POST`, ohne Datenbankzugriff.
- **Keine Zeitfalle** (Ä-07): Eine Anfrage direkt nach dem Laden der Seite wird angenommen. Schutz: Köderfeld, Rate-Limit je Herkunft, Obergrenze für alle.
- **Prüfen vor allem anderen:** Ein ungültiges oder leeres Formular ergibt immer 422, auch mit gefülltem Köderfeld; es endet nie auf der Dankeseite.
- **Origin-Regel (streng):** `Origin` muss exakt (Schema, Host, Port, Groß-/Kleinschreibung egal, ein `/` am Ende erlaubt) der Origin aus `site_url` entsprechen. Fehlt `Origin`, wird nur mit `Sec-Fetch-Site: same-origin` zugelassen. Alles andere (auch `Origin: null`) ergibt 403.
- **Antworten mit `Accept: application/json`:** 200 `{"ok":true}`, 422 `{"ok":false,"errors":{"feld":"code"}}`, 429 mit `Retry-After`, 500 `{"ok":false}`, 403/405/413/415 `{"ok":false}`.
- **Antworten ohne JSON:** angenommen und Köderfeld: 303 auf `/kontakt/danke/` bzw. `/en/contact/thanks/` (feste Ziele). **Eingabefehler: 422 mit der Kontaktseite selbst** (Ä-08): Fehlertext am Feld (`#f-<feld>-err`), `aria-invalid`, Zusammenfassung mit Überschrift, Links zu den Feldern und `autofocus`, die Eingaben wieder in den Feldern (Anliegen wieder ausgewählt, Köderfeld leer). Keine Weiterleitung, keine Fehlercodes oder Eingaben in einer Adresse; die Adresse im Browser ist `/api/lead.php`. 429/500: kleine HTML-Hinweisseite mit der Kontaktadresse aus der Konfiguration. 403/405/413/415: Klartext.
- **Einsetzen in die Vorlage** (`src/ContactPage.php`): Field.astro und ErrorSummary.astro geben feste Marken aus (`data-rt-field`, `data-rt-option`, `data-rt-error`, `data-rt`), jede als letztes Attribut und mit Anführungszeichen. PHP ersetzt genau diese Zeichenfolgen in einem `strtr()`-Durchgang; kein HTML-Parser, kein regulärer Ausdruck auf Eingaben. Eingaben werden mit `htmlspecialchars(…, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` maskiert, in Attributen (`value="…"`) wie im Inhalt der `textarea`; ein Anliegen wird nur ausgewählt, wenn es exakt einer der vier Werte ist. Kommt eine Marke nicht genau einmal vor, gilt die Vorlage als fehlend (Hinweisseite, Protokoll `template_missing <lang>`); der Build bricht in diesem Fall schon vorher ab.
- **Kopfzeilen der 422-Seite:** dieselbe `Content-Security-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` und `Referrer-Policy` wie in `public/.htaccess` (ein Test vergleicht die Werte), damit Stile und Insel aus `/_astro/` laden. `Referrer-Policy: no-referrer` (sonst Standard des Backends) wäre hier falsch: Der Browser schickte beim erneuten Absenden aus dieser Seite `Origin: null`, und die Origin-Prüfung lehnte ab. Im Betrieb setzt `.htaccess` für `/api/` dieselben Werte zusätzlich; doppelte identische Kopfzeilen sind unschädlich.
- **Fehlercodes (feste Liste):** `name.required`, `name.too_long`, `name.invalid`, `email.required`, `email.invalid`, `email.too_long`, `company.required`, `company.too_long`, `company.invalid`, `topic.required` (leer), `topic.invalid` (unbekannter Wert), `message.too_long`, `message.invalid`, `lang.invalid`. `*.invalid` bei `name`/`company`/`message` bedeutet ungültiges UTF-8 oder Steuerzeichen (bei `name`/`company` zusätzlich Zeilenumbruch und unsichtbare Formatzeichen wie Bidi-Steuerzeichen, Zero-Width-Space, BOM, Soft Hyphen); **U+200C und U+200D sind in Namen und Firmen erlaubt** (Schreibung in z. B. persischer oder indischer Schrift). Ein Wert ohne sichtbares Zeichen ist `*.required`. In `message` werden sonstige Steuerzeichen (auch C1) still entfernt. Fehlendes oder unbekanntes `lang` ergibt `lang.invalid` (deutsche Seite; Text der Zusammenfassung ist die allgemeine Zeile `form.generic`).
- **Fehlertexte:** stammen aus `src/i18n/{de,en}.ts` (`form`), beim Build als `templates/form-texts.json` geschrieben. Die Insel liest dieselben Texte aus der Seite.
- **Mail (Ä-09):** genau eine Mail an `mail.to_address` (Vertriebspostfach), `Reply-To` ist die validierte Adresse. **An die eingegebene Adresse geht nie eine Mail**; den Eingang bestätigt die Dankeseite.
- **SMTP (Ä-11):** PHPMailer, `ssl` (Port 465) oder `starttls` (Port 587), Anmeldung und Zertifikatsprüfung Pflicht; sonst lehnt `PhpMailerTransport` die Konfiguration ab (500 vor dem Speichern). `mail.timeout` je Verbindungsaufbau/Lesevorgang, `mail.deadline` (Standard 15 s) als Gesamtfrist für alle Serverantworten eines Versands. Fehler beim Versand: Anfrage bleibt mit `not_delivered` gespeichert, die Besucherin sieht die Bestätigung.
- **Konfiguration schlägt geschlossen fehl:** Ein nicht ersetzter Platzhalter `AENDERN` irgendwo in `config.php` wird abgelehnt. Fehler in Datenbank- oder Mail-Konfiguration werden in `App::handle()` gefangen und ergeben für POST das allgemeine 500 (JSON oder Hinweisseite), nie eine PHP-Fehlermeldung. Kann der Rate-Limit-Zähler oder -Schlüssel nicht geschrieben werden, antwortet das Backend mit 500, nie mit „erlaubt“.
- **Rate-Limit je Herkunft:** 5 Anfragen je festem Stundenfenster (`rate_limit.max`, auf 1–100 begrenzt). Es zählt jede Anfrage, die die Prüfungen bis dahin besteht (auch ungültige und Köderfeld-Treffer). Herkunft ist die IPv4-Adresse aus `REMOTE_ADDR` bzw. bei IPv6 das **/64-Präfix**; IPv4-gemappte IPv6-Adressen (`::ffff:a.b.c.d`) zählen als IPv4. Gespeichert wird nur `HMAC-SHA256(Herkunft, Schlüssel)`.
- **Schlüssel (Ä-10):** 32 Zufallsbytes in der Tabelle `rate_limit_key`, beim ersten Gebrauch eines neuen UTC-Tages (Anfrage oder `purge.php`) überschrieben. Ohne Schlüssel lassen sich die Hashes nicht nachrechnen; nach dem Überschreiben auch nicht mit Zugriff auf die Datenbank. Die IP steht nie in Datenbank oder Protokoll.
- **Löschen der Zähler:** abgelaufene Fenster bei jeder Anfrage, die die Datenbank erreicht (POST nach Origin- und Größenprüfung), und stündlich durch `purge.php`.
- **Obergrenze für alle (Ä-07):** höchstens 60 angenommene Anfragen je Stundenfenster insgesamt (`rate_limit.global_max`, auf 1–1000 begrenzt); darüber 429 wie beim Limit je Herkunft. Es zählen nur gültige Anfragen ohne Köderfeld. Eingabefehler werden auch über der Grenze noch angezeigt.
- **Zustellstatus** in `lead.delivery`: `pending`, `delivered`, `not_delivered`.
- **Antwort-Kopfzeilen:** `Content-Type` mit `charset=utf-8`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `Referrer-Policy: no-referrer` (außer der 422-Seite, s. o.), kein Cookie.

## Entwicklung und Tests

```
cd backend
composer install
vendor/bin/phpunit
```

`tests/fixtures/templates/` enthält eine verkürzte Vorlage mit denselben Marken wie die gebaute Seite; liegt eine gebaute Vorlage in `templates/`, prüft ein weiterer Test auch diese.

Lokaler Lauf mit SQLite und Datei-Transport: `npm run serve` (siehe `tests/server/start.sh`). Das startet Apache auf `127.0.0.1:8080` und zwei PHP-Instanzen mit jeweils frischer Datenbank: `/api/lead.php` (Limits an der oberen Grenze) und `/api-limit/lead.php` (Standardlimits, nur für den Test des Rate-Limits). Die Testinstanzen reichen Anfragen per Proxy an den PHP-Entwicklungsserver weiter; die Kopfzeilen der 422-Seite stammen dort allein aus PHP.

## Noch nicht geprüft

- Betrieb gegen **MariaDB** auf dem echten Hosting: getestet wird nur mit SQLite (gleiche PDO-Schnittstelle, portables SQL). `sql/001_init.sql` ist nicht gegen eine MariaDB-Instanz ausgeführt worden.
- **Echter SMTP-Versand** über PHPMailer (TLS-Zertifikatsprüfung, STARTTLS/SMTPS, Anmeldeverfahren beim konkreten Anbieter, Zustellung, Spam-Bewertung): getestet wird nur gegen einen lokalen Fake-Server ohne TLS.
- **Client-IP hinter dem Proxy des Hosters:** `REMOTE_ADDR` muss die Adresse des Besuchers sein. Steht dort die Adresse eines vorgeschalteten Proxys, zählen alle Besucher als eine Herkunft (dann greift nach 5 Anfragen das Limit für alle). Auf dem Hosting mit zwei Anschlüssen prüfen. `X-Forwarded-For` wird bewusst nicht gelesen.
- **Kopfzeilen auf dem Hosting:** ob PHP über FastCGI/CGI läuft und ob `Header always set` aus `.htaccess` die von PHP gesetzte CSP ersetzt oder ergänzt (beides ist unschädlich, da gleich).
- Die Aufbewahrungsfrist von 90 Tagen ist ein Vorschlag und vom Auftraggeber zu bestätigen.
