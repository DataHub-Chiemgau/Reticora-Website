# Deploy-Runbook (Hetzner Webhosting L)

Stand: Vorbereitung in Phase 7, nach der Behebung der Prüfprotokolle (`docs/qa/2026-11-*.md`). **Nichts davon wurde gegen das echte Hosting-Konto ausgeführt.** Spec §11, Ä-12, Ä-16. Abschnitt 8 listet, was der Auftraggeber im Konto bestätigen muss, bevor der Ablauf zum ersten Mal läuft.

**Erster Test auf dem echten Server, ohne Release-Sperre:** Abschnitt 9 (Vorschau). Go-live der Website ist der 2027-01-01 (W-E17); bis dahin wird nur die Vorschau genutzt.

Das Hosting: Apache mit `.htaccess`, PHP, MariaDB, SSH auf Port 222 mit dem Schlüssel des Hauptbenutzers (SFTP als Rückweg). Die Seite besteht aus statischem `dist/` und dem PHP-Backend für das Kontaktformular (`backend/`, siehe `backend/README.md`).

## 1. Überblick

```
GitHub Actions  ──rsync/SSH, Port 222──▶  ~/releases/.incoming-…  Upload eines Laufs (neuer Ordner, nie ein vorhandenes Release)
                                          ~/releases/<sha>/      jedes Release in einem eigenen Ordner (remote.sh install benennt um)
                                          ~/preview/             Kopie mit Zugangsschutz (.htpasswd aus Secret)
                                          ~/live                 Betrieb: Symlink auf ~/releases/<sha> (oder Ordner, Strategie rsync)
                                          ~/reticora-config/     config.php (von Hand, nie vom Deploy angefasst)
```

Aufbau eines Release (`scripts/deploy/package.mjs`, Beispiel `~/releases/1a2b3c4d5e6f/`):

| Pfad | Inhalt |
|---|---|
| `www/` | Inhalt von `dist/` plus `www/api/lead.php` und `www/api/.htaccess` (aus `backend/public/`). Das ist die Dokumentenwurzel. Kein weiteres PHP, keine Source-Maps. |
| `reticora/` | `src/`, `bin/`, `sql/`, `templates/` (vom Build erzeugt, passend zu `www/`), `vendor/` (`composer install --no-dev --prefer-dist --no-plugins --optimize-autoloader`, danach je Paket nur Autoload-Pfade, Lizenz und `composer.json`; kein `.git`, keine Punktordner), `config.example.php`, `composer.json`/`composer.lock`; in `reticora/` und jedem Unterordner eine `.htaccess` mit `Require all denied`. |
| `remote.sh` | die einzigen Befehle, die der Ablauf auf dem Host ausführt |
| `MANIFEST.txt` | Git-Stand, Bauzeit, Art des Builds, Liste aller Dateien mit SHA-256. `remote.sh` prüft vor jedem Umschalten die Prüfsummen, den Git-Stand und die Zeile `build: release`. Ein mit `--allow-dev` gebautes Paket (nur Ziel `preview`, Zeile `build: dev`) darf installiert und in der Vorschau gezeigt werden, wird aber nie aktiv: `activate` und `rollback` verweigern es (Sicherheitsprüfung S-13). |

Nicht im Paket: Tests, PHPUnit, Entwicklungsabhängigkeiten, `.superpowers`, Source-Maps, `config.php`, Beispieldateien (außer `reticora/config.example.php`), die Freigabe-Marke `dist/.release`.

`lead.php` braucht keine Anpassung: Es sucht `vendor/autoload.php` unter `../../reticora` (von `www/api/` aus also `<Release>/reticora`) oder in `RETICORA_HOME`; `config.php` liegt als Symlink in `reticora/` und zeigt auf `~/reticora-config/config.php`. Ein Test (`tests/unit/deploy-package.test.ts`) startet das Paket mit dem PHP-Server und prüft, dass `GET /api/lead.php` 405 liefert.

Die Datenbank und `config.php` fasst der Ablauf nie an.

## 2. Einmalige Einrichtung auf dem Hosting

Reihenfolge einhalten; jeder Schritt ist ohne den Ablauf von Hand zu erledigen.

