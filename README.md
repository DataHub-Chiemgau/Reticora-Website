# Reticora Website

Zweisprachige (Deutsch, Englisch) Marketing-Website für Reticora, B2B. Astro 7 (statisch), Tailwind 4, Apache; ein kleines PHP-Backend nimmt das Kontaktformular entgegen. Stand: Phase 6 abgeschlossen (alle Seiten in beiden Sprachen, Formular und Backend). Inhalte, Rechtstexte, Claims, Bilder und Anbieterangaben sind noch nicht freigegeben, siehe „Release-Sperre“.

## Voraussetzungen

- Node 22.23.4 (siehe `.nvmrc`)
- `apache2` für den lokalen Testserver (`sudo apt-get install -y apache2`; benötigt `mod_rewrite`, `mod_headers`, `mod_proxy`, `mod_proxy_fcgi`, `mod_env`)
- PHP ab 8.3 (CI: 8.4) mit `pdo_sqlite` und `mbstring` für CLI und **PHP-FPM**, dazu `composer`, für Backend und Testserver (`sudo apt-get install -y php-cli php-fpm php-sqlite3 php-mbstring composer`); in der CI installiert `setup-php` FPM mit
- Einmalig: `npm ci`, `cd backend && composer install`
- Playwright-Browser für die E2E-Tests (`npx playwright install --with-deps`; lokal läuft nur Chromium, Firefox und WebKit laufen in der CI)
- Für Lighthouse ein Chrome, bei Bedarf `CHROME_PATH=/pfad/zu/chrome npm run lhci`

## Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver (ohne PHP-Backend; das Formular sendet dort ins Leere) |
| `npm run build` | Tokens erzeugen und nach `dist/` bauen (inklusive Entwicklungsseite `/dev/bausteine`); schreibt außerdem `backend/templates/` |
| `npm run check` | Astro- und TypeScript-Prüfung |
| `npm test` | Unit-Tests (Vitest); Tests, die `dist/` brauchen, werden ohne Build übersprungen |
| `npm run validate` | HTML-Prüfung von `dist/` (html-validate) |
| `npm run serve` | Apache auf `http://127.0.0.1:8080` mit `dist/` als Wurzel, `/api/lead.php` wie beim Hoster mit `api/.htaccess` über PHP-FPM (SQLite, Mails als Datei) |
| `npm run test:e2e` | Playwright-Tests gegen den Apache-Testserver |
| `npm run lhci` | Lighthouse (fünf Läufe, Mobilprofil) für sechs Seiten gegen den Apache-Testserver. Meldet Lighthouse einen Laufzeitfehler (`Runtime error encountered`, z. B. `NO_NAVSTART`) und ist kein Grenzwert verletzt, wiederholt `scripts/lhci.mjs` den Lauf einmal (deutlich ausgegeben); verletzte Grenzwerte scheitern sofort |
| `npm run build:release` | Release-Build ohne Entwicklungsseiten, danach Release-Sperre |
| `node scripts/check-security-txt.mjs` | Warnlauf für den Ablauf der `security.txt` (läuft wöchentlich in `.github/workflows/security-txt.yml`) |
| `cd backend && vendor/bin/phpunit` | PHP-Tests des Backends (Suite `unit`, SQLite) |
| `bash scripts/integration-local.sh [--browser]` | Integrationstests ohne Docker gegen MariaDB und SMTP mit STARTTLS (siehe „Zielumgebung“) |

Die Prüfkette vor jedem Commit: `npm run check && npm run build && npm test && npm run validate && npm run test:e2e -- --trace off` (`--trace off` nur lokal; die CI lässt es weg), dazu `cd backend && vendor/bin/phpunit`.

## Aufbau

