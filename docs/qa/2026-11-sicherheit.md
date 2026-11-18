# Prüfprotokoll Sicherheit – Website Reticora

| | |
|---|---|
| Stand | 2026-11-18 (Phase 7, Task 2), Zweig `claude/phase-7-qa`, Stand `1b1d518` |
| Gegenstand | statischer Build (`dist/`, Entwicklungs- und Release-Modus), `.htaccess`-Dateien, Lead-Backend (`backend/`), Deploy-Paket (`scripts/deploy/package.mjs`), Deploy-Skripte (`scripts/deploy/*.sh`), Workflows (`.github/workflows/*.yml`), Container und Integrationsaufbau (`docker/`, `compose.yaml`, `scripts/integration-local.sh`), Abhängigkeiten, Git-Verlauf |
| Maßstab | Spec `docs/specs/2026-11-12-website-spec.md` §6–§9, §11, §14 (Ä-07 bis Ä-35), `backend/README.md`, `docs/deploy.md` |
| Nicht Gegenstand | das Hosting-Konto bei Hetzner (nicht erreichbar), die Anwendung Reticora und die Demo-Instanz, Inhalte (Rechtstexte, Claims), Penetrationstest durch Dritte |
| Art | unabhängige Prüfung; frühere Reviews (`.superpowers/sdd/2026-11-12-phase-6-seiten/*`) dienten nur als Hinweis, jede Aussage wurde neu geprüft |
| Änderungen am Code | keine. Dieses Protokoll beschreibt die Mängel und schlägt die Behebung vor; behoben wird danach in einem eigenen Schritt. |
| Behebung | 2026-11-18 in der Fix-Welle der Phase 7, Abschnitt 7 (Spalte „Behoben in Phase 7“ je Mangel mit Commit) |

Dieses Protokoll beschreibt, was geprüft wurde, wie und mit welchem Ergebnis. Es ist **keine Aussage, dass die Website sicher ist**, und keine Bestätigung einer Norm oder gesetzlichen Anforderung. Was hier nicht prüfbar war, steht als „nicht prüfbar“ mit dem nötigen Schritt für Phase 8 (Abschnitt 6).

## 1. Zusammenfassung