1. **PHP 8.4** im Hosting-Konto für die Domain einstellen (Zielversion laut Ä-11; `composer.json` verlangt mindestens 8.3). Prüfen: `php -v` per SSH und `phpinfo()`-freier Test, z. B. die Seite des Panels.
2. **Komprimierung und HTTP/2** im Konto je Domain einschalten (Ä-12). Ohne Schalter bleibt `AddOutputFilterByType DEFLATE` in `.htaccess` die einzige Komprimierung.
3. **DNS:** `www.reticora.de` auf das Hosting; die Adresse ohne `www` (Apex) zeigt ebenfalls auf das Hosting oder wird beim DNS-Anbieter weitergeleitet. Die `.htaccess` leitet `http` und die Adresse ohne `www` in einem Schritt auf `https://www.reticora.de` um, das gelingt nur, wenn beide Namen beim Hosting ankommen und für beide ein Zertifikat gilt.
4. **TLS-Zertifikat** für `www.reticora.de` und die Adresse ohne `www` im Panel ausstellen. Erst danach `Strict-Transport-Security` (steht schon in `.htaccess`) verantworten: Ein fehlendes Zertifikat sperrt Besucher aus.
5. **MariaDB:** im Panel eine Datenbank anlegen und einen **eigenen Datenbankbenutzer** nur für diese Datenbank mit einem **zufälligen Passwort** (mindestens 24 Zeichen, z. B. `openssl rand -base64 24`). Der Datenbankserver des Hosters ist von außen erreichbar (Ä-11); das Passwort steht nur in `config.php`. Zeichensatz `utf8mb4`.
6. **Verzeichnisse** per SSH anlegen:
   ```
   mkdir -p ~/releases ~/reticora-config
   chmod 700 ~/reticora-config
   ```
7. **`config.php`:** `reticora/config.example.php` aus einem Release (oder `backend/config.example.php`) nach `~/reticora-config/config.php` kopieren, jeden Wert `AENDERN` ersetzen (sonst lehnt das Backend die Datei ab) und `chmod 600`. Schlüssel:

   | Schlüssel | Bedeutung |
   |---|---|
   | `site_url` | `https://www.reticora.de`. Die Origin-Prüfung lässt nur diese Herkunft zu; ein falscher Wert sperrt das Formular. |
   | `contact_email` | Adresse, die auf der Hinweisseite bei Serverfehler oder zu vielen Anfragen steht. |
   | `retention_days` | **Pflicht**, ganze Zahl von 1 bis 3650: Aufbewahrungsfrist der Anfragen und der Tagesprotokolle in Tagen; `purge.php` löscht danach. Fehlt der Wert oder ist er ungültig, startet weder das Formular noch ein Cronjob (Spec Ä-42). Entschieden: **30** (30 Tage nach Eingang, Auftraggeber 2026-11-19, W-E18). |
   | `rate_limit.max` | gültige Anfragen je Herkunft und Stunde (Standard 5, erlaubt 1 bis 100). |
   | `rate_limit.global_max` | gültige Anfragen insgesamt je Stunde, die normal zugestellt werden (Standard 60, erlaubt 1 bis 1000); darüber werden sie gespeichert (`held`) und von `retry.php` später zugestellt. |
   | `rate_limit.held_max` | höchstens so viele gespeicherte `held`-Anfragen (Standard 500, erlaubt 50 bis 5000, Spec Ä-38). Ist der Bestand voll, antwortet das Formular mit der neutralen 429-Seite und speichert nichts; **in diesem Zustand gehen auch echte Anfragen verloren** (die Hinweisseite nennt die direkte Kontaktadresse). Gelöscht wird `held` nie automatisch; `retry.php` stellt zu, `purge.php` meldet. |
   | `templates_dir` | nur setzen, wenn die Vorlagen nicht neben `vendor/` liegen. Standard ist richtig. |
   | `db.dsn`, `db.user`, `db.pass` | Zugang zur Datenbank aus Schritt 5, DSN `mysql:host=localhost;dbname=<Name>;charset=utf8mb4` (Hostname laut Panel). |
   | `mail.transport` | `smtp`. `file` nur für lokale Tests. |
   | `mail.host`, `mail.port`, `mail.encryption` | SMTP des Hosters oder Mailanbieters: 465 mit `ssl` oder 587 mit `starttls`. Zertifikatsprüfung ist Pflicht. |
   | `mail.user`, `mail.pass` | **SMTP-Postfach** mit Anmeldung (eigenes Postfach nur für den Versand anlegen, Passwort zufällig). |
   | `mail.helo_name` | Rechnername im SMTP-Gruß, üblich `www.reticora.de`. |
   | `mail.timeout`, `mail.deadline` | Sekunden je Verbindungs- bzw. Lesevorgang (10) und Gesamtfrist je Versand (15). |
   | `mail.from_address`, `mail.from_name` | Absender; die Adresse sollte zum SMTP-Postfach gehören (SPF/DKIM des Absenderdomains prüfen). |
   | `mail.to_address` | Vertriebspostfach, einziger Empfänger. Eine Mail an die eingegebene Adresse gibt es nie. |
   | `mail.allow_insecure` | **muss `false` bleiben bzw. fehlen.** `true` erlaubt Versand ohne TLS und Anmeldung und ist nur für lokale Tests. |
   | `log_path` | Name des Protokolls außerhalb des Webroots, z. B. `/<Heimat>/reticora-config/lead.log`. Geschrieben wird je UTC-Tag eine Datei `lead-JJJJ-MM-TT.log` daneben; `purge.php` löscht Tagesdateien (`lead-`, `purge-`, `retry-…`) nach `retention_days` (Spec Ä-40). Enthält Ereignisnamen und Lead-IDs, keine Formularinhalte, keine IP-Adressen. |

   Optional `~/reticora-config/config.preview.php` mit eigener Datenbank und einem Test-Postfach als Empfänger. Sie entsteht entweder von Hand oder im Deploy-Lauf aus den `PREVIEW_*`-Secrets (Abschnitt 9). Eine Vorschau mit Entwicklungs-Build (`build: dev`) nimmt **nur** diese Datei und scheitert, wenn sie fehlt; sie liest nie `config.php`. Eine Vorschau mit Release-Build nimmt sie, falls vorhanden, sonst `config.php` (dann landen Testanfragen in der echten Datenbank und im echten Postfach). Der Betrieb liest ausschließlich `config.php`.