- `src/pages`: dünne Seitendateien, deutsch im Wurzelverzeichnis, englisch unter `src/pages/en/`; jede ruft eine Ansicht auf
- `src/views`: die eigentlichen Seitenaufbauten, je eine Ansicht für beide Sprachen (Prop `lang`)
- `src/content/de`, `src/content/en`: Texte je Seite als typisierte Objekte; die englischen müssen die Form der deutschen haben (`Translation<T>`); `src/content/index.ts` ordnet sie zu
- `src/components`, `src/layouts`, `src/islands`, `src/styles`: Bausteine, Rahmen, Skript-Inseln (`impact`, `copy`, `form`, `filter`), Stile
- `src/data`: Claims, Screenshots, Preise, Geräte, Links, Topologie, Anbieterangaben (`site.ts`)
- `src/i18n`: Oberflächentexte (`de.ts`, `en.ts`) und die Routentabelle `routes.ts` (deutsche und englische Adresse, Stand je Sprache)
- `src/dev`, `src/integrations`: Entwicklungsseite und Build-Einbindungen (Vorlagen für das Backend, `security.txt`)
- `backend/`: PHP-Lead-Endpunkt (`public/lead.php`), `src/`, `bin/` (Migration, Löschlauf), `sql/`, `templates/` (vom Build erzeugt, nicht im Repository), `tests/`; Einrichtung und Vertrag in `backend/README.md`
- `scripts`: Token-Erzeugung, Schriften, Release-Prüfung, Budget-Hilfen, `security.txt`
- `tests/unit`, `tests/e2e`, `tests/server`: Tests und Apache-Testserver
- `design`: Design-Quellen und Tokens
- `docs`: Spezifikation, Inhaltsplan, Texte je Seite (`docs/copy`, `docs/copy/en`), Designsystem, Compliance-Matrix, Vendor-Register, Pläne

## Eine Seite hinzufügen

1. Texte schreiben: `docs/copy/<seite>-de.md` und `-en.md`; Aussagen über das Produkt brauchen einen Eintrag in `src/data/claims.ts`.
2. Route in `src/i18n/routes.ts` eintragen (deutsche und englische Adresse; Stand zunächst `geplant`, dann `gebaut`).
3. Inhalt als `src/content/de/<seite>.ts` und `src/content/en/<seite>.ts` anlegen und in `src/content/index.ts` (`DE`, `EN`) einhängen. Die englische Datei ist als `Translation<typeof de>` typisiert; `tests/unit/content-parity.test.ts` vergleicht Form, Claims und Zahlen.
4. Ansicht `src/views/<Seite>.astro` mit Prop `lang`; Ansichten lesen Texte nur über `content(lang)`, nie direkt aus `content/de` (ein Test prüft das).
5. Zwei dünne Seiten `src/pages/<pfad>/index.astro` und `src/pages/en/<pfad>/index.astro`, die die Ansicht mit `lang="de"` bzw. `lang="en"` aufrufen.
6. Tests: `tests/e2e/pages.spec.ts` und `english.spec.ts` laufen über alle gebauten Routen; seitenspezifische Tests in einer eigenen Datei.

## Kontaktformular in Entwicklung und Test

- `npm run serve` (und damit `npm run test:e2e`) startet Apache auf Port 8080 und PHP-FPM auf `127.0.0.1:8083` mit zwei Instanzen (`/api/lead.php`, `/api-limit/lead.php`, je eine SQLite-Datenbank). `lead.php` und `api/.htaccess` liegen wie im Paket in einer Webroot-Kopie unter der Wurzel-`.htaccess`; die Tests prüfen so die Kopfzeilen von `/api/` wie beim Hoster (`tests/e2e/api-headers.spec.ts`). Mails werden als JSON-Zeilen in eine Datei unter `$TMPDIR/reticora-e2e/` geschrieben, es geht nichts ins Netz. Die Datenbanken sind bei jedem Start neu.
- Mit JavaScript sendet die Insel `form` per `fetch`; ohne JavaScript sendet das Formular normal. Bei Eingabefehlern ohne JavaScript antwortet `lead.php` mit `422` und der fertigen Kontaktseite aus `backend/templates/contact.<lang>.html` (entsteht bei jedem Build aus `dist/`), mit Fehlertexten am Feld und den maskierten Eingaben.
- Es geht keine Bestätigungsmail an die eingegebene Adresse; die Mail geht nur an das Vertriebspostfach.
- `npm run dev` enthält das Backend nicht. Das Formular dort zu prüfen heißt: bauen und `npm run serve`.
- Einrichtung auf dem Hosting (Konfiguration, Migration, stündlicher Löschlauf): `backend/README.md`.

## Zielumgebung (Phase 7)

Neben dem schnellen Testserver (`npm run serve`: SQLite, Mails als Datei, PHP-FPM) gibt es eine Umgebung, die dem Hosting nahekommt. Sie prüft das Backend gegen MariaDB und einen SMTP-Server mit STARTTLS und Anmeldung und die gebaute Website gegen Apache mit PHP als Modul.

**Was der Compose-Stack nachbildet** (`compose.yaml`, `docker/`):

