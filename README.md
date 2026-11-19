# Reticora Website

Zweisprachige (Deutsch, Englisch) Marketing-Website für Reticora, B2B. Astro 7 (statisch), Tailwind 4, Apache; ein kleines PHP-Backend nimmt das Kontaktformular entgegen. Stand: Phase 6 abgeschlossen (alle Seiten in beiden Sprachen, Formular und Backend). Inhalte, Rechtstexte, Claims, Bilder und Anbieterangaben sind noch nicht freigegeben, siehe „Release-Sperre“.

## Voraussetzungen

- Node 22.23.4 (siehe `.nvmrc`)
- `apache2` für den lokalen Testserver (`sudo apt-get install -y apache2`; benötigt `mod_rewrite`, `mod_headers`, `mod_proxy`, `mod_proxy_http`)
- PHP ab 8.3 (CI: 8.4) mit `pdo_sqlite` und `mbstring`, dazu `composer`, für Backend und Testserver (`sudo apt-get install -y php-cli php-sqlite3 php-mbstring composer`)
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
| `npm run serve` | Apache auf `http://127.0.0.1:8080` mit `dist/` als Wurzel, dahinter das PHP-Backend (SQLite, Mails als Datei) |
| `npm run test:e2e` | Playwright-Tests gegen den Apache-Testserver |
| `npm run lhci` | Lighthouse (fünf Läufe, Mobilprofil) für sechs Seiten gegen den Apache-Testserver. Meldet Lighthouse einen Laufzeitfehler (`Runtime error encountered`, z. B. `NO_NAVSTART`) und ist kein Grenzwert verletzt, wiederholt `scripts/lhci.mjs` den Lauf einmal (deutlich ausgegeben); verletzte Grenzwerte scheitern sofort |
| `npm run build:release` | Release-Build ohne Entwicklungsseiten, danach Release-Sperre |
| `node scripts/check-security-txt.mjs` | Warnlauf für den Ablauf der `security.txt` (läuft wöchentlich in `.github/workflows/security-txt.yml`) |
| `cd backend && vendor/bin/phpunit` | PHP-Tests des Backends |

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

- `npm run serve` (und damit `npm run test:e2e`) startet Apache auf Port 8080 und zwei PHP-Entwicklungsserver mit SQLite hinter `/api/lead.php`. Mails werden als JSON-Zeilen in eine Datei unter `$TMPDIR/reticora-e2e/` geschrieben, es geht nichts ins Netz. Die Datenbanken sind bei jedem Start neu.
- Mit JavaScript sendet die Insel `form` per `fetch`; ohne JavaScript sendet das Formular normal. Bei Eingabefehlern ohne JavaScript antwortet `lead.php` mit `422` und der fertigen Kontaktseite aus `backend/templates/contact.<lang>.html` (entsteht bei jedem Build aus `dist/`), mit Fehlertexten am Feld und den maskierten Eingaben.
- Es geht keine Bestätigungsmail an die eingegebene Adresse; die Mail geht nur an das Vertriebspostfach.
- `npm run dev` enthält das Backend nicht. Das Formular dort zu prüfen heißt: bauen und `npm run serve`.
- Einrichtung auf dem Hosting (Konfiguration, Migration, stündlicher Löschlauf): `backend/README.md`.

## Release-Sperre

`npm run build:release` bricht heute mit Exit-Code 1 ab, und zwar absichtlich. Die Prüfung listet offene Claims, fehlende Screenshots, Platzhalter in gebauten Seiten, fehlende Anbieterangaben (E-Mail, Telefon, Meldeadresse für Sicherheitslücken) und Entwicklungsseiten in `dist/`. Geplante Seiten und tote interne Links gibt es nicht mehr. Die Seite darf nicht online gehen, bevor diese Liste leer ist und die Rechtsprüfung abgeschlossen ist.

## Budgets