8. **Tabellen anlegen** nach dem ersten Upload eines Release (Abschnitt 4, Schritt 1): `php ~/releases/<sha>/reticora/bin/migrate.php ~/reticora-config/config.php` (idempotent; spielt alle Dateien `sql/NNN_*.sql` der Reihe nach ein und legt auch `rate_limit_key` an). Bei späteren Releases nur, wenn `sql/` sich ändert; das steht dann in den Release-Hinweisen. Eine mit dem ersten Schema angelegte Datenbank (Spalte `rate_limit_key.day`) stellt `002_rate_limit_key_hourly.sql` auf den stündlichen Schlüssel um (Spec Ä-36); der laufende Schlüssel wird dabei neu erzeugt.
9. **Cronjobs** im Panel (Pfad `~/live/reticora/bin/…` gilt für beide Umschaltstrategien, siehe Abschnitt 7):
   ```
   17 * * * *    php ~/live/reticora/bin/purge.php >> ~/reticora-config/purge-$(date -u +\%F).log 2>&1
   */15 * * * *  php ~/live/reticora/bin/retry.php >> ~/reticora-config/retry-$(date -u +\%F).log 2>&1
   ```
   Die Ausgaben landen so wie das Anwendungsprotokoll in Tagesdateien, die `purge.php` nach `retention_days` löscht (DS-04; `%` muss in der Crontab als `\%` stehen; zeigt das Panel nur ein Befehlsfeld, dort die Zeile ohne Zeitangabe eintragen und prüfen, dass die Datei mit Datum entsteht). Beide **mit Mail bei Fehler**: Den Absender/Empfänger der Cron-Mails im Panel auf eine gelesene Adresse stellen (oder `MAILTO=` setzen). `purge.php` endet mit Exit-Code 1, solange Anfragen `held` oder `not_delivered` sind oder seit über 15 Minuten auf `pending` stehen; das ist der Alarm (siehe `backend/README.md`, „Was tun, wenn `purge.php` meldet“). Ob das Panel den Exit-Code in eine Mail umsetzt, im Test mit einem absichtlich scheiternden Aufruf prüfen.
10. **Domain-Verzeichnisse im Panel:** Betrieb: Dokumentenwurzel von `www.reticora.de` auf `live/www`. Vorschau: Subdomain nur für die Vorschau (Name nach Wahl des Auftraggebers) auf `preview/www`. Beides erst nach dem ersten Deploy (Abschnitt 4), weil die Ordner vorher nicht existieren.
11. **GitHub-Umgebungen** (Repository, Settings, Environments). **Beide** Umgebungen tragen den SSH-Schlüssel und damit Zugriff auf das ganze Hosting-Konto; beide brauchen deshalb dieselben Schutzregeln (Sicherheitsprüfung S-02):
    - **Deployment branches and tags:** „Selected branches and tags“, nur der Hauptzweig (`main`). Zusätzlich laufen die Jobs `preview`, `production` und `rollback` im Workflow nur auf `refs/heads/main` (`if:`); beides zusammen verhindert, dass ein Lauf auf einem anderen Zweig dessen geänderte Skripte mit dem Schlüssel ausführt.
    - **Required reviewers:** in `preview` mindestens eine Person, in `production` mindestens eine Person, nicht die auslösende („Prevent self-review“). Ohne Prüfer in `preview` wäre die zweite Freigabe von `production` umgehbar.
    - `preview`: Secrets `HETZNER_SSH_HOST`, `HETZNER_SSH_USER`, `HETZNER_SSH_KEY`, `HETZNER_KNOWN_HOSTS`, `PREVIEW_HTPASSWD`; optional für die Vorschau-Konfiguration (alle neun oder keins, Abschnitt 9) `PREVIEW_DB_DSN`, `PREVIEW_DB_USER`, `PREVIEW_DB_PASSWORD`, `PREVIEW_SMTP_HOST`, `PREVIEW_SMTP_PORT`, `PREVIEW_SMTP_USER`, `PREVIEW_SMTP_PASSWORD`, `PREVIEW_MAIL_FROM`, `PREVIEW_MAIL_TO`; Variable `PREVIEW_URL` (Adresse der Vorschau mit `https://`), optional `PREVIEW_PHP_BIN` (Name des PHP-Programms auf dem Host, Standard `php`).
    - `production`: Secrets `HETZNER_SSH_HOST`, `HETZNER_SSH_USER`, `HETZNER_SSH_KEY`, `HETZNER_KNOWN_HOSTS`; Variablen `LIVE_URL` (`https://www.reticora.de`) und bei Bedarf `RETICORA_SWITCH` (siehe Abschnitt 7).
    - Zugangsdaten stehen nie im Repository, nie in Variablen und nie in Logs; im Workflow nur als Namen.
    - `PREVIEW_HTPASSWD` hat das Format `benutzer:passwort` (Klartext, zufälliges Passwort). Der Hash entsteht im Lauf als bcrypt (`htpasswd -B`, Passwort über STDIN, S-09) und liegt nur auf dem Host.