- `web`: `php:8.4-apache` (Apache 2.4, PHP als Modul) mit `rewrite`, `headers`, `expires`, `deflate`, `setenvif`, `filter`, `pdo_mysql`; `display_errors=Off`, `expose_php=Off`, `ServerTokens Prod`, Zeitzone `Europe/Berlin` (das Backend rechnet in UTC, eine andere Zeitzone deckt Fehler auf). Aufbau wie in `backend/README.md`: Webroot `/var/www/html` = Inhalt von `dist/` (beim Start aus dem schreibgeschützt eingehängten `dist/` kopiert) plus `api/lead.php` und `api/.htaccess`, `AllowOverride All`, die Regeln kommen aus den `.htaccess`-Dateien. Das Backend liegt außerhalb des Webroots unter `/var/www/reticora` (= `~/reticora`) mit `vendor/` aus `composer install --no-dev --classmap-authoritative`, `templates/` aus demselben Build und einer beim Start erzeugten `config.php` (Rechte 640, `docker/config.integration.php`). `lead.php` findet es wie im Betrieb über `../../reticora`.
- `db`: `mariadb:11.4`, Schema aus `backend/sql/001_init.sql`, eigener Benutzer `reticora` mit beim ersten Start erzeugtem Zufallspasswort, Root-Passwort zufällig und unbekannt.
- `mail`: Mailpit (`axllent/mailpit:v1.33.1`), SMTP nur nach STARTTLS und nur mit Anmeldung; Serverzertifikat von einer beim Start erzeugten Test-CA. Der Web-Container trägt die Test-CA in seinen Zertifikatsspeicher ein; die Zertifikatsprüfung bleibt an (ein Test schickt an einen zweiten Namen desselben Servers, der nicht im Zertifikat steht, und erwartet `not_delivered`).
- Alle Zugangsdaten erzeugt `docker/web/gen-secrets.sh` beim ersten Start im Volume `secrets`; im Repository steht kein Passwort. `docker compose down -v` verwirft alles.

**Was anders ist als bei Hetzner** (nicht prüfbar, bleibt für die Abnahme auf dem Hosting):

- PHP-Anbindung: im Container `mod_php`, im Testserver PHP-FPM, beim Hoster vermutlich FastCGI/CGI. In beiden nachgestellten Varianten trägt jede Antwort von `/api/lead.php` jede Sicherheitskopfzeile genau einmal und kein `X-Powered-By` (`api/.htaccess` entfernt die Werte von PHP, Sicherheitsprüfung S-04/S-05). Ob `LimitRequestBody` greift und welche `php.ini`-Werte gelten (`expose_php`, `display_errors`), ist auf dem Hosting zu prüfen.
- Vorgeschalteter Proxy des Hosters: hier gibt es keinen. Ob `REMOTE_ADDR` beim Hoster die Adresse des Besuchers ist, prüft dieser Stack nicht (siehe `backend/README.md`).
- Echte DNS-Namen und TLS der Website (HSTS, Umleitung auf `https://www`) fehlen; der Stack spricht HTTP auf `127.0.0.1:8088`.
- Mailanbieter: Mailpit nimmt jede Mail an. Anmeldeverfahren, Zertifikatskette, Zustellung in fremde Postfächer und Spam-Bewertung des echten Anbieters sind nicht geprüft.
- MariaDB-Version und Servereinstellungen (`sql_mode`, Zeichensatz-Standard) des Hosters können abweichen; lokal läuft MariaDB 10.11 aus Ubuntu, im Container 11.4.
- Cronjobs laufen nicht von selbst; die Tests rufen `bin/purge.php` und `bin/retry.php` direkt auf und prüfen Exit-Codes und Ausgabe.

**Tests:**