`tests/unit/budget.test.ts` prüft jede gebaute HTML-Seite beider Sprachen (gzip): JavaScript höchstens 35 KB, HTML + CSS + JS + Schriften höchstens 200 KB. Dazu die Inseln (minifiziert, samt Importen): `impact` höchstens 8 KB, `copy` 1 KB, `form` 3 KB, `filter` 2 KB. Lighthouse (`lighthouserc.json`) misst Startseite, Preise, Kontakt, Discovery, `/en/` und `/en/pricing/`: LCP ≤ 2 s, CLS ≤ 0,05, TBT ≤ 150 ms, Performance, Accessibility und Best Practices je ≥ 0,95.

## Bekannte Einschränkungen und Ungeprüftes

- **Abschnittsanker englischer Seiten sind deutsch** (zum Beispiel `#kategorie-network`, `#abschluss`, `#quelle-gewinnt`). Die Ansichten sind für beide Sprachen gemeinsam; Adressen und Anker bleiben unverändert, sichtbar ist davon nur das Fragment in der Adresszeile.
- **MariaDB** ist nicht getestet: Backend-Tests und E2E laufen mit SQLite. Das MariaDB-Schema (`backend/sql/001_init.sql`) ist erst auf dem Zielsystem zu prüfen. Ein Container mit Apache, PHP, MariaDB und SMTP-Fänger ist für Phase 7 vorgesehen (Spec §14 Ä-31).
- **Echter SMTP-Versand und TLS** über PHPMailer sind nicht getestet (Tests nutzen Dateitransport und Fälschungen).
- **Client-IP hinter dem Proxy des Hosters:** Das Rate-Limit nutzt `REMOTE_ADDR`. Verbirgt ein Proxy die Adresse, zählen alle Besucher als eine Herkunft. Auf dem Hosting zu prüfen.
- **`.htaccess` und Apache-Verhalten** (`LimitRequestBody`, Schutzdateien, doppelte Kopfzeilen von PHP und Apache auf der 422-Seite) sind nur gegen den lokalen Apache geprüft, nicht gegen Hetzner.
- **Firefox:** In der CI hing das Laden einer Seite vereinzelt (ein Test von rund 250, `goto`). Die Ursache ist **ungeklärt**. `KeepAlive Off` im Testserver ist eine Vermutung, kein Beleg (mit `KeepAlive Off` lief der E2E-Schritt zuletzt durch). Die CI wiederholt fehlgeschlagene Tests einmal (`retries: 1`), zeichnet beim Wiederholen einen Trace auf und lädt bei einem Fehlschlag das Zugriffsprotokoll des Apache-Testservers (`%D` Antwortzeit, `%X` Verbindungsstatus) und `test-results/` als Artefakt `e2e-diagnose` hoch (7 Tage). Lokal bleibt `--trace off` ratsam. Firefox und WebKit laufen nur in der CI, lokal nicht.
- **Obergrenze für alle Anfragen:** Über `rate_limit.global_max` (Standard 60 je Stunde) werden gültige Anfragen nur gespeichert (Status `held`, keine Mail), die Besucherin sieht die normale Dankeseite; `backend/bin/retry.php` stellt sie per Cron nach. Erst 10 × `global_max` je Stunde ergibt 429. `purge.php` löscht `held` und `not_delivered` nie und endet mit Exit-Code 1, solange es welche gibt (Cron-Mail an den Betreiber). Läuft `retry.php` nicht, sieht der Vertrieb diese Anfragen nicht. Details: `backend/README.md`.
- **Fehlende Vorlagen:** Fehlt `backend/templates/contact.en.html` auf dem Server, zeigt `lead.php` bei Fehlern ohne JavaScript nur eine kurze Hinweisseite.
- **Deploy ist nicht automatisiert.** Es gibt keinen Deploy-Workflow. Auf den Server gehören `dist/`, `backend/templates/` aus demselben Build, `lead.php`, `.htaccess` und `composer install --no-dev` (siehe `backend/README.md`).
- **Gestapelte Tabellen** (`display: block` unter 48 rem) können in Safari mit VoiceOver die Tabellensemantik verlieren; nicht mit Screenreadern geprüft.
- Manuelle Barrierefreiheitsprüfung, Sicherheits- und Datenschutzprüfung stehen aus (Phase 7). Rechtstexte, Claims, Screenshots und Anbieterangaben liegen beim Auftraggeber (Phase 8).