12. **SSH-Schlüssel:** ein eigenes Schlüsselpaar für den Deploy erzeugen (`ssh-keygen -t ed25519 -C reticora-deploy`), den öffentlichen Teil im Hosting-Konto für den Hauptbenutzer hinterlegen, den privaten Teil als `HETZNER_SSH_KEY` eintragen. Zugriff einmal von Hand mit `ssh -p 222 <Benutzer>@<Host>` prüfen. **Empfehlung (S-02, P-09):** Erlaubt das Konto mehrere Schlüssel oder weitere SSH-Benutzer, für die Vorschau einen eigenen Schlüssel (eigenes Secret in der Umgebung `preview`) anlegen und beide Schlüssel in `authorized_keys` einschränken (`restrict`, ggf. `command="…"` mit einem Wrapper, der nur `rsync --server …` in `releases/` und `bash -s -- <exists|install|verify|preview|activate|rollback|prune|status>` bzw. `bash releases/<sha>/remote.sh …` zulässt). Ob Hetzner das zulässt, ist offen (Abschnitt 8, Frage 11); bis dahin gilt Restrisiko R-01 der Sicherheitsprüfung.
13. **Hostschlüssel festlegen:** Den Schlüssel des Hosts über einen zweiten Weg prüfen, nicht blind übernehmen: `ssh-keyscan -p 222 -t ed25519 <Host>` ausführen, den Fingerabdruck (`ssh-keygen -lf -`) mit dem vergleichen, den das Hosting-Konto oder die Hoster-Dokumentation nennt, und die Zeile (`[<Host>]:222 ssh-ed25519 AAAA…`) als `HETZNER_KNOWN_HOSTS` eintragen. Der Ablauf nutzt `StrictHostKeyChecking yes` mit genau dieser Datei; ändert sich der Schlüssel, bricht der Lauf ab, und der Auftraggeber prüft den Grund, bevor er die Zeile ersetzt.
14. **Branch-Schutz** für den Hauptzweig und Pflicht-CI (`ci.yml`, `integration.yml`) vor dem Deploy.

## 3. Was vor dem ersten Deploy bestanden sein muss (Release-Sperre)

- Gilt für den Betrieb (Ziel `production`); die Vorschau (Ziel `preview`, Abschnitt 9) baut ohne diese Sperre. `npm run build:release` endet mit Exit-Code 0. Das ist die Sperre: Der Workflow ruft es im Build-Job auf, und `scripts/deploy/package.mjs` verweigert jedes `dist/` ohne die Marke `dist/.release`, die nur `scripts/check-release.mjs` nach bestandener Prüfung schreibt. **Zum Stand dieses Textes scheitert der Befehl mit 226 Mängeln** (offene Claims, fehlende Bilder, Platzhalter in Rechtstexten, fehlende Anbieterangaben, fehlende Meldeadresse für `security.txt`); das ist gewollt.
- Die Prüfprotokolle unter `docs/qa/` (Sicherheit, Datenschutz, Barrierefreiheit, Zielumgebung) liegen vor und haben keine offenen Mängel ohne Entscheidung des Auftraggebers.
- `ci.yml` und `integration.yml` sind grün (Tests, Lighthouse, `composer audit`, Integrationstests gegen MariaDB und SMTP mit Anmeldung).
- Rechtstexte, geprüfte Claims und Screenshots sind freigegeben (Phase 8).
- Die offenen Fragen in Abschnitt 8 sind beantwortet.
- Aufbewahrungsfrist (`retention_days`): entschieden, 30 Tage nach Eingang (2026-11-19, W-E18).