- `backend/tests/Integration/` (PHPUnit-Testsuite `integration`, nur mit `RETICORA_INTEGRATION=1`, sonst übersprungen; `vendor/bin/phpunit` ohne Angabe führt nur die schnelle Suite `unit` aus): Migration idempotent und `utf8mb4`, Umlaute und Emoji in allen Textfeldern byteweise unverändert, Zustellung über STARTTLS mit Anmeldung (genau eine Mail an das Vertriebspostfach, `Reply-To` die eingegebene Adresse, keine Mail an sie), falsches SMTP-Passwort → `not_delivered` → `purge.php` Exit 1 → `retry.php` nach Korrektur Exit 0, Zertifikatsprüfung, Zeitlimit bei stummem Server, Rate-Limit je Herkunft (IPv4, IPv6-/64 und /48, nur `REMOTE_ADDR`, auch über echtes HTTP mit `X-Forwarded-For`), Obergrenze für alle (`held`, harte Grenze 429, Nachversand), stündlicher Schlüsselwechsel und Umstellung einer Datenbank aus dem ersten Schema, Löschlauf, hängengebliebenes `pending`. Konfiguration nur über Umgebungsvariablen (`RETICORA_IT_*`, siehe `IntegrationTestCase.php`).
- `tests/e2e-integration/` mit `playwright.integration.config.ts` (nur Chromium, startet keinen Server, `RETICORA_IT_BASE_URL`, Standard `http://127.0.0.1:8088`): Formular Deutsch und Englisch mit und ohne JavaScript bis zur Dankeseite mit genau einer Mail an den Vertrieb, 422-Seite ohne JavaScript, Sicherheits-Kopfzeilen auf 200, 301, 404, 403, 405, 413 und 422 (auch `/api/lead.php`), gesperrte Pfade (`/backend/`, Punktdateien, `.htaccess`, Backend außerhalb des Webroots), englische 404-Seite, `chunked` über 16 KB ohne Mail. Jede Sicherheitskopfzeile muss genau einmal vorkommen; doppelte lassen den Test scheitern.

**In der CI** (`.github/workflows/integration.yml`, bei Push, Pull Request und von Hand): `npm ci`, `npm run build`, `composer install` (für PHPUnit), `docker compose up -d --build --wait`, die Backend-Integrationstests **im Web-Container** (`docker compose exec -T -w /opt/backend-src web php vendor/bin/phpunit --testsuite integration`; dort gelten die PHP-Version, die `php.ini` und der Zertifikatsspeicher des Containers, Datenbank und Mailserver werden über das Compose-Netz erreicht), dann Playwright gegen `127.0.0.1:8088` mit Mailpit-API auf `127.0.0.1:8025`. Bei einem Fehlschlag: `docker compose logs` und `test-results/` als Artefakt `integration-diagnose` (7 Tage). Am Ende immer `docker compose down -v`.

**Lokal mit Docker:** `npm run build && (cd backend && composer install) && docker compose up -d --build --wait`, dann die beiden Testbefehle wie in der CI, zum Schluss `docker compose down -v`.

**Lokal ohne Docker:** `scripts/integration-local.sh` startet als aktueller Benutzer in einem eigenen Verzeichnis MariaDB (`apt-get install -y mariadb-server`, Port 3307, eigener Socket) und einen SMTP-Fänger mit STARTTLS und Anmeldung (Python-Paket `aiosmtpd`, Interpreter über `RETICORA_IT_PYTHON`; jede Mail als JSON-Datei) und führt die Backend-Integrationstests aus. Mit `--browser` zusätzlich Apache auf Port 8088 nach `tests/server/httpd.conf.tmpl` mit PHP-FPM (wie `npm run serve`, aber gegen MariaDB und den SMTP-Fänger; braucht `php-fpm` mit `pdo_mysql`) und die Browser-Integrationstests; die Kopfzeilen von `/api/` werden dort ebenso geprüft wie im Container.

## Release-Sperre

`npm run build:release` bricht heute mit Exit-Code 1 ab, und zwar absichtlich. Die Prüfung listet offene Claims, fehlende Screenshots, Platzhalter in gebauten Seiten, fehlende Anbieterangaben (E-Mail, Telefon, Meldeadresse für Sicherheitslücken) und Entwicklungsseiten in `dist/`. Geplante Seiten und tote interne Links gibt es nicht mehr. Die Seite darf nicht online gehen, bevor diese Liste leer ist und die Rechtsprüfung abgeschlossen ist.

## Budgets

`tests/unit/budget.test.ts` prüft jede gebaute HTML-Seite beider Sprachen (gzip): JavaScript höchstens 35 KB, HTML + CSS + JS + Schriften höchstens 200 KB. Dazu die Inseln (minifiziert, samt Importen): `impact` höchstens 8 KB, `copy` 1 KB, `form` 3 KB, `filter` 2 KB. Lighthouse (`lighthouserc.json`) misst Startseite, Preise, Kontakt, Discovery, `/en/` und `/en/pricing/`: LCP ≤ 2 s, CLS ≤ 0,05, TBT ≤ 150 ms, Performance, Accessibility und Best Practices je ≥ 0,95.