- **Kein kritischer und kein hoher Mangel gefunden.** **3 Mängel „Mittel“, 10 Mängel „Niedrig“** (Abschnitt 3). Alle sind offen.
- **Kopfzeilen (Spec §8, Review-Fokus 3):** Auf allen statischen Antworten (200, 301, 403, 404 deutsch und englisch) und auf allen Antworten von `lead.php` stehen die sechs Kopfzeilen der Spec mit den Werten aus `public/.htaccess`. **Ob sie doppelt erscheinen, hängt davon ab, wie PHP beim Hoster läuft:** Mit PHP-FPM (FastCGI) gab es keine Doppelten; mit PHP als Apache-Modul (wie im Integrationscontainer `php:8.4-apache`) stehen auf jeder Antwort von `lead.php` `Referrer-Policy` (zwei verschiedene Werte) und `X-Content-Type-Options` doppelt, auf der 422-Seite dazu CSP, COOP und `Permissions-Policy` (S-04). Von Apache selbst erzeugte Fehler (400, 414) und `TRACE` tragen keine Sicherheitskopfzeilen; das lässt sich in `.htaccess` nicht ändern (Restrisiko R-05).
- **CSP:** ohne `unsafe-*`, mit `default-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, `form-action 'self'`; `object-src` ist durch `default-src 'none'` abgedeckt. `img-src data:` wird im Build nirgends gebraucht (S-08).
- **Build:** keine Source-Maps, kein Inline-Skript, kein `style`-Attribut, kein `on…`-Handler, keine fremden Hosts als geladene Ressource, keine Geheimnisse, keine internen Vermerke der Claims (`note`, 73 Stück geprüft) in `dist/` und in `backend/templates/`, weder im Entwicklungs- noch im Release-Modus.
- **Geheimnisse:** gitleaks 8.16.0 über alle 57 Commits aller Zweige und über den Arbeitsbaum, dazu eine Regex-Suche: kein echtes Geheimnis. Einziger Treffer im Verlauf ist ein Platzhalter (`AENDERN-…`) in einer alten `config.example.php`. Integrationsaufbau und Container erzeugen alle Zugangsdaten zur Laufzeit.
- **Backend:** Einschleusung in Mail-Kopfzeilen, SQL und die 422-Seite (Marken, Attribute, `textarea`) erfolglos; Origin-, Methoden-, Content-Type- und Größenprüfung wirken; Rate-Limit mit IPv4, IPv6-/64 und -/48 wie in Ä-22 und Ä-35. Schwächen: Die zurückgehaltenen Anfragen (`held`) haben **keine Obergrenze für den Speicher** und werden nie gelöscht (S-01); mit PHP als Modul und `Transfer-Encoding: chunked` verarbeitet PHP einen auf 16 KB gekürzten Körper, während der Client 413 erhält (S-06).
- **Deploy:** Hostschlüssel festgelegt, `set -euo pipefail`, Pfade begrenzt, Prüfsummen vor jedem Umschalten, Symlink-Wechsel atomar, Release-Sperre wirkt im Workflow. Schwächen: Die Umgebung `preview` trägt denselben SSH-Schlüssel des Hauptbenutzers wie `production`, ohne Pflicht-Freigabe und ohne Zweigbeschränkung; damit ist die Freigabe von `production` umgehbar (S-02). Ein erneuter Upload des gerade aktiven Release löscht den Symlink auf `config.php` im Betrieb (S-03, nachgestellt).
- **Abhängigkeiten:** `composer audit` ohne Fund; einzige Laufzeitabhängigkeit ist PHPMailer 7.2.0 (LGPL-2.1-only). `npm audit --omit=dev`: 0; `npm audit` gesamt: 18 hoch, 0 kritisch, alle in Entwicklungswerkzeugen (S-11).

## 2. Umfang, Umgebung und Grenzen

### 2.1 Prüfaufbau

| Teil | Aufbau |
|---|---|
| Build | `npm run build:release` (scheitert wie erwartet mit 226 Mängeln der Release-Prüfung, die gebauten Dateien bleiben aber liegen) und `npm run build`, beide unter `flock /tmp/reticora-build.lock`; die Ausgaben wurden in das Scratch-Verzeichnis kopiert und dort untersucht. Danach war `git status` leer. |
| Deploy-Paket | `node scripts/deploy/package.mjs --allow-dev --out <tmp> --dist <Kopie von dist> --backend <Kopie von backend> --sha 0123456789abcdef0123` → 196 Dateien |
| Kopfzeilen wie beim Hoster | Das Paket wurde wie in `docs/deploy.md` aufgebaut (`~/releases/<sha>/`, `~/live` als Symlink, `~/reticora-config/config.php` als Symlink in `reticora/`), Dokumentenwurzel `live/www`, `AllowOverride All`. Zwei Apache-2.4.58-Instanzen: **(a)** `mpm_event` + PHP-FPM 8.3 über `mod_proxy_fcgi` (HTTP und HTTPS mit selbst signiertem Zertifikat für `www.reticora.de` und `reticora.de`), **(b)** `mpm_prefork` + `libphp8.3` (PHP als Modul, wie der Integrationscontainer). Backend mit SQLite und Datei-Transport, `rate_limit.max` 5, `global_max` 2. Dafür per `apt` installiert: `php8.3-fpm`, `php8.3-cgi`, `libapache2-mod-php8.3`, `gitleaks`. Der Aufbau lag außerhalb des Repositorys und wurde danach gelöscht. |
| Testserver des Repositorys | `tests/server/start.sh` (unter Lock) zum Vergleich |
| Integration | `scripts/integration-local.sh` (MariaDB 10.11 und SMTP-Fänger mit STARTTLS und Anmeldung, unter Lock): 20 Tests, 196 Zusicherungen, bestanden |
| Backend-Einheitstests | `cd backend && vendor/bin/phpunit` (unter Lock): 172 Tests, 1213 Zusicherungen, bestanden |

### 2.2 Grenzen

- **PHP 8.3.6 statt 8.4** (lokal verfügbar; das Ziel ist 8.4). Die geprüften Stellen (Kopfzeilen, `parse_str`, PDO, `htmlspecialchars`) verhalten sich in 8.3 und 8.4 gleich; der CI-Lauf `integration.yml` prüft mit 8.4.
- **Kein Docker-Daemon:** Der Container-Stack (`compose.yaml`) wurde nicht gestartet. Das Verhalten „PHP als Modul“ wurde mit `libapache2-mod-php8.3` nachgestellt.
- **Hoster nicht erreichbar:** Serverweite Einstellungen (`ServerTokens`, `TraceEnable`, `expose_php`, `display_errors`, PHP-SAPI, `AllowOverride`, TLS) sind dort zu prüfen (Abschnitt 6).
- **GitHub-Einstellungen** (Umgebungen, Prüfer, Branch-Schutz) sind aus dem Repository nicht sichtbar; geprüft wurden Workflow-Dateien und Runbook.
- Kein Lasttest, kein Fuzzing über Stunden, keine Prüfung durch Dritte.

### 2.3 Schweregrade

| Grad | Bedeutung hier |
|---|---|
| Kritisch | ohne besondere Voraussetzung ausnutzbar; Zugriff auf Host, Datenbank, Zugangsdaten oder Personendaten |
| Hoch | ausnutzbar mit geringen Voraussetzungen; erheblicher Schaden an Vertraulichkeit, Integrität oder Verfügbarkeit |
| Mittel | ausnutzbar nur mit Voraussetzungen (Schreibrecht im Repository, verteilte Quellen) oder Ausfall einer Funktion ohne Datenverlust |
| Niedrig | Abweichung von Spec oder gutem Brauch mit geringer Wirkung, Härtung, Testlücke |

## 3. Mängel (nach Schwere)

| Nr. | Schwere | Mangel | Fundstelle | Behebungsvorschlag |
|---|---|---|---|---|
| S-01 | Mittel | **Speicher und Vertriebspostfach ohne Obergrenze bei zurückgehaltenen Anfragen.** Über `global_max` werden gültige Anfragen als `held` gespeichert, bis `10 × global_max` je Stunde (Standard 600, mit `global_max = 1000` bis 10 000). `purge.php` löscht `held` nie; `retry.php` stellt höchstens 20 je Lauf zu (80 je Stunde bei Cron alle 15 Minuten). Ein Angreifer mit 120 IPv4-Adressen oder 40 IPv6-/48-Netzen je Stunde füllt die Datenbank mit bis zu 14 400 Zeilen am Tag (je Zeile bis rund 16 KB, obere Schranke rund 225 MB/Tag) und das Vertriebspostfach über Tage mit Nachzügler-Mails. Ist das Datenbank-Kontingent des Tarifs voll, scheitern `INSERT` und auch die Rate-Limit-Zähler: das Formular liefert dann für alle 500. | `backend/src/App.php:98–112` (Zweig `HELD`), `backend/src/RateLimiter.php` (`hitGlobal`), `backend/src/Purger.php:23` | Obergrenze für den Bestand: vor dem Speichern `SELECT COUNT(*) FROM lead WHERE delivery = 'held'` und ab einem festen Wert (z. B. `rate_limit.held_max`, Standard 2 × `global_max` × 24, begrenzt) 429 wie bei der harten Grenze, ohne Speichern; Log-Ereignis `held_ceiling`. Ergänzend in `docs/deploy.md` §6: Datenbankgröße und `held` überwachen (der Exit-Code von `purge.php` meldet bereits `held > 0`). Spec Ä-35 um die Obergrenze ergänzen. Test: Backend-Test mit `held_max = 3` → vierte Anfrage 429, keine neue Zeile. |
| S-02 | Mittel | **Freigabe von `production` ist über die Umgebung `preview` umgehbar.** `preview` erhält laut Runbook dieselben Secrets (`HETZNER_SSH_KEY` = Schlüssel des Hauptbenutzers, voller Zugriff auf `~/live`, `config.php`, Datenbankzugang) „ohne Prüfer (oder mit)“ und ohne Zweigbeschränkung. `workflow_dispatch` läuft auf jedem Zweig; der Job `preview` checkt den gewählten Zweig aus und führt dessen Skripte mit den Secrets aus. Wer Schreibrecht hat (oder ein gestohlenes Token mit Schreibrecht), kann also von einem eigenen Zweig mit geändertem Workflow beliebige Befehle auf dem Host ausführen, ohne die zweite Freigabe. | `docs/deploy.md:76` (Umgebung `preview`), `.github/workflows/deploy.yml:79–128` (Job `preview`) | Im Runbook für **beide** Umgebungen verlangen: „Deployment branches: nur Hauptzweig“ und „Required reviewers“ (für `preview` mindestens eine Person). Dazu Branch-Schutz des Hauptzweigs mit Pflicht-Review (Runbook Schritt 14 schon vorhanden). Langfristig: eigener, eingeschränkter Schlüssel für die Vorschau, falls der Hoster das erlaubt (Abschnitt 6, P-09). |
| S-03 | Mittel | **Ein erneuter Upload des aktiven Release legt das Formular im Betrieb still.** Der Job `preview` lädt mit `rsync -a --delete` nach `releases/<sha>/`. Ist dieser Stand schon `current` (Strategie `symlink`: `~/live` zeigt genau dorthin), löscht `--delete` den Symlink `reticora/config.php`, weil er nicht im Paket ist. `lead.php` antwortet dann mit 500, bis `activate` ihn neu anlegt; bei Ziel `preview` passiert das nie, bei Ziel `production` erst nach der Freigabe. Nachgestellt: nach dem `rsync` fehlte `live/reticora/config.php`, `POST /api/lead.php` → `500 Server error`. Zusätzlich werden Dateien des laufenden Betriebs während des Uploads einzeln ersetzt. | `.github/workflows/deploy.yml:111` | Vor dem Upload `remote.sh status` lesen und, wenn `<sha>` gleich `current` ist, den Upload überspringen (nur `verify`); oder in einen frischen Ordner `releases/<sha>.tmp.<run_id>` laden und erst nach `verify` umbenennen, wenn `releases/<sha>` noch nicht existiert. Mindestens `--exclude=/reticora/config.php` an den `rsync` anhängen. Test: in `tests/unit/deploy-package.test.ts` oder einem Shell-Test den zweiten Upload desselben Stands nachstellen. |
| S-04 | Niedrig | **Doppelte und widersprüchliche Kopfzeilen auf Antworten von `lead.php`, wenn PHP als Apache-Modul läuft.** PHP setzt `Referrer-Policy: no-referrer` und `X-Content-Type-Options` (auf der 422-Seite zusätzlich CSP, COOP, `Permissions-Policy`; auf 429/500 als HTML eine zweite, strengere CSP); `.htaccess` setzt dieselben Namen mit `Header always set`. Mit `mod_php` landen beide Sätze in der Antwort. Bei zwei `Referrer-Policy`-Zeilen gilt im Browser der letzte gültige Wert. Mit PHP-FPM ersetzt `always set` die PHP-Werte (keine Doppelten). Spec und Review-Fokus 3 verlangen „nicht doppelt“. | `backend/src/Response.php:24–36` (`make`), `:49–69` (`html`, `page`); `public/.htaccess:17–22` | In `backend/public/.htaccess` (wird zu `www/api/.htaccess`) ergänzen: `Header unset Content-Security-Policy`, `Header unset Referrer-Policy`, `Header unset X-Content-Type-Options`, `Header unset Cross-Origin-Opener-Policy`, `Header unset Permissions-Policy`. Damit bleiben nur die `always`-Werte der Wurzel. Im Prüfaufbau verifiziert: danach keine Doppelten mehr, weder mit FPM noch mit `mod_php`. `Response::make` behält die eigenen Werte für den Betrieb ohne `.htaccess`, `Referrer-Policy` dort auf `SITE_REFERRER` angleichen. In `tests/e2e-integration/headers.spec.ts:37` Doppelte nicht nur vermerken, sondern scheitern lassen. |
| S-05 | Niedrig | **`X-Powered-By: PHP/<Version>`, wenn der Hoster `expose_php = On` hat.** Das Backend entfernt die Kopfzeile nicht; `.htaccess` auch nicht. Nachgestellt mit `php_admin_flag[expose_php] = on`: `X-Powered-By: PHP/8.3.6` auf `GET /api/lead.php`. | `backend/src/Responder.php:12–16`, `backend/public/lead.php:27–31`, `public/.htaccess` | `header_remove('X-Powered-By')` am Anfang von `Responder::emit` und vor dem frühen 500 in `lead.php`; zusätzlich `Header unset X-Powered-By` und `Header always unset X-Powered-By` in `backend/public/.htaccess` (im Prüfaufbau verifiziert). |
| S-06 | Niedrig | **Körper über 16 KB mit `Transfer-Encoding: chunked`:** Mit PHP als Modul kürzt Apache den Körper bei `LimitRequestBody 16384`, PHP sieht genau 16 384 Byte, prüft sie als gültiges Formular, **speichert den Lead und versendet die Mail**, der Client erhält Apaches 413. Mit FPM erhält PHP einen leeren Körper (422). Die Spec (§6.1) verlangt, Anfragen über 16 KB abzulehnen. Kein Sicherheitsgewinn für Angreifer (16 KB gehen ohnehin), aber Verhalten und Antwort widersprechen sich. | `backend/src/App.php:56–59`, `backend/src/Request.php:68–72` | In `App::dispatch` vor der Größenprüfung: fehlt `Content-Length` oder ist `Transfer-Encoding` gesetzt, mit 411 (oder 413) ablehnen. Browser senden für Formulare immer `Content-Length`. `Request::fromGlobals` übernimmt dafür `HTTP_TRANSFER_ENCODING` ohnehin schon als Kopfzeile. Test in `AppTest` (Kopfzeile ohne Länge → 411). |
| S-07 | Niedrig | **Kopfzeilentests für `/api/` prüfen nicht den Aufbau des Betriebs.** Im Testserver (`tests/server/httpd.conf.tmpl`) geht `/api/lead.php` per `ProxyPass` an den PHP-Entwicklungsserver; dort greift keine `.htaccess`. Beleg: `GET /api/lead.php` am Testserver → 405 ohne HSTS, CSP, COOP, `Permissions-Policy`, mit `X-Powered-By: PHP/8.3.6`. Nur der Container (`integration.yml`) hat `lead.php` im Webroot, und dort werden Doppelte nur als Anmerkung vermerkt. S-04 und S-05 blieben deshalb unentdeckt. | `tests/server/httpd.conf.tmpl:54–59`, `tests/e2e-integration/headers.spec.ts:37` | Nach S-04: Doppelte in `headers.spec.ts` als Fehler werten; Fall „422 HTML“, „429 HTML“ und „500“ ergänzen. Optional den lokalen Testserver auf PHP-FPM über `mod_proxy_fcgi` mit `lead.php` im Webroot umstellen (wie im Prüfaufbau hier), damit der lokale Lauf dieselben Kopfzeilen sieht. |
| S-08 | Niedrig | **`img-src 'self' data:` ohne Bedarf.** Weder HTML noch CSS noch JavaScript im Build enthalten eine `data:`-Adresse. `data:` erlaubt eingeschleusten Bildern ohne Netzverkehr zu laden (geringe Wirkung, aber unnötig). | `public/.htaccess:18`, `backend/src/Response.php:10`, Spec §8 | `data:` aus beiden Stellen streichen; Spec §8 per neuem Ä-Eintrag anpassen; der vorhandene Gleichheitstest (`ContactPageTest`) hält beide Stellen gleich. |
| S-09 | Niedrig | **Passwort der Vorschau als APR1-MD5.** `openssl passwd -apr1` erzeugt einen schnellen MD5-Hash (1000 Runden); gelangt `.htpasswd` nach außen, ist ein schwaches Passwort leicht zu brechen. | `.github/workflows/deploy.yml:122` | bcrypt verwenden: `htpasswd -nbB` (Paket `apache2-utils` auf dem Runner, ggf. `sudo apt-get install -y apache2-utils`) oder `python3 -c 'import bcrypt…'`; Apache 2.4 versteht `$2y$`. `remote.sh` prüft nur das Format `Benutzer:Hash` und bleibt unverändert. |
| S-10 | Niedrig | **Actions nur per Tag festgelegt; Token bleibt im Checkout.** Alle `uses:` stehen auf Tags (`actions/*@v4`, `shivammathur/setup-php@v2`). Die Drittanbieter-Action `setup-php` läuft im Build-Job des Deploy, der das ausgelieferte Paket baut (PHP und Composer für `vendor/`). `actions/checkout` legt `GITHUB_TOKEN` (nur `contents: read`) in `.git/config` ab, wo die Install-Skripte aus `npm ci` es lesen können. | `.github/workflows/*.yml` (alle `uses:`), z. B. `deploy.yml:45–53` | Actions auf Commit-SHA festlegen (Kommentar mit Tag dahinter), mindestens in `deploy.yml`; `.github/dependabot.yml` für `github-actions`, `npm` und `composer` anlegen; `with: persist-credentials: false` bei jedem `actions/checkout`. |
| S-11 | Niedrig | **`npm audit`: 18 hohe Funde, Kommentar in der CI veraltet.** Alle in Entwicklungswerkzeugen: `picomatch` (ReDoS, GHSA-fc5q-39xc-vjpf, in `astro`, `vite`, `vitest`, ohne behobene Version) und `basic-ftp` (drei Advisories, über `@lhci/cli` → `proxy-agent`, Behebung über `npm audit fix` verfügbar). Nichts davon gelangt in den Build (`npm audit --omit=dev`: 0). Der Kommentar in `ci.yml` nennt „9 high, alle aus @lhci/cli“. Die Muster für `picomatch` stammen aus dem eigenen Code, nicht von außen; ausnutzbar ist das hier nicht. | `.github/workflows/ci.yml:52–53`, `package-lock.json` | `npm audit fix` (ohne `--force`) für `basic-ftp`; Kommentar auf den aktuellen Stand bringen; Dependabot (S-10) meldet neue Versionen von `picomatch`. |
| S-12 | Niedrig | **Composer im Paket ohne `--prefer-dist`.** In dieser Umgebung installierte Composer PHPMailer aus dem Git-Quellstand; im Paket bleiben leere Ordner `.git/`, `.github/`, `.phan/` und Entwicklerdateien (`phpcs.xml.dist`, `phpdoc.dist.xml`, `.codecov.yml`, `get_oauth_token.php`) unter `reticora/vendor/phpmailer/phpmailer/`. Nicht über das Web erreichbar (außerhalb des Webroots, dazu `Require all denied`), aber unnötiger Inhalt und ein nicht reproduzierbarer Paketinhalt. | `scripts/deploy/package.mjs:162` | `--prefer-dist` und `--no-plugins` an `composer install` anhängen; nach dem Aufräumen leere Ordner und Punktordner in `vendor/` entfernen; `verifyLayout` um „kein `.git` im Paket“ ergänzen. |
| S-13 | Niedrig | **`remote.sh` prüft nicht, dass ein Release aus `build:release` stammt.** `verify_release` prüft Vollständigkeit und Prüfsummen, aber nicht die Zeile `build: release` in `MANIFEST.txt`. Ein mit `--allow-dev` gebautes Paket, das jemand mit SSH-Zugang hochlädt, ließe sich aktivieren. Der Workflow selbst ist gesperrt (`build:release` muss bestehen, `package.mjs` verlangt `dist/.release`). | `scripts/deploy/remote.sh:47–55` | In `verify_release`: `grep -qx 'build: release' "$dir/MANIFEST.txt" \|\| die "Release $1 ist kein Release-Build"`; für `preview` darf das gelten bleiben, für `activate` und `rollback` ist es Pflicht. |

Zählung: Kritisch 0, Hoch 0, Mittel 3, Niedrig 10.

## 4. Prüfliste

Ergebnis: **bestanden**, **Mangel** (mit Nummer aus Abschnitt 3), **nicht prüfbar** (mit Grund und Schritt für Phase 8), **Hinweis** (kein Mangel, aber festgehalten).

### 4.1 Kopfzeilen je Antwortart (Spec §8, Ä-12, Ä-20)

Vorgehen: Skript `hdr.sh` (curl mit `-D -`, zählt doppelte Namen, meldet fehlende der sechs Pflichtkopfzeilen) gegen den Prüfaufbau aus 2.1; für die Weiterleitungen mit `Host: reticora.de` bzw. `Host: www.reticora.de` über HTTP und HTTPS. „6/6“ heißt: HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, COOP und `Permissions-Policy` mit den Werten aus `public/.htaccess`, je einmal.

| # | Antwortart | Anfrage | Ergebnis | Beleg (Auszug) |
|---|---|---|---|---|
| K-01 | 200 HTML | `GET https://www.reticora.de/` | bestanden | `200 OK`, 6/6, `Cache-Control: no-cache` |
| K-02 | 200 Asset mit Hash | `GET /_astro/rich.DZoMax10.css` | bestanden | 6/6, `Cache-Control: public, max-age=31536000, immutable` |
| K-03 | 200 ohne Hash | `GET /favicon.svg`, `/robots.txt` | bestanden; Hinweis | 6/6, **kein** `Cache-Control` (Browser rechnen eine Frische aus `Last-Modified`). Die Spec regelt nur Hash-Dateien und HTML; für `favicon.svg`, `robots.txt`, `sitemap.xml` wäre `Cache-Control: no-cache` eindeutiger. |
| K-04 | 301 http → https | `GET http://…/preise/`, `Host: www.reticora.de` | bestanden | `Location: https://www.reticora.de/preise/`, 6/6 |
| K-05 | 301 Apex → www (http und https) | `Host: reticora.de` | bestanden | jeweils ein Schritt auf `https://www.reticora.de/preise/`, 6/6 |
| K-06 | 301 `index.html` | `/preise/index.html`, `/en/pricing/index.html` | bestanden; Hinweis | 6/6. `https://reticora.de/en/pricing/index.html` braucht zwei Schritte (erst Host, dann `index.html`); kein Sicherheitsthema. |
| K-07 | 301 ohne Schrägstrich | `/preise` | bestanden; Hinweis | 6/6. Die Weiterleitung von `mod_dir` übernimmt den `Host` der Anfrage (`Host: evil.example` → `Location: https://evil.example/preise/`). Ohne Zwischenspeicher vor Apache wirkt das nur auf den Anfragenden selbst (R-06). |
| K-08 | 404 deutsch / englisch | `/gibt-es-nicht/`, `/en/gibt-es-nicht/` | bestanden | `404`, 6/6, `lang="de"` bzw. `lang="en"`, `Cache-Control: no-cache` |
| K-09 | 404 unter `/_astro/` | `/_astro/nope.js` | bestanden | `Cache-Control: no-cache`, nicht `immutable` (Bedingung `REQUEST_STATUS -lt 400` wirkt) |
| K-10 | 403 Punktdateien | `/.htaccess`, `/en/.htaccess`, `/api/.htaccess`, `/.release`, `/.git/config` | bestanden | `403`, 6/6, Inhalt der 404-Seite |
| K-11 | 403 `/backend/`, `/api/` (Verzeichnis), `/api/x.php` | | bestanden | alle `403`, 6/6 |
| K-12 | Paketaufbau: `reticora/` | Alias auf den Release-Ordner (als ob die Dokumentenwurzel falsch auf `live` statt `live/www` stünde) | bestanden; Hinweis | `reticora/`, `config.php`, `config.example.php`, `vendor/…`, `templates/…`, `bin/…`, `src/…` → alle `403`. **`MANIFEST.txt` und `remote.sh` wären dann `200`** (R-07, P-08). Bei richtiger Wurzel `live/www`: `/reticora/config.php`, `/MANIFEST.txt`, `/remote.sh` → `404`. |
| K-13 | 405 `lead.php` | `GET`, `HEAD`, `PUT`, `OPTIONS` mit fremder Origin | bestanden (FPM) / Mangel S-04 (Modul) | `405`, `Allow: POST`, keine CORS-Kopfzeilen. FPM: 6/6, je einmal. Modul: `Referrer-Policy: strict-origin-when-cross-origin` **und** `Referrer-Policy: no-referrer`, `X-Content-Type-Options` zweimal |
| K-14 | 403 fremde Origin | `Origin: https://evil.example` | bestanden / S-04 | wie K-13 |
| K-15 | 413 aus PHP / aus Apache | Körper 20 000 Byte mit `Content-Length` | bestanden / S-04 | FPM: PHP antwortet selbst `413 Payload Too Large`, 6/6. Modul: Apaches 413-Seite, 6/6 (die `always`-Werte gelten auch für Apaches eigene 413). |
| K-16 | 413 mit `chunked` | dieselben 20 000 Byte, `Transfer-Encoding: chunked` | Mangel S-06 | Modul: `413` von Apache, gleichzeitig `lead_stored id=7 delivery=delivered` im Log. FPM: `422` (leerer Körper). |
| K-17 | 415 | `Content-Type: application/json`, `multipart/form-data`, `text/plain` | bestanden / S-04 | `415`, 6/6 (FPM) |
| K-18 | 422 JSON | `Accept: application/json` | bestanden / S-04 | `{"ok":false,"errors":{…}}`, `Cache-Control: no-store` |
| K-19 | 422 HTML (Kontaktseite aus PHP) | ohne `Accept: application/json` | bestanden (FPM) / Mangel S-04 (Modul) | CSP **gleich** der CSP der statischen Seiten; `Cache-Control: no-store`. Modul: CSP, COOP, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options` je zweimal (gleiche Werte). |
| K-20 | 429 HTML / JSON | sechste gültige Anfrage derselben Herkunft | bestanden / S-04 | `429`, `Retry-After: 3016`, neutraler Text, keine Eingaben. Modul: zwei CSPs (Seite + `default-src 'none'; base-uri 'none'; frame-ancestors 'none'`), beide gelten, die strengere gewinnt. |
| K-21 | 500 HTML / JSON / Konfiguration kaputt | DSN auf nicht vorhandenen Pfad; `config.php` liefert kein Array | bestanden | HTML-Hinweisseite mit Kontaktadresse bzw. `{"ok":false}` bzw. `Server error`; 6/6; Log: `lead error PDOException at Database.php:13`, keine Meldung, kein Pfad zur Datenbank |
| K-22 | 200 / 303 aus `lead.php` | gültiges Formular | bestanden / S-04 | `200 {"ok":true}` bzw. `303 Location: /kontakt/danke/` (fester Wert), `Cache-Control: no-store` |
| K-23 | 400 von Apache | kaputte Kopfzeile, `GET /%` | Hinweis, Restrisiko R-05 | `400 Bad Request` **ohne** Sicherheitskopfzeilen; statischer Text ohne Teile der Anfrage. `.htaccess` wird für solche Anfragen nicht gelesen. |
| K-24 | 414 von Apache | URI mit 9000 Zeichen | Hinweis, R-05 | wie K-23 |
| K-25 | `TRACE` | `TRACE /` | nicht prüfbar (Hoster) | Prüfaufbau: `200` ohne Sicherheitskopfzeilen (Standard `TraceEnable On`). Serverweite Einstellung, P-03. |
| K-26 | `X-Powered-By` | `expose_php = On` | Mangel S-05 | `X-Powered-By: PHP/8.3.6` |
| K-27 | `Server` | alle | nicht prüfbar (Hoster) | Prüfaufbau: `Apache/2.4.58 (Ubuntu) OpenSSL/3.0.13` (Standard `ServerTokens Full`); Container: `Apache`. Serverweite Einstellung, P-03. |
| K-28 | HSTS-Verhalten | alle | bestanden; Hinweis | `max-age=31536000` ohne `includeSubDomains` und ohne `preload` wie Spec §8. Wird auch über HTTP gesendet; Browser ignorieren es dort (unschädlich). Auf `https://reticora.de` (Apex) steht HSTS auf der 301 und schützt den Apex; dafür muss das Zertifikat den Apex abdecken (P-07). |
| K-29 | Zwischenspeicher | HTML / Hash-Dateien / `/api/` | bestanden | HTML `no-cache`, Hash-Dateien ein Jahr `immutable`, `/api/` `no-store`, 404 unter `/_astro/` `no-cache` |
| K-30 | Testserver des Repositorys | `tests/server/start.sh` | Mangel S-07 | `GET /api/lead.php` → `405` mit `X-Powered-By: PHP/8.3.6`, **ohne** HSTS, CSP, COOP, `Permissions-Policy` (ProxyPass ohne `.htaccess`) |

Gegenprobe zur Behebung von S-04 und S-05 (nur im Prüfaufbau, nicht im Repository): Mit den fünf `Header unset …` und `Header (always) unset X-Powered-By` in `www/api/.htaccess` hatten 405 und 422 unter FPM und Modul jede Kopfzeile genau einmal, `X-Powered-By` fehlte.

### 4.2 CSP-Bewertung (Spec §8, Ä-05, Ä-20)

| # | Prüfpunkt | Ergebnis | Beleg |
|---|---|---|---|
| C-01 | keine `unsafe-inline`, `unsafe-eval`, `unsafe-hashes`, kein `*`, kein `https:` | bestanden | `public/.htaccess:18`, `Response::SITE_CSP` |
| C-02 | `default-src 'none'`, `object-src` abgedeckt, `base-uri 'none'`, `frame-ancestors 'none'`, `form-action 'self'` | bestanden | wie oben |
| C-03 | Build ohne Inline-Skript, ohne `style`-Attribut, ohne `<style>`, ohne `on…`-Handler | bestanden | `grep -rhoE '<script[^>]*>'`: nur `type="module" src="/_astro/…"` (5 Dateien); `grep ' style=\|<style'` und `' on[a-z]+="'`: 0 Treffer (Entwicklungs- und Release-Build) |
| C-04 | `img-src data:` begründet | Mangel S-08 | `grep -rhoE "url\(['\"]?data:\|src=\"data:"` über `dist/`: 0 Treffer |
| C-05 | Trusted Types | Hinweis | Die Inseln nutzen keine HTML-Senken (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`: 0 Treffer in `dist/_astro/*.js`). `require-trusted-types-for 'script'; trusted-types 'none'` ließe sich ohne Codeänderung ergänzen und würde künftige Senken sperren; Gewinn heute gering, da kein Inline-Skript erlaubt ist. Vor Aufnahme in allen drei Browsern testen. |
| C-06 | Subresource Integrity | Hinweis | nicht nötig: alle Skripte und Stile kommen vom eigenen Ursprung (`'self'`), es gibt keine fremden Hosts. |
| C-07 | 422-Seite mit derselben CSP | bestanden | K-19; Test `ContactPageTest` vergleicht `Response::SITE_CSP` mit `public/.htaccess` |

### 4.3 Build und Deploy-Paket (Spec §8 letzter Absatz, Ä-05, Ä-20, Task 5)

| # | Prüfpunkt | Ergebnis | Beleg |
|---|---|---|---|
| B-01 | keine Source-Maps | bestanden | `find -name '*.map'`: 0; `grep -rl sourceMappingURL`: 0 (beide Modi) |
| B-02 | keine fremden Hosts als Ressource | bestanden | alle `src`/`href` in `<script>`, `<link>`, `<img>`, `<form>` beginnen mit `/` oder sind `https://www.reticora.de/…` (`canonical`, `alternate`). Weitere Hosts nur als Link oder Text: `www.reticora.cloud`, `www.demo.reticora.cloud`, `github.com`, `scripts.sil.org` (Lizenztext), `tailwindcss.com` (Lizenzkommentar im CSS), `www.w3.org`, `www.sitemaps.org` (Namensräume) |
| B-03 | keine Geheimnisse | bestanden | Regex über `dist/` und `backend/templates/` (`PRIVATE KEY`, `AKIA…`, `ghp_`, `xox…`, `password|secret|token|api_key`): nur Fließtext („Sitzungstoken“, `X-API-Key: rk_live_…` als gekürztes Beispiel) und die **absichtlich öffentlichen** Demo-Zugangsdaten auf `/demo/` (Ä-02, Ä-26: `noindex`, nicht in der Sitemap) |
| B-04 | keine internen Vermerke | bestanden | Skript über alle 73 `note`-Felder aus `src/data/claims.ts` gegen jede HTML/JS/CSS/JSON/TXT/XML-Datei: 0 Treffer; dazu `README.md`, `(F-nn)`, `collector/profiles`, `Fundstelle`, `TODO`, `FIXME`, `/home/`, `/tmp/`, `superpowers`, `src/…`: 0 Treffer in ausgelieferten Dateien. Einzige HTML-Kommentarzeile („path: erprobt aria-current …“) steht in `dist/dev/…` nur im Entwicklungs-Build; die Release-Prüfung sperrt `dev/` (`checkDevPages`). `dist/en/.htaccess` nennt einen Quellpfad im Kommentar; die Datei wird nicht ausgeliefert (K-10). E-Mail-Adressen im Build: nur `demo@reticora.cloud` und `name@example.com`. |
| B-05 | Paket: keine Tests, Konfigurationen, `.git`, `.env`, Entwicklungsabhängigkeiten | bestanden; Mangel S-12 | `find` im Paket: kein `config.php`, kein `.env`, kein `phpunit`, kein `tests/`, kein `vendor/phpunit`, `vendor/` nur `composer`, `phpmailer`, `autoload.php`; PHP im Webroot nur `www/api/lead.php`. Leere `.git/`, `.github/`, `.phan/` und Entwicklerdateien in `vendor/phpmailer/phpmailer/` (S-12). |
| B-06 | `.htaccess` mit `Require all denied` in jedem Ordner außerhalb des Webroots | bestanden | `reticora/.htaccess` und je eine in `bin/`, `sql/`, `src/`, `templates/`, `vendor/` (von `verifyLayout` geprüft); tiefere Ordner erben die Sperre (K-12) |
| B-07 | Release-Marke nicht im Webroot | bestanden | `package.mjs` entfernt `www/.release`; `verifyLayout` verbietet sie |

### 4.4 Geheimnisse in Repository, Verlauf und CI

| # | Prüfpunkt | Ergebnis | Beleg |
|---|---|---|---|
| G-01 | Verlauf aller Zweige | bestanden | `gitleaks detect --source . --log-opts=--all --redact` → `57 commits scanned … leaks found: 1`: `generic-api-key backend/config.example.php:13` in `d90f248` = Platzhalter `AENDERN-mindestens-32-zufaellige-zeichen-AENDERN` (Zeitfalle, später entfernt) |
| G-02 | Arbeitsbaum | bestanden | `gitleaks detect --no-git`: 705 Treffer, **alle in nicht versionierten, nicht ausgelieferten Ordnern** (704 in `.lighthouseci/`-Berichten, Fehlalarme „aws-access-token“ auf Base64-Daten; 1 in `.superpowers/`); 0 in versionierten Dateien |
| G-03 | ergänzende Regex über `git log --all -p` | bestanden | keine privaten Schlüssel, keine GitHub-, AWS-, Slack- oder API-Token. E-Mail-Adressen: `@example.com/.org`, `noreply@anthropic.com`, `demo@reticora.cloud`, Autoren aus `composer.lock` (öffentliche Paketdaten), `a@b.de` in zwei Unit-Tests (Hinweis: besser `@example.com`, es wird nichts versandt). Ein Commit trägt die persönliche Autorenangabe des Repository-Inhabers (Anlage über GitHub) – üblich, kein Geheimnis. |
| G-04 | Dateinamen im Verlauf | bestanden | kein `.env`, `config.php`, `*.pem`, `*.key`, `.htpasswd` je versioniert. Interne Arbeitsberichte (`.superpowers/…`, 3 Dateien) standen kurz im Verlauf (`8959397` entfernt); gitleaks ohne Treffer darin. |
| G-05 | Test-Fixtures | bestanden | `backend/tests/fixtures/templates/*` ohne Zugangsdaten; Integrationstests lesen Passwörter aus `*_FILE`-Pfaden |
| G-06 | Container und lokale Integration erzeugen Zugangsdaten zur Laufzeit | bestanden; Hinweis | `docker/web/gen-secrets.sh` (`openssl rand -hex 24`, Test-CA 7 Tage), `scripts/integration-local.sh:82–85`. `mail.key` hat Modus 644 im Volume (nur Test, Wegwerf-CA). |
| G-07 | Workflows: Ausgabe von Secrets, `set -x`, Artefakte | bestanden | kein `set -x`, kein `echo` eines Secrets; Secrets nur über `env:`; Artefakte: Release-Paket (kein `config.php`, keine Secrets, 14 Tage), Diagnose (Zugriffsprotokoll 127.0.0.1, Testergebnisse, `compose logs`; 7 Tage) |
| G-08 | `pull_request_target`, unsichere Ausdrücke in `run:` | bestanden | kein `pull_request_target`; `${{ … }}` nur in `env:`, `if:` und `with:`, nie direkt in `run:` |

### 4.5 Backend-Angriffsfläche (Spec §6, Ä-07–Ä-11, Ä-18–Ä-24, Ä-35)

Vorgehen: Anfragen gegen den Prüfaufbau (FPM, JSON-Antworten), Lesen des Codes, Unit- und Integrationstests.

| # | Prüfpunkt | Ergebnis | Beleg |
|---|---|---|---|
| A-01 | Zeilenumbruch und Steuerzeichen in einzeiligen Feldern | bestanden | `name=Erika%0d%0aBcc:…` → `422 name.invalid`; `company=A%0aB` → `company.invalid`; NUL, U+202E, ungültiges UTF-8 → `invalid`; U+200D erlaubt (Ä-24) → 200 |
| A-02 | E-Mail-Adresse | bestanden; Hinweis | CRLF, Komma, Anführungszeichen, 255 Zeichen → 422. Internationalisierte Domains (`a@bücher.de`) werden abgelehnt (strenge ASCII-Regel); kein Sicherheitsthema, Bedienung. |
| A-03 | Mail-Kopfzeilen | bestanden | Kopfzeilen nur aus Konfiguration und festen Texten; `Reply-To` = geprüfte Adresse; `MailMessage` lehnt CR, LF, NUL und `<>,;"`/Leerraum in Adressen ab; Körper Base64 (`PhpMailerTransportTest::testMimeIsPlainTextUtf8Base64WithCrlfAndFixedHeaders`); keine Mail an die eingegebene Adresse (Ä-09) |
| A-04 | XSS in der 422-Seite | bestanden | `name=' data-rt-error="name" hidden></p>'` → `value=" data-rt-error=&quot;name&quot; hidden&gt;&lt;/p&gt;"`; `company=' onfocus='alert(1)` → `&#039;…`; `message=</textarea><script>alert(1)</script><!--` → maskiert im `textarea`; `topic` mit Markup → keine Option gewählt; 0 × `<script>` aus Eingaben. `strtr` ersetzt nur Marken der Vorlage, jede Marke enthält `"`, das in maskiertem Text nie vorkommt. `lang` nur aus fester Liste. |
| A-05 | SQL-Einschleusung | bestanden | nur vorbereitete Anweisungen, `ATTR_EMULATE_PREPARES => false`; einziges zusammengesetztes SQL ist `LIMIT max(1, int)` in `LeadRepository::undelivered` |
| A-06 | Methoden | bestanden | `GET`, `HEAD`, `PUT`, `OPTIONS` → 405 mit `Allow: POST`; kein GET-Pfad (Ä-19) |
| A-07 | Größe | bestanden; Mangel S-06 | `Content-Length` > 16384 → 413 (PHP oder Apache); `chunked` siehe K-16 |
| A-08 | Content-Type | bestanden | nur `application/x-www-form-urlencoded` (mit `charset` erlaubt); `multipart`, `text/plain`, `application/json` → 415 |
| A-09 | Origin/CSRF | bestanden | exakt `https://www.reticora.de` (Groß-/Kleinschreibung, abschließender `/` toleriert) → 200; `null`, `http://…`, `…:443`, fremd → 403; ohne `Origin` nur mit `Sec-Fetch-Site: same-origin`, `same-site` → 403. Schutz gilt für Browser; Skripte können Kopfzeilen fälschen, dagegen wirkt das Rate-Limit. |
| A-10 | Arrays, doppelte und viele Felder | bestanden; Hinweis | `name[]=x` → `name.required`; 1000 Zusatzfelder → normale Verarbeitung, PHP schreibt „Input variables exceeded 1000“ mit Dateipfad ins Fehlerprotokoll des Servers (keine Formularinhalte) |
| A-11 | Köderfeld | bestanden | gültig + Köder → 200 ohne Speichern; ungültig + Köder → 422 (Ä-19); Köder zählt je Herkunft, nicht global |
| A-12 | Rate-Limit je Herkunft, IPv4, IPv4-gemappt, IPv6-/64, -/48 | bestanden | sechste gültige Anfrage → 429 mit `Retry-After`; `RateLimiter::origin`: `::ffff:203.0.113.7` und `::ffff:cb00:7107` → `203.0.113.7`, `2001:DB8:1:2::9` → `2001:db8:1:2::/64`, `prefix48` → `2001:db8:1::/48`; Integrationstests `RateLimitTest` (MariaDB) bestanden; in `rate_limit` nur HMAC-Werte, keine Adresse |
| A-13 | `held`-Entwurf, Speicherwachstum | Mangel S-01 | nachgestellt mit `global_max = 2`: Anfragen 3–5 → `held`, Antwort 200; `purge.php` löscht `held` nie (`Purger.php:23`) |
| A-14 | ungültige Anfragen ohne Zählung | Hinweis, R-02 | jede ungültige Anfrage kostet `DELETE` abgelaufener Zähler und zwei Lesezugriffe, ohne Grenze |
| A-15 | Schlüsselwechsel | bestanden | 32 Zufallsbytes in `rate_limit_key`, Wechsel am ersten Gebrauch eines neuen UTC-Tages, nur bei unverändertem Vortag (`KeyRotationTest`, MariaDB) |
| A-16 | Fehlerbehandlung ohne Interna | bestanden | Antworten ohne Meldungen und Pfade (K-21); Log: Klasse und `Datei:Zeile`, keine Meldung; `display_errors` per `ini_set` aus (Startfehler und Syntaxfehler hängen von der Serverkonfiguration ab, P-05) |
| A-17 | Protokolle ohne Personendaten | bestanden | `lead.log` im Prüfaufbau: nur `lead_stored id=…`, `lead_held id=…`, `rate_limited`, `error PDOException at Database.php:13`; keine IP, keine Formularwerte |
| A-18 | Dateirechte | bestanden; nicht prüfbar (Hoster) | Runbook: `~/reticora-config` 700, `config.php` 600, Log dort; `.htpasswd` 644 außerhalb von `www/`. Ob PHP unter derselben Kennung läuft wie der SSH-Benutzer (sonst wäre `config.php` mit 600 nicht lesbar), P-04. |
| A-19 | PHPMailer: TLS, keine Ausweichroute | bestanden | `isSMTP()`, `SMTPOptions` leer (PHP-Standard `verify_peer`/`verify_peer_name` an), `starttls` scheitert ohne STARTTLS; ohne Anmeldung oder mit `none` nur bei `allow_insecure`; kein Rückfall auf `mail()`. Integrationstest `DeliveryFailureTest::testCertificateIsVerified` (Name nicht im Zertifikat → `not_delivered`) lokal bestanden. |
| A-20 | CLI-Skripte nicht über das Web | bestanden | `bin/*.php` beginnen mit `if (PHP_SAPI !== 'cli') exit(1);`, liegen außerhalb des Webroots hinter `Require all denied` (K-12) |
| A-21 | Löschen abgelaufener Zähler bei jedem Aufruf | bestanden | `App::dispatch` ruft `purgeExpired` nach der Content-Type-Prüfung, vor dem Rate-Limit; dazu `purge.php` stündlich |
| A-22 | Weiterleitungsziele | bestanden | nur aus `App::TARGETS` |

### 4.6 Deploy

| # | Prüfpunkt | Ergebnis | Beleg |
|---|---|---|---|
| D-01 | `remote.sh`: `set -euo pipefail`, Anführungszeichen, Pfadgrenzen | bestanden | `guard_path` lehnt leere Pfade, `/`, `$HOME`, `..` und Pfade außerhalb von `$HOME` ab; `check_sha` nur `[0-9a-f]{7,40}`; `rm -rf -- "${RELEASES:?}/$name"` nur für SHA-Namen |
| D-02 | Symlink-Wechsel | bestanden | `ln -sfn` auf temporären Namen, dann `mv -T` (atomar); Strategie `rsync` mit `--delay-updates --delete-after`, `config.php` ausgenommen |
| D-03 | abgebrochener Upload | bestanden | `verify_release` prüft jede Datei aus `MANIFEST.txt` mit `sha256sum --check`; fehlende oder geänderte Dateien → Abbruch vor `preview`/`activate`. Zusätzliche Dateien entfernt `rsync --delete`. |
| D-04 | erneuter Upload desselben Stands | Mangel S-03 | nachgestellt: `rsync -a --delete <paket>/ releases/<sha>/` → `live/reticora/config.php` fehlt → `POST /api/lead.php` `500` |
| D-05 | Hostschlüssel festgelegt | bestanden | `StrictHostKeyChecking yes`, `UserKnownHostsFile` nur aus `HETZNER_KNOWN_HOSTS`, `BatchMode yes`; Runbook verlangt Abgleich über zweiten Weg |
| D-06 | geringste Rechte des Deploy-Schlüssels | Hinweis, R-01 | Schlüssel des Hauptbenutzers (Ä-16) = voller Zugriff auf das Konto. Empfehlung in Abschnitt 6, P-09. |
| D-07 | Zugangsschutz der Vorschau | bestanden; Mangel S-09 | `.htpasswd` unter `~/preview/` (außerhalb von `preview/www`); Seite und `/api/lead.php` verlangen Anmeldung (Rauchtest prüft 401); `X-Robots-Tag: noindex, nofollow`; Hash APR1-MD5 (S-09) |
| D-08 | Schutzregeln der Umgebungen | Mangel S-02; nicht prüfbar (GitHub) | Runbook: `production` mit Prüfern und Zweigbeschränkung, `preview` ohne beides bei gleichem Schlüssel |
| D-09 | Release-Sperre: kann ein gescheiterter Build ausgeliefert werden? | bestanden; Mangel S-13 | Workflow: `npm run build:release` muss bestehen (heute 226 Mängel → Abbruch), `package.mjs` verweigert `dist/` ohne `.release` (die Marke schreibt nur `check-release.mjs` nach bestandener Prüfung, jeder Build löscht sie). `production` hängt von `build` und `preview` ab. Auf dem Host selbst prüft `remote.sh` die Release-Eigenschaft nicht (S-13). |
| D-10 | Rückweg | bestanden | `rollback` prüft die Prüfsummen des vorigen Release, schaltet um und tauscht `current`/`previous`; `prune` behält `current`, `previous`, `preview`; automatischer Rückweg nur, wenn `activate` gelang und der Rauchtest scheiterte |
| D-11 | Vorschau nutzt Betriebsdaten | Hinweis | ohne `config.preview.php` schreibt die Vorschau in die echte Datenbank und das echte Postfach (Runbook sagt das); Rate-Limit-Zähler gemeinsam |

### 4.7 Abhängigkeiten und Lizenzen

| # | Prüfpunkt | Ergebnis | Beleg |
|---|---|---|---|
| L-01 | `composer audit` (alle / `--locked --no-dev`) | bestanden | `No security vulnerability advisories found.` (beide) |
| L-02 | Laufzeitabhängigkeiten PHP | bestanden | `composer.lock` `packages`: nur `phpmailer/phpmailer v7.2.0` (`LGPL-2.1-only`); 26 Entwicklungspakete (PHPUnit u. a., BSD-3-Clause/MIT) nicht im Paket. LGPL: Lizenztext liegt im Paket (`vendor/phpmailer/phpmailer/LICENSE`); ob die Lizenzseite der Website PHPMailer nennen soll, entscheidet der Anbieter (Datenschutz-/Lizenzprotokoll). |
| L-03 | `npm audit --omit=dev` | bestanden | `found 0 vulnerabilities` (es gibt keine `dependencies`, nur `devDependencies`) |
| L-04 | `npm audit` gesamt | Mangel S-11 | `{"high":18,"critical":0}`: `picomatch` (ReDoS, ohne Behebung), `basic-ftp` (Behebung verfügbar) und abhängige Pakete |
| L-05 | veraltete sicherheitsrelevante Pakete | bestanden; Hinweis | `composer outdated --direct`: nur `phpunit/phpunit` 11.5 → 12.5 (Entwicklung). PHPMailer aktuell. |

### 4.8 Lieferkette und CI

| # | Prüfpunkt | Ergebnis | Beleg |
|---|---|---|---|
| CI-01 | Rechte der Workflows | bestanden | jede Datei `permissions: contents: read`; keine Schreibrechte |
| CI-02 | Festlegung der Actions | Mangel S-10 | `actions/checkout@v4` (7×), `setup-node@v4` (4×), `upload-artifact@v4` (3×), `download-artifact@v4`, `shivammathur/setup-php@v2` (3×) |
| CI-03 | Secrets nur in Jobs, die sie brauchen | bestanden | Build-Job (mit `npm ci` und fremdem Code) ohne Secrets; Secrets nur in `preview`/`production`/`rollback` |
| CI-04 | Aufbewahrung der Artefakte | bestanden | 7 bzw. 14 Tage |
| CI-05 | geplante Läufe | bestanden | nur `security-txt.yml` (wöchentlich), nur Lesen, keine Secrets |
| CI-06 | Gleichzeitigkeit des Deploy | bestanden | `concurrency: deploy`, `cancel-in-progress: false` |
| CI-07 | Abhängigkeitsmeldungen | Hinweis | kein `.github/dependabot.yml` (Teil von S-10) |

## 5. Restrisiken

| Nr. | Restrisiko | Begründung / Umgang |
|---|---|---|
| R-01 | Der Deploy-Schlüssel ist der des Hauptbenutzers (Ä-16). Wer die Secrets einer Umgebung liest, kontrolliert das ganze Hosting-Konto samt `config.php` (Datenbank- und SMTP-Passwort). | Vorgabe des Hosters laut Spec. Mindern: S-02 beheben, Schlüssel nur in GitHub-Umgebungen, Einschränkungen in `authorized_keys` wenn möglich (P-09), Schlüssel bei Personalwechsel tauschen. |
| R-02 | Ungültige Anfragen zählen nicht zum Rate-Limit (Ä-35, gewollt für Korrekturen ohne JavaScript). Eine Flut ungültiger Anfragen belastet PHP und Datenbank ohne Grenze. | Jede Anfrage ist billig (ein `DELETE` mit Index, zwei Lesezugriffe, Vorlage aus Datei). Bei Missbrauch hilft nur der Hoster (Sperre auf Netzebene). |
| R-03 | IPv4 wird nicht über /32 hinaus zusammengefasst; Botnetze und Cloud-Adressen umgehen das Limit je Herkunft. Die harte Grenze (`10 × global_max`) sperrt dann echte Besucher für den Rest der Stunde. | Entwurf aus Ä-07/Ä-35; die Hinweisseite nennt die direkte Kontaktadresse. Speicherfolgen: S-01. |
| R-04 | Der Rate-Limit-Schlüssel liegt in derselben Datenbank wie die Zähler. Wer die Datenbank liest, kann die Hashes des laufenden Tages durch Ausprobieren aller IPv4-Adressen zurückrechnen. | Zähler leben höchstens bis zum Ende ihres Stundenfensters plus Löschlauf; der Schlüssel des Vortages ist weg. Datenbank mit eigenem Benutzer und Zufallspasswort (Ä-11). |
| R-05 | Von Apache selbst beantwortete Fehler (400, 414, 408, 431) und `TRACE` tragen keine Sicherheitskopfzeilen, weil `.htaccess` dafür nicht gelesen wird. | Die Seiten sind statisch und spiegeln keine Eingaben; HSTS fehlt dort, ist aber nach dem ersten Besuch ohnehin gespeichert. Nur in der Serverkonfiguration zu ändern (P-03). |
| R-06 | `mod_dir` baut die Weiterleitung „ohne Schrägstrich“ aus dem `Host` der Anfrage. | Ohne gemeinsamen Zwischenspeicher wirkt eine gefälschte `Host`-Kopfzeile nur auf den Anfragenden. Bei einem CDN oder Proxy vor Apache neu bewerten. |
| R-07 | Steht die Dokumentenwurzel versehentlich auf `live` statt `live/www`, sind `MANIFEST.txt` und `remote.sh` lesbar (`reticora/` bleibt gesperrt, K-12). | Runbook nennt `live/www`; P-08 prüft es nach dem ersten Deploy. |
| R-08 | Das Formular sendet beliebigen Text (auch Links) an das Vertriebspostfach, `Reply-To` ist die eingegebene Adresse. | Gewollt (Kontaktformular). Mails sind Klartext; Phishing-Bewusstsein im Vertrieb. |
| R-09 | `npm ci` führt Installationsskripte der Entwicklungsabhängigkeiten aus; der daraus gebaute Build wird ausgeliefert. | Lockfile mit Integritätswerten; Build-Job ohne Secrets; `npm audit` im CI. Prüfung des Builds auf fremde Hosts und Inline-Skripte (B-02, C-03) begrenzt die Wirkung. |
| R-10 | Ergebnisse zu Kopfzeilen, `LimitRequestBody` und Fehlerausgabe hängen von der PHP-Einbindung beim Hoster ab (FPM oder Modul). | Beide Varianten wurden nachgestellt; welche gilt, klärt P-01. |

## 6. Phase 8 auf dem Hoster prüfen

| Nr. | Prüfung | Befehl / Vorgehen | Erwartung |
|---|---|---|---|
| P-01 | PHP-Einbindung und doppelte Kopfzeilen | `curl -sI https://www.reticora.de/api/lead.php`; `curl -s -D - -o /dev/null -H 'Origin: https://www.reticora.de' -d 'name=' https://www.reticora.de/api/lead.php` (422); dasselbe mit `-H 'Accept: application/json'`; Ergebnis mit `… \| cut -d: -f1 \| sort \| uniq -d` auf Doppelte prüfen | nach Behebung von S-04: jede Kopfzeile genau einmal; vorher Ergebnis festhalten (FPM: keine Doppelten, Modul: S-04) |
| P-02 | `X-Powered-By` | `curl -sI https://www.reticora.de/api/lead.php \| grep -i powered` | nichts |
| P-03 | Serverweite Einstellungen | `curl -sI` (Kopfzeile `Server`), `curl -s -X TRACE -o /dev/null -w '%{http_code}' https://www.reticora.de/`, `curl -s -D - "https://www.reticora.de/$(head -c 9000 /dev/zero \| tr '\0' a)"` | `Server` ohne Version, `TRACE` 405, Fehlerseiten ohne Versionsangabe; sonst beim Hoster nachfragen und als Restrisiko festhalten |
| P-04 | Kennung von PHP und Dateirechte | Einmaldatei wie in `docs/deploy.md` §6 Punkt 5 mit `posix_geteuid()` statt `REMOTE_ADDR`, danach löschen | PHP läuft unter dem Konto-Benutzer; `config.php` mit 600 lesbar |
| P-05 | Fehlerausgabe | `php -i \| grep -E 'display_errors\|display_startup_errors\|log_errors\|error_log'` per SSH und im Panel für die Web-PHP-Version | `display_errors` aus, Fehlerprotokoll außerhalb des Webroots |
| P-06 | `.htaccess`-Rechte und Größe | Rauchtest (`scripts/deploy/smoke.sh`); zusätzlich POST mit 20 000 Byte, einmal mit `Content-Length`, einmal mit `-H 'Transfer-Encoding: chunked'`, danach Tabelle `lead` prüfen | 413 bzw. nach S-06 411/413, **keine** neue Zeile in `lead` |
| P-07 | TLS | Zertifikat für `www.reticora.de` und `reticora.de`; `curl -sI http://reticora.de/` → 301 auf `https://www.…`; Protokolle mit einem TLS-Prüfwerkzeug (z. B. `testssl.sh` lokal) | kein TLS 1.0/1.1, gültige Kette, HSTS auf allen Antworten |
| P-08 | Dokumentenwurzel | `curl -s -o /dev/null -w '%{http_code}' https://www.reticora.de/MANIFEST.txt` und `/remote.sh`, `/reticora/config.php` | 404 |
| P-09 | Einschränkung des SSH-Schlüssels | Im Hosting-Konto prüfen, ob `authorized_keys` Optionen erlaubt (`restrict`, `command="…"`, `from="…"`). Wenn ja: Wrapper, der nur `rsync --server … releases/<sha>/` und `bash releases/<sha>/remote.sh <verify\|preview\|activate\|rollback\|prune\|status>` zulässt; `no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty`. Gibt es weitere SSH-Benutzer, einen eigenen für die Vorschau. | Ergebnis festhalten; sonst R-01 bleibt |
| P-10 | GitHub-Umgebungen | Settings → Environments: `preview` und `production` mit „Deployment branches: main“ und „Required reviewers“; Branch-Schutz `main` | wie S-02 |
| P-11 | Datenbank | eigener Benutzer nur mit Rechten auf die eigene Datenbank (`SHOW GRANTS`), Zugriff von außen im Panel einschränken, wenn möglich; Kontingent des Tarifs notieren | Grundlage für die Obergrenze aus S-01 |
| P-12 | `REMOTE_ADDR` | `docs/deploy.md` §6 Punkt 5 | Adresse des Besuchers, nicht eines Proxys |
| P-13 | SMTP | echte Zustellung (`docs/deploy.md` §6 Punkt 3), dabei Port 465/587 mit Zertifikatsprüfung; absichtlich falsches Passwort → Lead `not_delivered`, `purge.php` Exit 1, Cron-Mail kommt an | wie beschrieben |
| P-14 | Vorschau | ohne Anmeldung 401 auf `/` und `/api/lead.php`; `.htpasswd` nicht unter `preview/www`; Hash-Format (`$2y$` nach S-09) | wie beschrieben |

## 7. Behoben in Phase 7

Behoben im Zweig `claude/phase-7-qa` nach den Entscheidungen des Auftraggebers vom 2026-11-18. Jede Verhaltensänderung hat zuerst
einen scheiternden Test bekommen. Spec-Einträge: §14 Ä-37 bis Ä-39, Ä-44, Ä-45.

| Nr. | Behoben in Phase 7 | Umsetzung | Nachweis | Rest |
|---|---|---|---|---|
| S-01 | `94a44c2` | `rate_limit.held_max` (Standard 500, begrenzt 50–5000): Ist der Bestand an `held` erreicht, neutrale 429, nichts gespeichert, Protokoll `held_ceiling`. `held` wird weiter nie automatisch gelöscht; `purge.php` meldet mit Exit 1. Runbook §2 Schritt 7 und §6 Punkt 8 (Überwachung von Datenbankgröße und `held`). | `AppTest::testStoredHeldLeadsAreCappedByHeldMaxAndTheRestGet429`, `testHeldMaxDoesNotTouchNormalDelivery`, `ConfigTest::testHeldMaxIsClamped` | Am vollen Bestand gehen auch echte Anfragen verloren (Entscheidung, dokumentiert); Kontingent des Tarifs offen (P-11) |
| S-02 | `b1acc90` (Workflow), `0314714` (Runbook) | Jobs `preview`, `production`, `rollback` mit `if: github.ref == 'refs/heads/main' && …`. Runbook §2 Schritt 11: beide Umgebungen mit „Deployment branches: main“ und Prüfern; Schritt 12: eigener, eingeschränkter Schlüssel für die Vorschau, wenn das Konto mehrere Schlüssel zulässt. | `tests/unit/deploy-remote.test.ts` „S-02“; `actionlint` | Einstellungen in GitHub (P-10) und Schlüsseloptionen beim Hoster (P-09, Runbook §8 Frage 11) nur von Hand prüfbar; R-01 bleibt |
| S-03 | `b1acc90` | `remote.sh exists <sha>`: liegt der Stand schon auf dem Host, entfällt der Upload. Sonst rsync (mit `--exclude=/reticora/config.php`) in einen neuen Ordner `releases/.incoming-<sha>-<Lauf>-<Versuch>`, `remote.sh install` prüft (Prüfsummen, `build: release`, Git-Stand) und benennt atomar um (`mv -T`). Ein vorhandenes Release wird nie überschrieben; `prune` räumt liegengebliebene Upload-Ordner ab. | `tests/unit/deploy-remote.test.ts` gegen ein nachgestelltes HOME: zweiter Upload desselben, aktiven Stands lässt den Symlink auf `config.php` und `live/` unverändert | – |
| S-04 | `94a44c2` | `backend/public/.htaccess` (im Paket `www/api/.htaccess`): `Header unset` für CSP, `Referrer-Policy`, `X-Content-Type-Options`, COOP, `Permissions-Policy`, `X-Powered-By`, dazu `Header always unset X-Powered-By`. Die Sicherheitskopfzeilen von `/api/` kommen allein aus der Wurzel-`.htaccess`. | Nachgestellt wie in 2.1: Apache 2.4.58 `mpm_prefork` + `libphp8.3` (`expose_php` an) vorher: 405/403/422/200/303 mit `Referrer-Policy` und `X-Content-Type-Options` doppelt, 422-HTML zusätzlich CSP, COOP, `Permissions-Policy`, 429-HTML zwei CSPs; nachher jede Kopfzeile genau einmal auf 405, 403, 413, 422 (JSON/HTML), 200, 303, 429 (HTML). PHP-FPM (Testserver): ebenfalls je einmal. Automatisch: `tests/e2e/api-headers.spec.ts` (FPM), `tests/e2e-integration/headers.spec.ts` (Modul im Container, Doppelte jetzt Fehler) | auf dem Hosting P-01 |
| S-05 | `94a44c2` | `header_remove('X-Powered-By')` am Anfang von `lead.php` (vor dem frühen 500) und in `Responder::emit`; zusätzlich `.htaccess` wie S-04. | `EntryPointTest::testNoXPoweredByEvenWithExposePhp` (php-cgi mit `expose_php=1`: 405, frühes 500, 500 ohne Konfiguration); e2e wie S-04 | – |
| S-06 | `94a44c2` | `App::dispatch`: ohne gültige `Content-Length` oder mit `Transfer-Encoding` → 411, bevor der Körper gelesen wird. | `AppTest::testPostWithoutContentLengthIs411AndStoresNothing`, `testChunkedTransferEncodingIs411EvenWithALength`, `testInvalidContentLengthIs411`; mod_php nachgestellt: `chunked` klein → 411, `chunked` 19 KB → 413, keine Zeile in `lead`; FPM: Apache gibt den ganzen Körper mit Länge weiter (`tests/e2e/api-headers.spec.ts` „S-06“: Antwort und Speicherung stimmen überein), Container: `headers.spec.ts` „S-06“ ohne Mail | P-06 auf dem Hosting |
| S-07 | `94a44c2` | `tests/server/start.sh` liefert `/api/lead.php` und `/api-limit/lead.php` aus einer Webroot-Kopie (Wurzel-`.htaccess` aus `dist/`, `api/.htaccess` aus `backend/public`) über PHP-FPM (`mod_proxy_fcgi`, `tests/server/php-fpm.sh`); Konfiguration per `SetEnv`. Ebenso `scripts/integration-local.sh --browser`. Doppelte Kopfzeilen lassen die Tests scheitern (vorher nur Anmerkung). | `tests/e2e/api-headers.spec.ts` (405, 403, 413, 415, 422 JSON/HTML, 200, 303), 429 JSON/HTML in `contact.spec.ts`; vor der Umstellung scheiterten drei Tests an fehlendem HSTS auf `/api/` (Proxy ohne `.htaccess`) | Die Variante „Modul“ läuft nur im Container (CI) |
| S-08 | `94a44c2` | `img-src 'self'` ohne `data:` in `public/.htaccess` und `Response::SITE_CSP`; Spec Ä-37. Vorher geprüft: kein `data:` in `dist/` und `src/`. | `ContactPageTest::testImagesOnlyFromTheOwnOriginNoDataUrls`, `tests/e2e/server.spec.ts` (CSP-Wert), keine CSP-Verstöße in `privacy.spec.ts` auf jeder Seite | – |
| S-09 | `b1acc90` | `htpasswd -niBC 12` (bcrypt, Passwort über STDIN), Prüfung auf `$2y$`; `apache2-utils` wird bei Bedarf installiert. | `tests/unit/deploy-remote.test.ts` „S-09“; `htpasswd -niBC 12` lokal ergab `benutzer:$2y$12$…` | P-14 |
| S-10 | `b1acc90` | Alle `uses:` per Commit-SHA mit Versionskommentar (`actions/checkout` v4.4.0, `setup-node` v4.4.0, `upload-artifact` v4.6.2, `download-artifact` v4.3.0, `shivammathur/setup-php` v2.40.0; SHA per `git ls-remote` ermittelt), `persist-credentials: false` an jedem `checkout` (kein Workflow pusht), `.github/dependabot.yml` für npm, Composer (`/backend`) und Actions, wöchentlich. | `tests/unit/deploy-remote.test.ts` „S-10“; `actionlint` | – |
| S-11 | `b1acc90` | `npm audit fix` brach mit einem Fehler von npm ab („Cannot read properties of null (reading 'edgesOut')“); stattdessen `npm update basic-ftp get-uri pac-proxy-agent proxy-agent fdir` im Rahmen der erlaubten Versionen (keine direkte Abhängigkeit geändert; transitiv `basic-ftp` 5.3.1 → 6.2.6 und `quickjs-wasi` 2.2.0 → 3.7.0 über die Patch-Versionen von `get-uri` und `degenerator`). Ergebnis `npm audit`: 14 hoch, 0 kritisch, alle aus picomatch (GHSA-fc5q-39xc-vjpf), behoben erst mit neuen Hauptversionen von astro, vite, vitest, html-validate, @astrojs/check. Kommentar in `ci.yml` mit diesem Stand. | `npm audit --json` | picomatch bis zu neuen Hauptversionen (Dependabot meldet) |
| S-12 | `b1acc90` | `composer install --no-dev --prefer-dist --no-plugins`; `stripVendor` behält je Paket nur die Autoload-Pfade aus seiner `composer.json`, Lizenzdateien, `composer.json` und `language/`, entfernt Punktdateien und leere Ordner; `verifyLayout` lehnt `.git` und Punktordner außerhalb von `www/` ab. Ein Paket mit `--allow-dev` enthält in `vendor/phpmailer/phpmailer/` nur noch `src/`, `language/`, `LICENSE`, `COMMITMENT`, `VERSION`, `composer.json`. | `tests/unit/deploy-package.test.ts` „S-12“ | – |
| S-13 | `b1acc90` | `verify_dir` (für `verify`, `install`, `preview`, `activate`, `rollback`) verlangt `build: release` und `git: <sha>` in `MANIFEST.txt`. | `tests/unit/deploy-remote.test.ts` „S-13“ und „verify prüft, dass MANIFEST.txt zum Release-Ordner gehört“ | – |

Nicht geändert: Restrisiken R-01 bis R-10 (Abschnitt 5) bleiben; R-10 ist um die Prüfung beider PHP-Einbindungen kleiner. Die
Prüfungen P-01 bis P-14 auf dem Hoster stehen weiter aus.

## Anhang: wichtigste Befehle

```
# Builds (unter Lock), danach Kopie nach <scratch>/rel-dist bzw. <scratch>/dev-dist
flock /tmp/reticora-build.lock sh -c 'npm run build:release; …; npm run build'
# Paket
node scripts/deploy/package.mjs --allow-dev --out <tmp>/pkg --dist <scratch>/dev-dist --backend <tmp>/backend --sha 0123456789abcdef0123
# Geheimnisse
gitleaks detect --source . --log-opts="--all" --redact --report-path <tmp>/gitleaks-history.json
gitleaks detect --source . --no-git --redact --report-path <tmp>/gitleaks-tree.json
git log --all -p --no-color > <tmp>/history.patch   # dann grep nach Schlüsselmustern und E-Mail-Adressen
# Abhängigkeiten
npm audit --json; npm audit --omit=dev; (cd backend && composer audit && composer audit --locked --no-dev && composer outdated --direct)
# Tests
flock /tmp/reticora-build.lock sh -c 'cd backend && vendor/bin/phpunit --do-not-cache-result'          # OK (172 tests, 1213 assertions)
flock /tmp/reticora-build.lock env RETICORA_IT_PYTHON=<venv>/bin/python bash scripts/integration-local.sh   # OK (20 tests, 196 assertions)
# Kopfzeilen (Prüfaufbau 2.1, FPM auf :18181/:18443, Modul auf :18182)
curl --noproxy '*' -sk -D - -o body -H 'Host: www.reticora.de' https://127.0.0.1:18443/
curl --noproxy '*' -s -D - -o body -H 'Origin: https://www.reticora.de' -H 'Transfer-Encoding: chunked' --data-binary @bigvalid.txt http://127.0.0.1:18182/api/lead.php
```