## 4. Ablauf eines Deploys

Actions, Workflow **Deploy**, „Run workflow“, Zweig auswählen, Ziel wählen.

1. **Ziel `preview`:** `build` führt `npm ci`, `npm run build` (Entwicklungs-Build: noindex, Platzhalter erlaubt, Hinweis „Vorschau – Testsystem, nicht öffentlich“), `composer audit` und `scripts/deploy/package.mjs --allow-dev` aus (beim Ziel `production`: `npm run build:release` und das Paket ohne `--allow-dev`) und lädt das Paket als Artefakt hoch. `preview` fragt zuerst `remote.sh exists <sha>` (`<sha>` = erste 12 Stellen des Commits). Liegt der Stand schon auf dem Host (z. B. ein zweiter Lauf desselben Commits, auch wenn er gerade in Betrieb ist), wird nichts hochgeladen. Sonst lädt rsync das Paket in einen **neuen** Ordner `~/releases/.incoming-<sha>-<Lauf>-<Versuch>/` (ohne `reticora/config.php`), und `remote.sh install` prüft ihn und benennt ihn atomar in `~/releases/<sha>/` um. Ein vorhandenes, womöglich laufendes Release wird nie überschrieben (S-03; früher löschte `rsync --delete` dort den Symlink auf `config.php`). `remote.sh verify` prüft die Prüfsummen, der optionale Schritt „Vorschau-Konfiguration“ schreibt `config.preview.php` und legt die Tabellen an (Abschnitt 9), `remote.sh preview` kopiert es nach `~/preview/` und schützt es mit `.htpasswd` (auch `/api/lead.php`; zusätzlich `X-Robots-Tag: noindex`). Der Rauchtest prüft: ohne Anmeldung 401 (Seite und API), mit Anmeldung Startseite 200, `/en/` 200, `GET /api/lead.php` 405 mit `Allow: POST`, 404 deutsch und englisch, die Kopfzeilen (HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP), und dass `/.release`, `/reticora/config.php`, `/MANIFEST.txt`, `/backend/` nicht ausgeliefert werden.
2. **Sichtprüfung der Vorschau** durch den Auftraggeber (Seiten, Formular nur mit der Vorschau-Konfiguration, siehe Abschnitt 2 Schritt 7).
3. **Ziel `production`:** Der Lauf wiederholt Schritt 1 (mit Release-Build; ein dev-Stand gleicher Kennung auf dem Host wird ersetzt), hält dann an der geschützten Umgebung `production` an. Nach der Freigabe durch einen Prüfer prüft der Job zuerst, dass `MANIFEST.txt` auf dem Host `build: release` sagt, dann schaltet `remote.sh activate <sha>` den Betrieb auf das Release um (Abschnitt 7), das vorige Release bleibt unter `~/releases/` liegen (`current`/`previous` in `~/releases/.current` und `.previous`). Danach der Rauchtest gegen `LIVE_URL`. **Scheitert er, schaltet der Lauf automatisch auf das vorige Release zurück** und endet rot. Zuletzt bleiben die neuesten fünf Releases (plus `current`, `previous`, `preview`).
4. **Danach** die Checkliste in Abschnitt 6.

Beim allerersten Deploy gibt es kein voriges Release; ein Fehler ist dann nur durch Korrektur und neuen Lauf zu beheben.

Parallele Läufe gibt es nicht (`concurrency: deploy`).

## 5. Rückweg

- **Normal:** Workflow **Deploy**, Ziel `rollback`. Die Umgebung `production` verlangt Freigabe. `remote.sh rollback` prüft die Prüfsummen des vorigen Releases, schaltet um und tauscht `current` und `previous`; ein zweiter Rollback führt wieder vor. Danach Rauchtest.
- **Ohne GitHub:** Per SSH `bash ~/releases/<sha>/remote.sh rollback` (mit `RETICORA_SWITCH`, falls nicht `symlink`), oder von Hand bei Strategie `symlink`: `ln -sfn ~/releases/<voriger-sha> ~/live.new && mv -T ~/live.new ~/live`.
- **Ohne SSH:** über SFTP den Inhalt von `releases/<voriger-sha>/www` und `…/reticora` in die Zielordner kopieren (Strategie rsync) bzw. im Panel die Dokumentenwurzel auf `releases/<voriger-sha>/www` stellen.
- **Datenbank:** Der Ablauf migriert nichts. Ändert ein Release das Schema, muss die Änderung rückwärtskompatibel sein, sonst gibt es keinen sauberen Rückweg; das steht in den Release-Hinweisen.