## Bekannte Einschränkungen und Ungeprüftes

- **Abschnittsanker englischer Seiten sind deutsch** (zum Beispiel `#kategorie-network`, `#abschluss`, `#quelle-gewinnt`). Die Ansichten sind für beide Sprachen gemeinsam; Adressen und Anker bleiben unverändert, sichtbar ist davon nur das Fragment in der Adresszeile.
- **MariaDB und SMTP mit STARTTLS** sind gegen die Zielumgebung geprüft (Abschnitt „Zielumgebung“), nicht gegen das Hosting selbst. Die schnellen Suiten (`vendor/bin/phpunit`, `npm run test:e2e`) laufen weiter mit SQLite und Dateitransport.
- **Echter Mailanbieter** (Anmeldeverfahren, Zertifikatskette, Zustellung, Spam-Bewertung) ist nicht geprüft.
- **Client-IP hinter dem Proxy des Hosters:** Das Rate-Limit nutzt `REMOTE_ADDR`. Verbirgt ein Proxy die Adresse, zählen alle Besucher als eine Herkunft. Auf dem Hosting zu prüfen.
- **`.htaccess` und Apache-Verhalten** (`LimitRequestBody`, Schutzdateien, Kopfzeilen von `/api/`) sind gegen den lokalen Apache mit PHP-FPM und gegen den Container mit PHP als Modul geprüft, nicht gegen Hetzner.
- **Firefox:** In der CI hing das Laden einer Seite vereinzelt (ein Test von rund 250, `goto`). Die Ursache ist **ungeklärt**. `KeepAlive Off` im Testserver ist eine Vermutung, kein Beleg (mit `KeepAlive Off` lief der E2E-Schritt zuletzt durch). Die CI wiederholt fehlgeschlagene Tests einmal (`retries: 1`), zeichnet beim Wiederholen einen Trace auf und lädt bei einem Fehlschlag das Zugriffsprotokoll des Apache-Testservers (`%D` Antwortzeit, `%X` Verbindungsstatus) und `test-results/` als Artefakt `e2e-diagnose` hoch (7 Tage). Lokal bleibt `--trace off` ratsam. Firefox und WebKit laufen nur in der CI, lokal nicht. Ein Rückwärtsweg mit Umschalt+Tab beginnt in den Tests an einem Anker am Ende der Seite (Firefox lässt den Startpunkt nach dem Verlassen der Seite beim zuletzt fokussierten Element), und ein verdeckter Fokus wird nach dem nächsten Rendern noch einmal gemessen (WebKit scrollt fokussierte Felder erst dann in die Sicht).
- **Obergrenze für alle Anfragen:** Über `rate_limit.global_max` (Standard 60 je Stunde) werden gültige Anfragen nur gespeichert (Status `held`, keine Mail), die Besucherin sieht die normale Dankeseite; `backend/bin/retry.php` stellt sie per Cron nach. Erst 10 × `global_max` je Stunde ergibt 429. Gespeichert werden höchstens `rate_limit.held_max` (Standard 500) zurückgehaltene Anfragen; darüber antwortet das Formular für alle mit 429. `purge.php` löscht `held`, `not_delivered` und hängengebliebenes `pending` nie und endet mit Exit-Code 1, solange es welche gibt (Cron-Mail an den Betreiber). Läuft `retry.php` nicht, sieht der Vertrieb diese Anfragen nicht. Details: `backend/README.md`.
- **Fehlende Vorlagen:** Fehlt `backend/templates/contact.en.html` auf dem Server, zeigt `lead.php` bei Fehlern ohne JavaScript nur eine kurze Hinweisseite.
- **Deploy:** Workflow `deploy.yml` mit Runbook `docs/deploy.md` (vorbereitet, noch nie gegen das Hosting gelaufen; Jobs mit Secrets nur vom Hauptzweig). Vorgehen bei Anfragen von Betroffenen: `docs/betrieb-anfragen.md`.
- **Gestapelte Tabellen** (`display: block` unter 48 rem) können in Safari mit VoiceOver die Tabellensemantik verlieren; nicht mit Screenreadern geprüft.
- Manuelle Barrierefreiheitsprüfung, Sicherheits- und Datenschutzprüfung stehen aus (Phase 7). Rechtstexte, Claims, Screenshots und Anbieterangaben liegen beim Auftraggeber (Phase 8).