## 6. Checkliste nach dem Deploy (auf dem Betrieb)

1. **Kopfzeilen:** `curl -sI https://www.reticora.de/`, `…/en/`, `…/api/lead.php`, eine 404-Adresse, `http://www.reticora.de/` (301 auf https) und `http://reticora.de/` (301 auf `https://www.…`): überall HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, **je genau einmal**, kein `X-Powered-By`. Für `/api/lead.php` zusätzlich 422 (POST mit `-H 'Origin: https://www.reticora.de' -d 'name='`) prüfen und mit `… | cut -d: -f1 | sort | uniq -d` auf Doppelte zählen (Sicherheitsprüfung P-01, S-04: mit PHP als Modul entfernt `api/.htaccess` die Werte von PHP).
   Dazu einmal ein POST mit 20 000 Byte und `-H 'Transfer-Encoding: chunked'`: Antwort 411 oder 413, **keine** neue Zeile in `lead` (S-06).
2. **404 deutsch und englisch:** `/gibt-es-nicht/` und `/en/gibt-es-nicht/` zeigen die jeweilige Fehlerseite mit Status 404.
3. **Formular mit echtem Postfach:** Anfrage senden (deutsch und englisch), Mail im Vertriebspostfach prüfen (Absender, `Reply-To` = eingegebene Adresse, Umlaute, Eingangszeit), keine Mail an die eingegebene Adresse. In der Datenbank steht der Eintrag mit Status `delivered`. Danach den Testeintrag nach Absprache löschen. Fehlerfall mit leerem Feld ohne JavaScript: 422-Seite mit Fehlertext.
4. **`security.txt`:** erst wenn eine Meldeadresse feststeht (`SITE.securityContact`): `https://www.reticora.de/.well-known/security.txt` mit `Contact` und `Expires`; der Workflow `security-txt.yml` warnt vor dem Ablauf.
5. **Besucher-IP hinter dem Proxy:** Das Rate-Limit nutzt `REMOTE_ADDR`. Steht dort die Adresse eines vorgeschalteten Proxys, zählen alle Besucher als eine Herkunft. Prüfen mit einer Einmaldatei im Betriebs-Webroot (bei Strategie `symlink` unter `~/releases/<sha>/www/`; sie verschwindet beim nächsten Release ohnehin, wird aber sofort gelöscht): Datei `ip-<zufällige-Zeichen>.php` mit
   ```php
   <?php header('Content-Type: text/plain'); echo $_SERVER['REMOTE_ADDR'], "\n";
   ```
   anlegen, von einem Gerät mit bekannter öffentlicher Adresse (z. B. Mobilfunk) aufrufen, mit der eigenen Adresse (aus einem Dienst, der sie anzeigt) vergleichen, **danach die Datei sofort löschen** und mit `curl -I` prüfen, dass sie 404 liefert. Stimmen die Adressen nicht, nicht ausliefern, Hoster fragen (Ergebnis in `docs/qa/` festhalten); `X-Forwarded-For` wird bewusst nicht gelesen.
6. **Lighthouse** auf dem Betrieb (Startseite, Preise, Kontakt, Discovery, `/en/`, `/en/pricing/`) mit den Grenzen aus `lighthouserc.json`, zusätzlich mit echter Komprimierung und HTTP/2 vom Hoster; Ergebnis festhalten.
7. **Cron:** nach spätestens einer Stunde steht ein Lauf von `purge.php` in `~/reticora-config/purge-JJJJ-MM-TT.log`, ohne Fehler (`held=0 not_delivered=0 pending=0`).
8. **Überwachung (S-01):** Datenbankgröße und Kontingent des Tarifs im Panel notieren; die Zahl `held` in der Cron-Ausgabe beobachten. Steht `held` dauerhaft über 0, `retry.php` von Hand laufen lassen und die Ursache klären (Angriff, Mailserver); nähert sich `held` dem Wert `rate_limit.held_max`, verliert das Formular Anfragen (Abschnitt 2, Schritt 7).
9. Vorschau abschalten oder leeren, wenn sie nicht mehr gebraucht wird (Subdomain im Panel entfernen).
10. **Anfragen von Betroffenen** (Auskunft, Berichtigung, Löschung): Vorgehen in `docs/betrieb-anfragen.md`.

## 7. Umschaltstrategie: Symlink oder rsync

`remote.sh` kapselt das Umschalten in einer Funktion (`switch_live`); die Variable `RETICORA_SWITCH` (GitHub-Variable der Umgebung `production`, Standard `symlink`) wählt:

- **`symlink`:** `~/live` ist ein Symlink auf `~/releases/<sha>`. Umschalten ist ein atomarer Austausch (`ln -sfn` und `mv -T`). Die Dokumentenwurzel der Domain ist `live/www`. Voraussetzung: Das Panel akzeptiert einen Pfad hinter einem Symlink, Apache folgt ihm (`FollowSymLinks`), PHP löst `__DIR__` zum echten Pfad auf (dann trifft `../../reticora` das Release; sonst `RETICORA_HOME` setzen).
- **`rsync`:** `~/live` ist ein echter Ordner mit `www/` und `reticora/`. Umschalten kopiert das Release mit `rsync -a --delay-updates --delete-after` (nicht ganz atomar; `reticora/` zuerst, dann `www/`), `config.php` bleibt ausgenommen. Das vorige Release bleibt in `~/releases/`. Voraussetzung: `rsync` auf dem Host.

Der Cron-Pfad `~/live/reticora/bin/…` und die Dokumentenwurzel `live/www` gelten in beiden Fällen. Die Vorschau ist immer eine Kopie (keine Symlinks nötig).

## 8. Offene Fragen an den Auftraggeber (im Hosting-Konto zu bestätigen)

1. Erlaubt das Panel als Domain-Verzeichnis einen Pfad hinter einem Symlink, und folgt Apache dem Symlink? Falls nein, `RETICORA_SWITCH=rsync` setzen.
2. Gibt es `rsync`, `bash`, `sha256sum`, `mv -T` und `openssl` in der SSH-Umgebung (Port 222)? Sind lange SSH-Befehle und rsync über SSH erlaubt?
3. Welcher Pfad ist `$HOME` (für `AuthUserFile`), und läuft Apache unter demselben Benutzer, der die Dateien liest?
4. Zulässt der Tarif eine eigene Subdomain für die Vorschau mit eigenem Verzeichnis und `AllowOverride AuthConfig` (Basic-Auth per `.htaccess`)?
5. Läuft PHP als FastCGI/CGI oder als Modul? `api/.htaccess` entfernt die von PHP gesetzten Sicherheitskopfzeilen in beiden Fällen (S-04); das Ergebnis mit Abschnitt 6, Punkt 1 festhalten.
6. Cron: Mail bei Ausgabe oder Fehler, Absender, kürzestes Intervall (15 Minuten nötig).
7. Ist `REMOTE_ADDR` die Adresse des Besuchers (Abschnitt 6, Punkt 5)?
8. SMTP-Zugang, Port und Verschlüsselung des Versandpostfachs; SPF/DKIM der Absenderdomain.
9. Aufbewahrungsfrist `retention_days` bestätigen.
10. Vorschau-Adresse (Name der Subdomain).
11. Erlaubt das Konto mehrere SSH-Schlüssel oder weitere SSH-Benutzer und Optionen in `authorized_keys` (`restrict`, `command=`)? Dann eigener, eingeschränkter Schlüssel für die Vorschau (Abschnitt 2, Schritt 12).
12. Datenbank-Kontingent des Tarifs (Grundlage für `rate_limit.held_max`, Abschnitt 6, Punkt 8).

## 9. Erster Test auf dem Server (Vorschau)

Für den Auftraggeber. Ziel: Die Website und das Kontaktformular laufen zum ersten Mal auf dem echten Hosting-Konto, **ohne** dass die Release-Sperre erfüllt sein muss. Der Betrieb (`www.reticora.de`) bleibt unberührt und gesperrt. Dieser Weg erzeugt nur die Vorschau mit Zugangsschutz, `noindex` und dem Hinweis „Vorschau – Testsystem, nicht öffentlich“ am Seitenrand. In den folgenden Schritten stehen `HOST` für den Servernamen und `USER` für den Benutzer des Hosting-Kontos (beide aus dem Panel; nie in Dateien des Repositorys schreiben).

1. **Schlüsselpaar erzeugen** (auf dem eigenen Rechner, nicht im Repository):
   ```
   ssh-keygen -t ed25519 -f reticora-deploy -C github-actions-deploy
   ```
   Es entstehen `reticora-deploy` (privat) und `reticora-deploy.pub` (öffentlich). Ohne Passphrase, weil GitHub Actions keine eingeben kann; der Schlüssel gehört deshalb nur in das GitHub-Secret.
2. **Öffentlichen Schlüssel auf dem Konto installieren:**
   ```
   ssh-copy-id -p 222 -i reticora-deploy.pub USER@HOST
   ssh -p 222 -i reticora-deploy USER@HOST true
   ```
   Der zweite Befehl muss ohne Passwortfrage durchlaufen.
3. **Hostschlüssel festlegen:** `ssh-keyscan -p 222 -t ed25519 HOST` liefert die Zeile (`[HOST]:222 ssh-ed25519 AAAA…`). Den Fingerabdruck (`ssh-keygen -lf -`) über einen zweiten Weg prüfen (Hoster-Dokumentation oder Panel), dann die Zeile als Secret `HETZNER_KNOWN_HOSTS` eintragen.
4. **Subdomain und Verzeichnis im Hosting-Panel:** eine Subdomain nur für die Vorschau anlegen (Name nach Wahl), ihr Verzeichnis (Dokumentenwurzel) auf `preview/www` setzen, **TLS-Zertifikat** für die Subdomain ausstellen und **PHP 8.4** für sie einstellen. Der Ordner `preview/` entsteht beim ersten Lauf; legt das Panel die Wurzel vorher an, ist ein leerer Ordner richtig.
5. **Datenbank und Postfach:** im Panel eine **eigene Datenbank** mit eigenem Benutzer (zufälliges Passwort, `utf8mb4`) nur für die Vorschau anlegen sowie ein Postfach für den Versand (SMTP mit Anmeldung) und ein Test-Postfach als Empfänger. Die Frist der Anfragen ist 30 Tage nach Eingang.
6. **GitHub-Umgebung `preview`** (Settings, Environments; Regeln aus Abschnitt 2 Schritt 11: nur Zweig `main`, Prüfer):
   - Secrets (vorhanden): `HETZNER_SSH_HOST`, `HETZNER_SSH_USER`, `HETZNER_SSH_KEY` (Inhalt der privaten Datei `reticora-deploy`), `HETZNER_KNOWN_HOSTS`, `PREVIEW_HTPASSWD` (`benutzer:passwort`).
   - Secrets für die Vorschau-Konfiguration (alle neun oder keins): `PREVIEW_DB_DSN` (z. B. `mysql:host=<Datenbankserver laut Panel>;dbname=<Name>;charset=utf8mb4`), `PREVIEW_DB_USER`, `PREVIEW_DB_PASSWORD`, `PREVIEW_SMTP_HOST`, `PREVIEW_SMTP_PORT` (587 oder 465), `PREVIEW_SMTP_USER`, `PREVIEW_SMTP_PASSWORD`, `PREVIEW_MAIL_FROM`, `PREVIEW_MAIL_TO`. Sind nur einige gesetzt, bricht der Lauf mit der Liste der fehlenden Namen ab; sind keine gesetzt, entfällt der Schritt, und `~/reticora-config/config.preview.php` muss von Hand liegen.
   - Variablen: `PREVIEW_URL` (`https://` plus Subdomain), optional `PREVIEW_PHP_BIN`, wenn das PHP-Programm auf dem Host nicht `php` heißt (SSH-Sitzung prüfen: `php -v` muss 8.4 melden), optional `RETICORA_SWITCH` (nur für den Betrieb wichtig).
7. **Workflow starten:** Actions, **Deploy**, „Run workflow“, Zweig `main`, Ziel **`preview`**, Freigabe in der Umgebung `preview` erteilen. Der Lauf baut den Entwicklungs-Build, lädt das Paket hoch, schreibt (mit den Secrets aus Schritt 6) `~/reticora-config/config.preview.php` mit Modus 600, legt mit `bin/migrate.php` die Tabellen an, richtet die Vorschau mit Zugangsschutz ein und führt den Rauchtest aus. Er prüft: ohne Anmeldung 401 (Seite und API), mit Anmeldung Startseite und `/en/` 200, `GET /api/lead.php` 405 mit `Allow: POST`, 404-Seiten, die Sicherheitskopfzeilen, und dass `/.release`, `/reticora/config.php`, `/MANIFEST.txt` und `/backend/` nicht ausgeliefert werden.
8. **Von Hand ausprobieren:** die Vorschau mit dem Zugang aus `PREVIEW_HTPASSWD` öffnen, eine Testanfrage über das Kontaktformular senden und prüfen, dass die Mail im Test-Postfach ankommt und die Zeile in der Datenbank der Vorschau steht. Testanfragen nach der Abnahme löschen (`docs/betrieb-anfragen.md`). Die Cronjobs für `purge.php` und `retry.php` aus Abschnitt 2 Schritt 9 für die Vorschau nur einrichten, wenn gewünscht (Pfad `~/preview/reticora/bin/…` mit `~/reticora-config/config.preview.php` als Argument).

**Hinweis:** Passwörter, die in Chats oder E-Mails geteilt wurden, nach der Einrichtung ändern (Hosting-Konto, Datenbank, Postfach); ein Schlüssel, der einmal im Klartext verschickt wurde, gehört ersetzt.

Was dieser Weg **nicht** tut: Er schaltet nichts auf `www.reticora.de`, schreibt nie `config.php` und fasst die Betriebsdatenbank nicht an. Ein Lauf mit Ziel `production` baut immer den Release-Build und scheitert an der Release-Sperre, solange Mängel offen sind. Der Go-live ist für den 2027-01-01 vorgesehen (W-E17).
