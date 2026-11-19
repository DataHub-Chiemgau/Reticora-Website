# Prüfprotokoll Datenschutz – Website Reticora

| | |
|---|---|
| Stand | 2026-11-18 (Phase 7, Task 3); Behebung der Mängel am selben Tag, Abschnitt 10 (Spalte „Behoben in Phase 7“ je Mangel mit Commit) |
| Gegenstand | die gebaute statische Website (`dist/`: alle 44 `index.html` beider Sprachen, dazu zwei unbekannte Adressen, die die 404-Seiten liefern) hinter dem Apache-Testserver, das PHP-Backend des Kontaktformulars (`backend/`) mit SQLite und mit MariaDB 10.11 und SMTP-Fänger (STARTTLS, Anmeldung), die CI-Workflows (`.github/workflows/`), der Deploy-Ablauf (`scripts/deploy/`, `docs/deploy.md`) und das Repository einschließlich Verlauf |
| Nicht Gegenstand | die Anwendung Reticora (`www.reticora.cloud`) und die Demo (`www.demo.reticora.cloud`); das Hosting-Konto bei Hetzner selbst (Zugriffsprotokolle, Backups, PHP-Fehlerprotokoll, Cron); das Vertriebspostfach; Rechtstexte |
| Prüfer | Claude (KI-Assistent), ohne Zugriff auf das Hosting-Konto und ohne juristische Prüfung |

**Dieses Protokoll ist keine Rechtsberatung und keine Aussage über
Rechtskonformität.** Es beschreibt, welche Daten die Website und das Backend
technisch verarbeiten, wie das geprüft wurde und mit welchem Ergebnis.
Rechtsgrundlagen, Auftragsverarbeitung und Informationspflichten bewertet es
nicht; dazu stehen in Abschnitt 6 Fragen an den Auftraggeber und seine
Rechtsberatung mit den Fakten, die sie brauchen. Abschnitt 8 ist eine
Faktenliste für die Datenschutzerklärung, kein Text dafür.

Schweregrade der Mängel: **hoch** (personenbezogene Daten gelangen an
Unbefugte oder ohne Wissen des Betreibers an Dritte), **mittel** (eine
zugesagte Eigenschaft ist nicht belegt oder nicht durchgesetzt), **gering**
(Speicherdauer oder Umfang größer als nötig, ohne Weitergabe), **Hinweis**
(Dokumentation, Testdaten, Vorsorge).

## 1. Zusammenfassung

- Im Browser fanden sich auf keiner der 46 geprüften Adressen (Chromium)
  Anfragen an fremde Hosts, Cookies, Einträge in `localStorage`,
  `sessionStorage`, IndexedDB oder Cache API, Service Worker oder Aufrufe
  von Schnittstellen, die sich zum Fingerprinting eignen. Der Build enthält
  keine Vorab-Verbindungen zu fremden Hosts, keine Source-Maps und lädt
  Schriften und Favicon vom eigenen Server.
- Das Formular erhebt fünf Angaben (vier Pflicht, Nachricht freiwillig) und
  die Sprache der Seite. Nutzeragent, Referrer, IP-Adresse und
  `X-Forwarded-For` werden weder gespeichert noch gemailt (geprüft an
  Datenbank, Mail und Protokoll nach echten Absendungen). Es geht genau eine
  Mail an das Vertriebspostfach, nie an die eingegebene Adresse.
- Das Rate-Limit speichert nur HMAC-Werte der Herkunft. Mit dem Schlüssel,
  der in derselben Datenbank liegt, lässt sich eine IPv4-Adresse aber in
  etwa 1,4 Stunden auf einem Prozessorkern zurückrechnen (gemessen). Die
  Zähler sind also Pseudonyme, keine anonymen Daten (Mangel DS-03).
- Anwendungsprotokoll und Cron-Ausgaben enthalten nur Ereignisnamen,
  Lead-IDs und Anzahlen.
- Ergebnis der Checkliste (Abschnitt 4, 48 Prüfpunkte): **30 bestanden**,
  **6 Mangel**, **10 offene Frage an den Auftraggeber**, **2 nicht
  prüfbar**. Die Mängelliste (Abschnitt 5) hat 9 Einträge: 1 mittel
  (DS-01, Nachweis „keine Cookies, kein Storage“ in der CI nur auf der
  Startseite), 5 gering (DS-02 bis DS-06), 3 Hinweise (DS-07 bis DS-09);
  DS-02, DS-08 und DS-09 haben keinen eigenen Prüfpunkt. Kein Mangel der
  Stufe „hoch“. Code wurde in dieser Prüfung nicht geändert; die Behebung
  steht in Abschnitt 5 als Vorschlag mit Fundstelle.
- Nicht prüfbar sind hier alles, was beim Hoster liegt (Zugriffsprotokolle,
  Backups, PHP-Fehlerprotokoll, Cron), und Firefox und WebKit (lokal nur
  Chromium; beide laufen in der CI). Die Prüfschritte stehen in Abschnitt 9.

## 2. Vorgehen und Belege

| Prüfung | Methode | Beleg |
|---|---|---|
| Laufzeit im Browser | Frischer Build (`npm run build`), Apache-Testserver (`tests/server/start.sh`, SQLite, Mail als Datei). Ein Playwright-Skript (Chromium 153) öffnet jede `index.html` aus `dist/` (44 Adressen, darunter `/kontakt/danke/`, `/en/contact/thanks/`, `/en/404/` und die Entwicklerseite `/dev/bausteine/`) und zwei unbekannte Adressen (404 deutsch und englisch), wartet auf `networkidle` und `document.fonts.ready`, scrollt ans Ende und bedient je Seite die erste Insel (Ausfallsimulation, Gerätefilter, Kopierknopf). Erfasst: Host jeder Anfrage (auch fehlgeschlagener), `Set-Cookie` in jeder Antwort, `context.cookies()`, Länge von `localStorage` und `sessionStorage`, `indexedDB.databases()`, `caches.keys()`, `navigator.serviceWorker.getRegistrations()`. Ein vor dem Laden eingesetztes Skript zeichnet Aufrufe auf von `Storage.setItem`, `indexedDB.open`, `caches.open`, `serviceWorker.register`, `sendBeacon`, `document.cookie`, Canvas (`getContext`, `toDataURL`), `OfflineAudioContext`, `RTCPeerConnection`, `WebSocket` und den Navigator-Eigenschaften `hardwareConcurrency`, `deviceMemory`, `plugins`, `languages`, `userAgent`, `platform`. | Skript und Ergebnis lagen im Scratch-Verzeichnis der Sitzung (nicht im Repository); Ergebnis: 46 Adressen, 0 fremde Hosts, 0 Cookies, 0 Storage, 0 Service Worker, 0 aufgezeichnete Aufrufe |
| Formularabläufe | Im selben Lauf: Absenden mit JavaScript auf `/kontakt/?topic=demo` und `/en/contact/?topic=demo` bis zur Dankeseite; Absenden ohne JavaScript; Anfrage mit gefülltem Köderfeld; Anfrage mit eigenem `User-Agent`, `Referer` mit Abfrage und `X-Forwarded-For: 203.0.113.77`. Danach Inhalt von SQLite (`lead`, `rate_limit`, `rate_limit_key`), Mail-Datei, Anwendungsprotokoll, Protokoll des PHP-Servers und Apache-Zugriffsprotokoll gelesen. | 4 Leads gespeichert (Köderfeld nicht), 4 Mails an `vertrieb@example.com`, Protokoll nur `lead_stored id=… delivery=…` und `honeypot` |
| Build-Scan | `grep` über `dist/` (HTML, CSS, JS, XML, TXT, SVG): absolute Adressen nach Host gezählt und je Fundstelle eingeordnet; `<link rel>` mit `preconnect`, `dns-prefetch`, `prefetch`, `preload`, `modulepreload`, `prerender`, `manifest`; `speculationrules`; `sourceMappingURL` und `*.map`; in `dist/_astro/*.js` Zugriffe auf Storage, Cookies, Service Worker, Cache, Navigator, Canvas, Audio, Beacon, `matchMedia`, `screen`, `devicePixelRatio`. | Abschnitt 4, P-02 bis P-08 |
| MariaDB und SMTP | `scripts/integration-local.sh` (MariaDB 10.11.14, SMTP-Fänger mit STARTTLS und Anmeldung), Suite `integration`: 20 Tests bestanden. Danach die 20 gefangenen Mails roh gelesen (Umschlag, Kopfzeilen, Rumpf). | alle 20 Mails: `RCPT TO` nur `vertrieb@example.com`, TLS aktiv, Anmeldung erfolgt |
| Löschlauf und Nachversand | `bin/purge.php` und `bin/retry.php` gegen eine SQLite-Datenbank mit je einem 100 Tage alten Lead in den Zuständen `delivered`, `pending`, `held`, `not_delivered` und einem neuen `pending`. Ausgabe, Exit-Code und verbleibende Zeilen gelesen. | Abschnitt 4, P-34 bis P-36 |
| Rückrechenbarkeit des Rate-Limits | eine Million `hash_hmac('sha256', <IPv4>, <32 Byte>)` in PHP 8.3 gemessen: 1,17 s, hochgerechnet auf alle 2³² IPv4-Adressen 1,4 h auf einem Kern | Abschnitt 4, P-24 |
| Code | gelesen: `backend/src/` (App, Request, Validator, LeadRepository, RateLimiter, RateLimitKey, Purger, Retrier, Mailer, MailMessage, PhpMailerTransport, FileTransport, TransportFactory, Response, Config, Database, ContactPage), `backend/public/lead.php`, `backend/bin/*.php`, `backend/sql/001_init.sql`, `backend/config.example.php`, `public/.htaccess`, `src/views/Contact.astro`, `src/islands/*.ts`, `src/views/Legal.astro`, `scripts/deploy/*`, `.github/workflows/*.yml`, `playwright.config.ts`, `tests/e2e/privacy.spec.ts`, `pages.spec.ts`, `home.spec.ts`, `contact.spec.ts` | – |
| Tests | `vendor/bin/phpunit` (Suite `unit`): 172 Tests bestanden; Suite `integration` siehe oben | – |
| Repository | `git grep` und `git log --all -p` nach E-Mail-Adressen, IPv4- und IPv6-Adressen und Telefonnummern; Git-Autoren | Abschnitt 4, P-40, P-41 |

## 3. Datenfluss-Inventar

„Hoster“ ist Hetzner Online GmbH (Webhosting, Datenbank); Standort laut
Anbieter Deutschland, im Konto nicht bestätigt (F-09). „Betreiber“ ist,
wer Zugang zum Hosting-Konto hat.

| Nr. | Datum | Zweck | Wo | Aufbewahrung und wie durchgesetzt | Zugriff | Drittland |
|---|---|---|---|---|---|---|
| 1 | IP-Adresse, Zeit, Anfragezeile (Pfad mit Abfrage, z. B. `/kontakt/?topic=demo`), Status, Größe; je nach Format des Hosters auch Nutzeragent und Referrer | Auslieferung, Fehlersuche, Sicherheit | Apache-Zugriffsprotokoll beim Hoster | **unbekannt**: Einstellung des Hosters, von der Anwendung nicht steuerbar (Frage Q-03) | Hoster; Betreiber über das Panel | nein (laut Hoster; unbestätigt) |
| 2 | IP-Adresse und Kopfzeilen der Anfrage | Verbindung, Rate-Limit | Arbeitsspeicher von Apache und PHP | Dauer der Anfrage | – | nein |
| 3 | Name, E-Mail, Unternehmen, Anliegen, Nachricht | Eingabe | Formular im Browser des Besuchers; das automatische Ausfüllen speichert der Browser selbst (`autocomplete` bei Name, E-Mail, Unternehmen) | bis zum Verlassen der Seite; die Website schreibt nichts in den Speicher des Browsers | Besucher | nein |
| 4 | dieselben Angaben, `lang`, leeres Köderfeld `website` | Übermittlung | `POST /api/lead.php` (Rumpf, TLS) | – | – | nein |
| 5 | `created_at` (UTC), `lang`, `name`, `email`, `company`, `topic`, `message`, `delivery` | Beantwortung der Anfrage; Nachweis bei fehlgeschlagener Zustellung | MariaDB, Tabelle `lead` | `retention_days` ab `created_at` (Vorschlag 90 Tage, **nicht bestätigt**, Q-05); `bin/purge.php` stündlich per Cron löscht `delivered` und `pending`; `held` und `not_delivered` **nie automatisch**, bis zugestellt oder von Hand erledigt; der Cron ist auf dem Hosting noch nicht eingerichtet | Datenbankbenutzer der Anwendung; Betreiber (SSH, Panel); Hoster | nein |
| 6 | Name, E-Mail, Unternehmen, Anliegen (Text), Sprache, Eingangszeit, Nachricht; `Reply-To` = eingegebene Adresse | Beantwortung | SMTP-Versandkonto → Vertriebspostfach | Regel des Auftraggebers (Q-06); PHPMailer legt keine Kopie in einem Ordner „Gesendet“ ab (kein IMAP) | Vertrieb; Mailanbieter | **unbekannt** (Q-08) |
| 7 | `HMAC-SHA256(Herkunft, Tagesschlüssel)`; Herkunft = IPv4 oder IPv6-/64, zusätzlich IPv6-/48; Fensterbeginn; Zähler | Missbrauchsschutz | MariaDB, Tabelle `rate_limit` | gelöscht bei jedem POST, der die Datenbank erreicht, und durch `purge.php` (Minute 17), sobald das Stundenfenster vorbei ist: höchstens etwa 2 h 17 min nach Fensterbeginn, wenn der Cron läuft; ohne Cron bis zum nächsten POST | wie Nr. 5 | nein |
| 8 | Schlüssel (32 Zufallsbytes) und Tag | Missbrauchsschutz | MariaDB, Tabelle `rate_limit_key` (eine Zeile) | überschrieben beim ersten Gebrauch eines neuen UTC-Tages: mit Cron bis 00:17 UTC, also höchstens etwa 24 h 17 min; ohne Cron bis zum nächsten POST | wie Nr. 5 | nein |
| 9 | Zähler `global` | Obergrenze für alle | `rate_limit` | wie Nr. 7 | – | – (kein Personenbezug) |
| 10 | Zeitstempel, Ereignisname, Lead-ID, Klasse einer Ausnahme mit Datei und Zeile | Betrieb | `log_path` (Vorschlag `~/reticora-config/lead.log`); leer: PHP-Fehlerprotokoll des Hosters | **unbefristet**, keine Rotation (Mangel DS-04); beim Hoster unbekannt (Q-03) | Betreiber; Hoster | nein |
| 11 | Anzahlen (`leads_deleted`, `undelivered`, `sent` …) | Betrieb, Alarm | `purge.log`, `retry.log`; Cron-Mail des Hosters an eine Adresse des Betreibers | unbefristet; Mail nach Regel des Postfachs | Betreiber | wie Nr. 6 |
| 12 | alle Daten aus Nr. 5, 7, 8, 10, 11 | Wiederherstellung | Backups des Hosters | **unbekannt** (Q-07); gelöschte Leads bleiben bis zum Ablauf der Backups erhalten | Hoster | nein (laut Hoster) |
| 13 | Testdaten (`*@example.com`, Adressen aus 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24, 2001:db8::/32) | Tests | CI-Runner (GitHub-gehostet): SQLite, Mail-Datei, MariaDB- und Mailpit-Container | Ende des Laufs | GitHub | ja, Ort der Runner nicht festgelegt; nur Testdaten |
| 14 | Zugriffsprotokoll des Testservers (`127.0.0.1`, Anfragezeile), `test-results/` (Traces beim ersten Wiederholungsversuch mit Netzwerkdaten der Testeingaben, Bildschirmfotos) | Fehlersuche | Artefakt `e2e-diagnose` (`ci.yml`, nur bei Fehlschlag) | 7 Tage (`retention-days: 7`) | Personen mit Lesezugriff auf das Repository | wie Nr. 13 |
| 15 | `docker compose logs` (Apache-Zugriffs- und Fehlerprotokoll des Containers mit Adressen des Docker-Netzes, Ereigniszeilen des Backends, Protokolle von MariaDB und Mailpit), `test-results/` | Fehlersuche | Artefakt `integration-diagnose` (`integration.yml`, nur bei Fehlschlag) | 7 Tage | wie Nr. 14 | wie Nr. 13 |
| 16 | Build und Backend ohne `config.php`, ohne Tests | Deploy | Artefakt `release-package` (`deploy.yml`) | 14 Tage | wie Nr. 14 | wie Nr. 13; keine personenbezogenen Daten |
| 17 | Schriften, Favicon, Stile, Skripte | Darstellung | eigener Webspace (`/_astro/`, `/favicon.svg`) | – | – | keine Übermittlung an Dritte |
| 18 | Aufruf der App oder Demo (Link, dem der Besucher folgt) | Registrierung, Anmeldung, Demo | `www.reticora.cloud`, `www.demo.reticora.cloud`; der Browser sendet als Referrer nur die Origin `https://www.reticora.de/` (`Referrer-Policy: strict-origin-when-cross-origin`) | Sache der App (außerhalb dieses Projekts, Q-11) | Betreiber der App | außerhalb dieses Projekts |
| 19 | Text des Code-Beispiels | Kopieren auf Klick | Zwischenablage des Besuchers (`navigator.clipboard.writeText`) | Sache des Besuchers | Besucher | nein |

Bei `npm` und Composer werden Pakete nur beim Bau geladen (lokal, CI). Auf
dem Hosting läuft PHPMailer aus `vendor/` im eigenen PHP-Prozess und
verbindet sich nur mit dem konfigurierten SMTP-Server.

## 4. Checkliste mit Ergebnis

### 4.1 Browser

| ID | Anforderung | Fundstelle | Vorgehen | Ergebnis | Beleg |
|---|---|---|---|---|---|
| P-01 | Keine Anfrage an einen fremden Host zur Laufzeit, auf jeder Seite beider Sprachen | Spec §7; `vendor-register.md` §6; Matrix T-01, D-09, D-14 | Laufzeitprüfung über 46 Adressen, Inseln bedient, ans Ende gescrollt | bestanden (Chromium) | einziger Host `127.0.0.1:8080` auf allen 46 Adressen und in den Formularabläufen |
| P-02 | Keine Vorab-Verbindungen (`preconnect`, `dns-prefetch`, `prefetch`, `prerender`, Speculation Rules) | Spec §7 | Build-Scan | bestanden | einziger Hinweis: `<link rel="preload" href="/_astro/archivo-leitstand…woff2">` (eigener Host) auf 45 Seiten; kein `speculationrules` |
| P-03 | Keine fremden Ressourcen in HTML, CSS, JS (`src`, `url()`, `@import`) | Spec §7 | Build-Scan, jede Fundstelle eines fremden Hosts eingeordnet | bestanden | `www.reticora.cloud` und `www.demo.reticora.cloud` nur als `<a href>`; `github.com`, `scripts.sil.org` nur in `dist/lizenzen/OFL-*.txt`; `www.w3.org`, `www.sitemaps.org` als XML-Namensraum; `tailwindcss.com` im Lizenzkommentar des CSS. Kein `url(http…)`, kein `@import` |
| P-04 | Schriften und Favicon vom eigenen Server | Matrix D-14 | Build-Scan, Laufzeit | bestanden | `/_astro/*.woff2`, `/favicon.svg`; CSP `font-src 'self'` |
| P-05 | Keine Source-Maps im Build | Spec §8; Matrix S-06 | Build-Scan | bestanden | kein `sourceMappingURL`, keine `*.map` |
| P-06 | Keine Cookies | Matrix T-01 | Laufzeit: `Set-Cookie` in jeder Antwort, `context.cookies()` nach jeder Seite und jedem Formularablauf; Code von `Response.php` | bestanden | 0 `Set-Cookie`, 0 Cookies; Backend setzt keinen Cookie |
| P-07 | Kein Web Storage, keine IndexedDB, keine Cache API, kein Service Worker | Matrix T-01, T-02 | Laufzeit (Zustand und aufgezeichnete Aufrufe), Bundle-Scan | bestanden | alle Werte 0; keine Fundstelle im Bundle |
| P-08 | Inseln nutzen keine Schnittstellen, die sich zum Fingerprinting eignen | Spec §7 | Bundle-Scan und aufgezeichnete Aufrufe | bestanden | einzige Fundstelle `navigator.clipboard` in `copy.ts` (Schreiben auf Klick); `form.ts` liest nur `?topic=` aus der Adresse |
| P-09 | Zweite Sperre: Content-Security-Policy | `public/.htaccess`; `backend/src/Response.php` | Code | bestanden | `default-src 'none'`, `script-src`, `style-src`, `font-src`, `connect-src`, `form-action` je `'self'`, `img-src 'self' data:`; dieselbe CSP auf der 422-Seite |
| P-10 | Die CI belegt P-01, P-06 und P-07 auf jeder Seite in Chromium, Firefox und WebKit | Matrix T-01 („auf jeder Seite“); Plan Task 3 | Tests gelesen | **Mangel (mittel)**, DS-01 | `pages.spec.ts` prüft auf jeder Route aus `ROUTES` nur fremde Hosts (Ereignis `request`); Cookies und Storage prüfen nur `privacy.spec.ts` und `home.spec.ts` auf der Startseite, `contact.spec.ts` nur Cookies im Formularablauf; Service Worker nirgends; 404-Seiten und 422-Seite ohne Host-Prüfung |
| P-11 | P-01, P-06, P-07 in Firefox und WebKit | Plan Task 3 | lokal nur Chromium installiert | nicht prüfbar (lokal) | `playwright.config.ts` fügt Firefox und WebKit nur mit `CI` hinzu; dort läuft die Host-Prüfung aus `pages.spec.ts` für alle Routen, die übrigen nur wie in P-10 |
| P-12 | Beim Verlassen der Website keine Pfade oder Abfragen an fremde Ziele | – | Kopfzeilen | bestanden | `Referrer-Policy: strict-origin-when-cross-origin`: fremde Ziele erhalten nur die Origin |

### 4.2 Formular und Backend

| ID | Anforderung | Fundstelle | Vorgehen | Ergebnis | Beleg |
|---|---|---|---|---|---|
| P-13 | Datensparsamkeit: fünf Felder, Nachricht freiwillig, kein Telefon, keine Position, kein Newsletter | `content-plan.md` §9; Matrix D-01 | `Contact.astro`, `Validator.php`, Absendung | bestanden | Pflicht: Name, E-Mail, Unternehmen, Anliegen; freiwillig: Nachricht; dazu `lang` (aus der Seite) und Köderfeld; weitere Felder im Rumpf werden gelesen, aber `Validator` übernimmt nur die bekannten, gespeichert und gemailt wird nur dieser Satz |
| P-14 | Keine verdeckte Erhebung: Nutzeragent, IP, Referrer, `X-Forwarded-For` werden nicht gespeichert und nicht gemailt | Spec §6.2 | Absendung mit Markern in `User-Agent`, `Referer`, `X-Forwarded-For`; Datenbank, Mail, Protokolle gelesen | bestanden | Spalten von `lead` nur wie Inventar Nr. 5; kein Marker in Datenbank, Mail oder Anwendungsprotokoll |
| P-15 | Köderfeld: Treffer werden weder gespeichert noch gemailt | Spec §6.1 | Absendung mit gefülltem `website` | bestanden | Antwort `{"ok":true}`, kein Lead, keine Mail, Protokollzeile `honeypot` |
| P-16 | Ungültige Eingaben: nichts gespeichert; Eingaben nur in derselben Antwort | Spec Ä-08, Ä-19 | Code (`App::dispatch`: Prüfung vor dem Speichern), `Response::make` | bestanden | 422 ohne Weiterleitung und ohne Eingaben in der Adresse; `Cache-Control: no-store`; Tests `contact.spec.ts` („422-Seite …“), `AppTest` |
| P-17 | Zurückgehaltene Anfragen (`held`) | Spec Ä-35 | Code, `RateLimitTest::testGlobalCapHolds…` | offene Frage, Q-05 | gespeichert ohne Mail, Besucherin sieht die normale Dankeseite, `retry.php` stellt später zu; nie automatisch gelöscht |
| P-18 | Inhalt der Vertriebsmail | Spec Ä-09 | 4 Mails (Datei-Transport) und 20 Mails (SMTP) gelesen | bestanden | Name, E-Mail, Unternehmen, Anliegen, Sprache, Eingangszeit UTC, Nachricht oder „(keine)“; keine IP, kein Nutzeragent |
| P-19 | Keine Mail an die eingegebene Adresse | Spec Ä-09; Matrix I-05 | Umschlag der 20 SMTP-Mails | bestanden | `RCPT TO` immer nur `vertrieb@example.com` |
| P-20 | Kopfzeilen der Mail verraten nichts über den Besucher außer `Reply-To` | – | Kopfzeilen roh gelesen | bestanden | `Date`, `To`, `From` (Konfiguration), `Reply-To` (eingegebene Adresse), `Subject` (fester Text mit Anliegen), `Message-ID` (Zufall `@<Host aus site_url>`), MIME; kein `X-Mailer`. Die `Received`-Zeilen des Mailanbieters sind hier nicht prüfbar (Abschnitt 9, H-05) |
| P-21 | Transport der Mail verschlüsselt und angemeldet | Spec Ä-11, Ä-23 | Integration | bestanden (bis zum Versandserver) | TLS und Anmeldung im Fänger nachgewiesen; Strecke vom Versandserver zum Vertriebspostfach und Weiterleitungen: Q-08 |
| P-22 | Hinweisseiten (429, 500) und Fehlertexte zeigen keine Eingaben und keine Interna | Spec §9 | Code `App::noticePage`, `AppTest::testDatabaseDownGives500WithoutDetails` | bestanden | feste Texte und `contact_email` aus der Konfiguration |

### 4.3 Rate-Limit

| ID | Anforderung | Fundstelle | Vorgehen | Ergebnis | Beleg |
|---|---|---|---|---|---|
| P-23 | Keine IP-Adresse im Klartext in Datenbank oder Protokoll | Spec Ä-10, Ä-22 | Datenbank und Protokolle nach Absendungen | bestanden | `rate_limit.hash` = 64 Hex-Zeichen bzw. `global`; Integrationstest `testFivePerOriginThen429…OnlyHmacsStored` |
| P-24 | Herkunft nicht aus den gespeicherten Werten rekonstruierbar | Spec Ä-10 („gesalzener Hash … umkehrbar“) | Messung HMAC-Geschwindigkeit; Ort des Schlüssels | **Mangel (gering)**, DS-03 | Schlüssel und Hashes in derselben Datenbank; mit Schlüssel alle IPv4-Adressen in etwa 1,4 h auf einem Kern; ein /64-Präfix ist schwerer, aber bei bekannten Netzen ebenfalls aufzählbar. Rückrechenbar, solange der Schlüssel existiert (bis etwa 24 h) und in jedem Backup, das Schlüssel und Zähler zugleich enthält |
| P-25 | Abgelaufene Zähler werden gelöscht | Spec Ä-22 | Code `RateLimiter::purgeExpired`, Aufruf in `App` und `Purger` | bestanden | Lebensdauer siehe Inventar Nr. 7; setzt für die Obergrenze den Cron voraus |
| P-26 | Schlüssel wird täglich überschrieben, der alte ist danach weg | Spec Ä-22 | Code `RateLimitKey`, `KeyRotationTest` | bestanden | `UPDATE … WHERE day = :old`, kein Verlauf; Backups: Q-07 |
| P-27 | Nur `REMOTE_ADDR` zählt, `X-Forwarded-For` wird nicht gelesen | Spec Ä-10 | Code `Request::fromGlobals`, `RateLimitTest::testOnlyRemoteAddrCounts…` | bestanden | ob `REMOTE_ADDR` beim Hoster die Besucheradresse ist: Abschnitt 9, H-04 |

### 4.4 Protokolle

| ID | Anforderung | Fundstelle | Vorgehen | Ergebnis | Beleg |
|---|---|---|---|---|---|
| P-28 | Anwendungsprotokoll ohne Formularinhalte und ohne IP | Spec §6.4; Matrix D-01 | Protokoll nach Absendungen; Code aller `($this->log)`-Aufrufe | bestanden | nur `lead_stored id=… delivery=…`, `lead_held id=…`, `mail_failed lead=… <Klasse>`, `honeypot`, `rate_limited`, `global_ceiling`, `template_missing <lang>`, `error <Klasse> at <Datei>:<Zeile>`; `AppTest::testLogContainsNoFormContentOrIp` |
| P-29 | Ausgabe von `purge.php`, `retry.php` und damit die Cron-Mail nur mit Anzahlen | `backend/README.md` | Läufe mit Testdaten | bestanden | z. B. `purge leads_deleted=2 … held=1 not_delivered=1 key_rotated=1` und `ACHTUNG: 2 Anfragen sind nicht zugestellt …`; Fehler nur mit Klassenname |
| P-30 | Protokolldateien haben eine Frist | Art. 5 Abs. 1 lit. e (Sichtung) | `docs/deploy.md`, `backend/README.md` | **Mangel (gering)**, DS-04 | `log_path`, `purge.log`, `retry.log` wachsen ohne Rotation; Zeilen mit Zeit und Lead-ID bleiben nach dem Löschen des Leads |
| P-31 | PHP-Fehlerprotokoll des Hosters | – | Code: `lead.php` setzt `error_log` auf `log_path`, sonst Standard des Hosters | offene Frage, Q-03 | die Anwendung schreibt dorthin nur Zeilen wie P-28; Ort und Frist beim Hoster unbekannt |
| P-32 | Apache-Zugriffsprotokoll des Hosters: Inhalt, Frist, Kürzung der IP | Matrix D-12 | außerhalb der Anwendung | offene Frage, Q-03 | – |
| P-33 | Keine Formularinhalte in Adressen (damit nicht im Zugriffsprotokoll) | Spec §6.1 | Zugriffsprotokoll des Testservers (231 Zeilen) | bestanden | Formular nur per POST; einzige Abfrage `?topic=<Anliegen>`; 422 ohne Weiterleitung |

### 4.5 Aufbewahrung und Löschung

| ID | Anforderung | Fundstelle | Vorgehen | Ergebnis | Beleg |
|---|---|---|---|---|---|
| P-34 | Leads werden nach `retention_days` gelöscht | Spec §6.3; Matrix D-07 | Lauf von `purge.php`; `PurgeTest` | offene Frage, Q-05 | Technik bestanden (100 Tage alte `delivered`- und `pending`-Leads gelöscht); Frist 90 Tage nicht bestätigt; fehlt der Schlüssel in `config.php`, gilt still 90 (DS-09) |
| P-35 | `held` und `not_delivered` werden nie automatisch gelöscht und melden sich | Spec Ä-35 | Lauf: Exit-Code 1 und Zeile auf STDERR; nach `retry.php` Exit 0 | offene Frage, Q-05 | Technik bestanden. Folge: unbefristete Speicherung bis zur Erledigung; ein nachgestellter Lead, der älter als die Frist ist, wird beim nächsten Lauf gelöscht (Frist zählt ab `created_at`) |
| P-36 | Kein Lead geht still verloren | Spec Ä-35 | Lauf mit altem `pending`-Lead | **Mangel (gering)**, DS-05 | `pending` (Abbruch zwischen Speichern und Zustellstatus) wird von `retry.php` nicht nachgestellt, von `purge.php` nicht gemeldet und nach Frist gelöscht |
| P-37 | Löschlauf läuft auf dem Hosting | `docs/deploy.md` §2, §6 | – | nicht prüfbar | Cron noch nicht eingerichtet; Abschnitt 9, H-03 |
| P-38 | Backups des Hosters | `vendor-register.md` §5 | – | offene Frage, Q-07 | – |
| P-39 | Verfahren für Auskunft, Berichtigung und Löschung auf Anfrage | Matrix D-08 | Repository durchsucht | **Mangel (gering)**, DS-06 | kein Verfahren dokumentiert; Vorschlag in Abschnitt 7 |

### 4.6 Test- und CI-Daten

| ID | Anforderung | Fundstelle | Vorgehen | Ergebnis | Beleg |
|---|---|---|---|---|---|
| P-40 | Testdaten nur aus reservierten Bereichen (`example.com`, RFC 5737, RFC 3849) | Plan Task 3 | `git grep` | **Mangel (Hinweis)**, DS-07 | fast alles `*@example.com`/`.org`, `example.test`, Dokumentationsnetze; Ausnahmen: `a@b.de` (Unit-Tests der Release- und `security.txt`-Prüfung), `name@firma.de` (`design/leitstand/components/ContactForm/preview.html`), `x.de` (Unit-Tests), `1.2.3.4` (`backend/tests/AppTest.php`). Keine dieser Angaben gehört zu einer Person, an keine geht eine Mail |
| P-41 | Keine echten personenbezogenen Daten im Repository, auch nicht im Verlauf | Plan Task 3 | `git grep`, `git log --all -p` | bestanden | gefunden nur: Anbieterangaben (Firma, Anschrift, `docs/project-brief.md`), Demo-Zugang `demo@reticora.cloud` (F-18), Autorenadressen in Paketmetadaten (`composer.lock`, Vendor-Code im Verlauf), Git-Autoren (Claude; ein Merge-Commit eines Mitglieds des Auftraggebers mit Namen und Adresse als Metadaten). Keine Leads, keine Protokolle, keine Datenbankauszüge |
| P-42 | CI-Artefakte enthalten keine echten personenbezogenen Daten und haben eine Frist | Plan Task 3 | Workflows gelesen | bestanden | Inventar Nr. 13 bis 16: nur Testdaten; 7 bzw. 14 Tage |
| P-43 | Keine Produktionsdaten gelangen zu GitHub | `vendor-register.md` §3 | `deploy.yml`, `remote.sh`, `smoke.sh` | bestanden | der Ablauf liest weder Datenbank noch Protokolle; der Rauchtest sendet nur GET/HEAD und einen POST ohne Rumpf an die geschützte Vorschau (401) und gibt Statuscodes und Kopfzeilen aus; `remote.sh` gibt nur Release-Kennungen aus |

### 4.7 Dritte und Auftragsverarbeitung

| ID | Anforderung | Fundstelle | Vorgehen | Ergebnis | Beleg |
|---|---|---|---|---|---|
| P-44 | Hoster: Vertrag nach Art. 28 DSGVO | Matrix D-05 | – | offene Frage, Q-07 | F-09 |
| P-45 | Mailanbieter (Versandkonto, Vertriebspostfach) benannt | Matrix D-09; `vendor-register.md` §1 | `config.example.php` (nur Beispielwerte) | offene Frage, Q-08 | F-06 |
| P-46 | GitHub erhält nur Quelltext und Testdaten | `vendor-register.md` §3 | P-42, P-43 | offene Frage, Q-09 | Technik bestanden; Bewertung durch den Auftraggeber offen |
| P-47 | npm und Composer nur zum Bau | `vendor-register.md` §3 | `docs/deploy.md` §1 (Paket enthält `vendor/`), `lead.php` | bestanden | zur Laufzeit keine Verbindung zu Paketquellen |
| P-48 | Übergang zur App und Demo | – | Build-Scan | offene Frage, Q-11 | nur Links; was die App verarbeitet, ist nicht Gegenstand |

Zählung (48 Prüfpunkte):

| Ergebnis | Anzahl | Prüfpunkte |
|---|---|---|
| bestanden | 30 | P-01 bis P-09, P-12 bis P-16, P-18 bis P-23, P-25 bis P-29, P-33, P-41 bis P-43, P-47 |
| Mangel | 6 | P-10 (mittel), P-24, P-30, P-36, P-39 (gering), P-40 (Hinweis) |
| offene Frage an den Auftraggeber | 10 | P-17, P-31, P-32, P-34, P-35, P-38, P-44, P-45, P-46, P-48 |
| nicht prüfbar | 2 | P-11, P-37 |

Bei P-17, P-34, P-35 und P-46 ist die Technik geprüft und verhält sich wie
beschrieben; offen ist die Bewertung durch den Auftraggeber.

## 5. Mängel und Vorschläge zur Behebung

| Nr. | Schwere | Mangel | Fundstelle | Vorschlag |
|---|---|---|---|---|
| DS-01 | mittel | Die CI belegt „keine Cookies, kein Storage“ nur für die Startseite (und Cookies im Formularablauf), Service Worker gar nicht, die 404-Seiten und die 422-Seite nicht auf fremde Hosts. Matrix T-01 verlangt den Nachweis auf jeder Seite; T-01 ist eine Go-live-Sperre. | `tests/e2e/privacy.spec.ts` (nur `/`), `tests/e2e/pages.spec.ts:97` (nur Hosts), `tests/e2e/home.spec.ts:219` | `privacy.spec.ts` über dieselbe Liste wie `pages.spec.ts` (`ROUTES`, gebaut, beide Sprachen) plus `/gibt-es-nicht/`, `/en/does-not-exist/` und die 422-Seite (POST ohne JavaScript) schleifen: fremde Hosts (auch `requestfailed`), `Set-Cookie` in jeder Antwort, `context.cookies()`, `localStorage`, `sessionStorage`, `indexedDB.databases()`, `caches.keys()`, `navigator.serviceWorker.getRegistrations()`; nach `networkidle` und `document.fonts.ready`. Läuft in der CI automatisch in allen drei Browsern. `indexedDB.databases()` fehlt in älterem Firefox; dann mit `try` und Vermerk. |
| DS-02 | gering | Kein Test des Builds gegen Vorab-Verbindungen und fremde Ressourcen. Das Ereignis `request` erfasst `dns-prefetch` und `preconnect` nicht; heute ist der Build sauber (P-02, P-03, P-05), eine spätere Änderung fiele aber nicht auf. | `tests/unit/dist.test.ts` | Test über `dist/**/*.{html,css,js}`: kein `<link rel>` mit `preconnect`, `dns-prefetch`, `prefetch`, `prerender`; kein `speculationrules`; kein `src`, `srcset`, `poster`, `data` oder `<link href>` mit Schema oder `//`; kein `url(http`/`url(//` und kein `@import` in CSS; kein `sourceMappingURL`, keine `*.map`. Mit Task 2 (Build-Scan der Sicherheitsprüfung) abstimmen, damit es ihn nur einmal gibt. |
| DS-03 | gering | Die Rate-Limit-Werte sind mit dem Schlüssel aus derselben Datenbank zurückrechenbar (IPv4 in etwa 1,4 h auf einem Kern). Der Schlüssel lebt bis etwa 24 h, obwohl jeder Zähler nur eine Stunde gilt. In Backups liegen Schlüssel und Zähler zusammen. | `backend/src/RateLimitKey.php` (Tag als Gültigkeit), `backend/src/RateLimiter.php::hash` | Schlüssel je Stundenfenster statt je UTC-Tag: Spalte `day` als Fensterbeginn (`RateLimiter::windowStart`) führen und beim ersten Gebrauch eines neuen Fensters überschreiben. Dann ist ein Zähler nur so lange rückrechenbar, wie er ohnehin existiert (höchstens etwa 2 h 17 min), und ein Backup enthält höchstens die Zähler des Fensters seines Schlüssels. Braucht eine Änderung von Spec Ä-10/Ä-22 und Anpassung von `KeyRotationTest`. Unabhängig davon: in der Datenschutzerklärung als pseudonymisierte, nicht als anonyme Daten führen (Q-04). |
| DS-04 | gering | Protokolldateien ohne Frist: `log_path` (Zeit, Ereignis, Lead-ID), `purge.log`, `retry.log` wachsen ohne Rotation. Eine Zeile `lead_stored id=17` bleibt, wenn Lead 17 längst gelöscht ist. | `backend/public/lead.php` (Anhängen an `log_path`), `docs/deploy.md` §2 Schritt 9 (Cron mit `>>`) | `purge.php` kürzt `log_path` auf Zeilen jünger als `retention_days` (Zeilen beginnen mit ISO-Zeit) oder ein zweiter Cron-Eintrag kürzt alle drei Dateien (z. B. monatlich leeren). Frist in `docs/deploy.md` nennen und mit Q-05 entscheiden lassen. |
| DS-05 | gering | Ein Lead mit Status `pending` (Prozess endet zwischen `insert` und `setDelivery`, z. B. Zeitlimit von PHP während des SMTP-Versands) wird weder nachgestellt noch gemeldet und nach Frist gelöscht. Die Besucherin bekommt dann eine Fehlerantwort oder gar keine, der Vertrieb keine Mail; die Daten liegen bis zum Fristablauf ungenutzt in der Datenbank. | `backend/src/Purger.php` (`NOT IN (not_delivered, held)`), `backend/src/LeadRepository.php::undelivered`, `backend/src/Retrier.php` | `pending`, das älter als z. B. 15 Minuten ist, wie `not_delivered` behandeln: in `undelivered()` aufnehmen, in `Purger` von der Löschung ausnehmen und mitzählen; PHPUnit- und Integrationstest mit altem `pending`-Lead. |
| DS-06 | gering | Kein dokumentiertes Verfahren für Auskunft, Berichtigung und Löschung auf Anfrage (Matrix D-08). | – | Vorschlag in Abschnitt 7; nach Prüfung durch den Auftraggeber nach `docs/deploy.md` (Betrieb) übernehmen. |
| DS-07 | Hinweis | Testdaten mit Domains und Adressen außerhalb der reservierten Bereiche (`a@b.de`, `name@firma.de`, `x.de`, `1.2.3.4`). Keine Person betroffen, keine Mail versendet. | `tests/unit/` (Release- und `security.txt`-Prüfung), `design/leitstand/components/ContactForm/preview.html`, `backend/tests/AppTest.php` | durch `a@example.com`, `name@example.com`, `example.org`, `192.0.2.4` ersetzen. |
| DS-08 | Hinweis | Überholte Aussagen in Quellen, aus denen die Datenschutzerklärung leicht abgeschrieben wird: Spec §6.2 nennt eine Bestätigungsmail an die anfragende Person (aufgehoben durch Ä-09), Spec §6.3 einen täglichen Löschlauf und 24 h für Zähler (aufgehoben durch Ä-22), `content-plan.md` §9 eine Zeitfalle (aufgehoben durch Ä-07). | `docs/specs/2026-11-12-website-spec.md` §6.2, §6.3; `docs/content-plan.md` §9 | Fakten für die Datenschutzerklärung nur aus Abschnitt 8 dieses Protokolls nehmen; in Spec und Inhaltsplan einen Verweis auf §14 setzen (Task 6). `vendor-register.md` §5 ist in dieser Prüfung berichtigt. |
| DS-09 | Hinweis | `retention_days` ist kein Pflichtschlüssel; fehlt er in `config.php`, gilt still 90 Tage, obwohl die Frist nicht entschieden ist. | `backend/src/Config.php::fromArray`, `backend/bin/purge.php` | `retention_days` zur Pflicht machen (wie `site_url`), Grenzen festlegen; `config.example.php` behält den Vorschlag mit Kommentar. |

## 6. Fragen an den Auftraggeber und seine Rechtsberatung

Jede Frage nennt die Fakten aus diesem Protokoll, die für die Antwort nötig
sind. Die Bewertung liegt beim Auftraggeber.

| Nr. | Frage | Fakten |
|---|---|---|
| Q-01 | Wer ist Verantwortlicher, wie ist er erreichbar, und gibt es eine datenschutzbeauftragte Person? | Anbieter laut F-01: Koyer Consulting für IT und Kommunikation UG (haftungsbeschränkt), Trostberg; Geschäftsführung, E-Mail und Telefon fehlen; F-17 offen. |
| Q-02 | Auf welche Rechtsgrundlage stützt sich die Verarbeitung der Kontaktanfragen, und braucht das Formular einen weiteren Hinweis oder ein Häkchen? | B2B-Formular, fünf Felder (Abschnitt 4, P-13), Zweck Beantwortung, kein Newsletter, keine Weitergabe außer an Mailanbieter und Hoster; Hinweis am Formular ist ein Platzhalter (`kontakt-verarbeitung`). |
| Q-03 | Welche Zugriffs- und Fehlerprotokolle führt der Hoster (Felder, Frist, Kürzung der IP), lässt sich das im Panel einstellen, und auf welche Rechtsgrundlage stützen sie sich? | Inventar Nr. 1, 10; die Anwendung legt keine personenbezogenen Daten in Adressen (P-33); ihr eigenes Protokoll enthält keine IP (P-28). |
| Q-04 | Wie sind die Rate-Limit-Werte einzuordnen, und auf welche Rechtsgrundlage stützen sie sich? Soll der Schlüssel stündlich statt täglich wechseln (DS-03)? | Inventar Nr. 7, 8; P-24: mit dem Schlüssel rückrechenbar; Zähler höchstens etwa 2 h 17 min, Schlüssel bis etwa 24 h 17 min, länger ohne Cron und in Backups. |
| Q-05 | Welche Frist gilt für Anfragen in der Datenbank (`retention_days`, Vorschlag 90 Tage)? Ist es zulässig, dass `held`- und `not_delivered`-Anfragen bis zur Erledigung unbefristet bleiben? Welche Frist gilt für Protokolldateien (DS-04)? | P-34, P-35, P-36; die Frist zählt ab Eingang; Datenbank und Postfach sind getrennte Kopien; nach Erledigung wird ein alter Lead beim nächsten stündlichen Lauf gelöscht. |
| Q-06 | Wie lange bleiben Anfragen im Vertriebspostfach, wer hat Zugriff, werden sie in ein CRM übernommen, und an welche Adresse gehen die Cron-Mails? | Inventar Nr. 6, 11; F-06. Die Cron-Mails enthalten nur Anzahlen. |
| Q-07 | Ist der Vertrag nach Art. 28 DSGVO mit Hetzner geschlossen, und wie lange hält Hetzner Backups von Webspace und Datenbank? | Inventar Nr. 5, 7, 8, 10, 12; F-09; gelöschte Leads bleiben bis zum Ablauf der Backups. |
| Q-08 | Bei welchem Anbieter liegen Versandkonto und Vertriebspostfach, wo stehen die Server, wird weitergeleitet (auch in Drittländer), und ist die Strecke vom Versandserver zum Postfach verschlüsselt? | Inventar Nr. 6; P-21: TLS und Anmeldung bis zum Versandserver geprüft; `config.example.php` enthält nur Beispielwerte. |
| Q-09 | Wie bewertet der Auftraggeber GitHub (Repository, Actions, Artefakte)? | P-41 bis P-43: keine Besucherdaten, nur Quelltext und Testdaten; Artefakte 7 bzw. 14 Tage; Ort der Runner nicht festgelegt. |
| Q-10 | Welchen Text bekommen der Hinweis am Formular und die Datenschutzerklärung? | Platzhalter `kontakt-verarbeitung`, `privacy` (`src/views/Legal.astro`); Faktenliste in Abschnitt 8. |
| Q-11 | Wie verweist die Website auf die Datenverarbeitung der App und der Demo? | Inventar Nr. 18: nur Links; der Browser sendet als Referrer die Origin der Website. |
| Q-12 | Wer führt die Verarbeitungen „Website-Betrieb“ und „Kontaktanfragen“ im Verzeichnis nach Art. 30 DSGVO, und wer bearbeitet Anfragen nach Art. 15 bis 21 (Abschnitt 7)? | Matrix D-04, D-08; F-14. |

## 7. Vorschlag: Vorgehen bei Auskunft, Berichtigung und Löschung

Dies ist ein technischer Vorschlag für den Betreiber, keine Rechtsauskunft.
Fristen, Form der Antwort und Identitätsprüfung legt der Auftraggeber fest
(Q-12). Die Anweisungen beziehen sich auf `backend/sql/001_init.sql`.

**Wo es Daten zu einer Person geben kann:**

| Ort | Suche möglich? |
|---|---|
| Tabelle `lead` | ja, über `email` (und `name`, `company`) |
| Vertriebspostfach, Versandkonto, CRM | ja, im Mailprogramm; außerhalb der Website |
| Tabellen `rate_limit`, `rate_limit_key` | nein: keine Adresse gespeichert, Zuordnung nur mit IP und Schlüssel desselben Tages möglich, Werte nach höchstens etwa einem Tag weg |
| Anwendungsprotokoll, `purge.log`, `retry.log` | nur Lead-IDs: nach der ID aus `lead` suchen |
| Zugriffsprotokolle und Backups des Hosters | über den Hoster |

**Verbindung:** per SSH (Port 222) auf dem Hosting-Konto, Zugangsdaten aus
`~/reticora-config/config.php`; das Passwort nie auf der Befehlszeile
übergeben:

```
mariadb -h <host aus db.dsn> -u <db.user> -p <dbname aus db.dsn>
```

**Auskunft (Art. 15):**

```sql
SELECT id, created_at, lang, name, email, company, topic, message, delivery
FROM lead
WHERE LOWER(email) = LOWER('person@example.com')
ORDER BY created_at;
```

Ohne Treffer zusätzlich nach Namen suchen (Treffer vor der Auskunft auf
Zugehörigkeit prüfen):

```sql
SELECT id, created_at, email, company FROM lead WHERE name LIKE '%Nachname%';
```

`created_at` ist UTC. `topic` ist ein Schlüssel (`demo` = Vorführung,
`enterprise`, `security` = Sicherheit und Datenschutz, `other` = Sonstiges).
Ausgabe als Datei: `mariadb … --batch -e "<SELECT …>" > auskunft.tsv`, die
Datei nach dem Versand löschen. Danach Protokolle nach den IDs durchsuchen
(`grep -E 'id=(17|23)( |$)|lead=(17|23) ' ~/reticora-config/lead.log`).

**Berichtigung (Art. 16):**

```sql
UPDATE lead SET email = 'neu@example.com' WHERE id = 17;
```

**Löschung (Art. 17):** zuerst prüfen, dann löschen, dann prüfen.

```sql
SELECT id, created_at, delivery FROM lead WHERE LOWER(email) = LOWER('person@example.com');
DELETE FROM lead WHERE id IN (17, 23);
SELECT COUNT(*) FROM lead WHERE LOWER(email) = LOWER('person@example.com');
```

Steht ein Lead auf `held` oder `not_delivered`, gibt es davon keine Mail
im Postfach; vor dem Löschen klären, ob die Anfrage noch beantwortet werden
soll. Mails im Vertriebspostfach und im CRM getrennt löschen. Kopien in
Backups des Hosters verschwinden erst mit deren Ablauf (Q-07). Zeilen im
Anwendungsprotokoll enthalten nur IDs; sie verlieren mit dem Löschen des
Leads den Bezug.

**Testanfragen nach der Abnahme (Phase 8):** die IDs der Testanfragen beim
Absenden notieren und gezielt löschen (`DELETE FROM lead WHERE id IN (…)`),
nicht über Muster in `email`.

**Nachweis:** Datum, Anliegen und erledigte Schritte außerhalb des
Repositorys festhalten, ohne die Daten selbst zu kopieren.

## 8. Fakten für die Datenschutzerklärung (kein Text)

Stand dieses Builds. Was offen ist, ist als offen markiert.

1. **Verantwortlicher:** Koyer Consulting für IT und Kommunikation UG
   (haftungsbeschränkt), Dr. Albert-Frank-Str. 2, 83308 Trostberg;
   Vertretung, E-Mail, Telefon offen (F-01). Datenschutzbeauftragte
   Person: offen (F-17).
2. **Hosting:** Webspace, PHP und MariaDB bei Hetzner Online GmbH,
   Gunzenhausen; Standort laut Anbieter Deutschland (unbestätigt); Vertrag
   nach Art. 28 offen (F-09).
3. **Server-Protokolle:** führt der Hoster; Felder, Frist und Kürzung offen
   (Q-03). Die Website setzt keine personenbezogenen Daten in Adressen.
4. **Keine Cookies, kein Web Storage, keine IndexedDB, kein Service
   Worker, keine Reichweitenmessung, keine Profile, keine Inhalte oder
   Schriften von fremden Servern, kein Captcha eines Dritten** (Abschnitt 4,
   P-01 bis P-08). Darstellung und Sprache werden nicht gespeichert.
5. **Kontaktformular:** Name, geschäftliche E-Mail-Adresse, Unternehmen,
   Anliegen (Pflicht), Nachricht (freiwillig); dazu die Sprache der Seite
   und die Eingangszeit. Nicht gespeichert: IP-Adresse, Nutzeragent,
   Referrer. Zweck: Beantwortung. Rechtsgrundlage: offen (Q-02).
6. **Empfänger:** ausschließlich das Vertriebspostfach des Anbieters (eine
   Mail je Anfrage, Antwortadresse = eingegebene Adresse); Mailanbieter und
   Standort offen (Q-08). Keine Mail an die anfragende Person; den Eingang
   bestätigt die Dankeseite.
7. **Speicherung der Anfragen:** Datenbank beim Hoster; automatische
   Löschung nach `retention_days` ab Eingang (Vorschlag 90 Tage, offen,
   Q-05); nicht zugestellte oder wegen sehr vieler Anfragen zurückgehaltene
   Anfragen bleiben bis zur Zustellung oder Bearbeitung (ebenso eine
   Anfrage, deren Versand abgebrochen ist, Spec Ä-41); höchstens
   `rate_limit.held_max` zurückgehaltene Anfragen (Ä-38). Kopie im Postfach
   nach Regel des Vertriebs (Q-06). Backups des Hosters (Q-07).
8. **Missbrauchsschutz:** Köderfeld; Zählung der Anfragen je Herkunft und
   Stunde über einen HMAC der IP-Adresse (IPv6 gekürzt auf /64, zusätzlich
   /48) mit einem zufälligen Schlüssel, der je Stundenfenster überschrieben
   wird (Spec Ä-36, nach DS-03); Zähler und Schlüssel nach höchstens etwa
   zwei Stunden gelöscht; solange sie bestehen, mit dem Schlüssel
   rückrechenbar, also pseudonymisiert (Q-04). Obergrenze für alle
   Anfragen je Stunde.
9. **Protokoll der Anwendung:** Ereignisse und Lead-IDs, keine
   Formularinhalte, keine IP-Adressen; eine Datei je Tag, gelöscht nach
   `retention_days` (Spec Ä-40, nach DS-04), ebenso die Ausgaben der
   Cronjobs; die Frist selbst ist offen (Q-05).
10. **Übermittlung in Drittländer:** durch die Website selbst keine;
    Mailpostfach offen (Q-08).
11. **Links zur App und Demo** (`www.reticora.cloud`,
    `www.demo.reticora.cloud`): erst beim Klick, eigener Dienst (Q-11).
12. **Rechte** nach Art. 15 bis 21 DSGVO und Beschwerderecht: Text liefert
    der Auftraggeber; Verfahren `docs/betrieb-anfragen.md` (aus Abschnitt 7).
13. **Meldeadresse für Sicherheitslücken** (`/.well-known/security.txt`):
    entsteht erst, wenn `SITE.securityContact` gesetzt ist (Ä-25); derzeit
    keine Datei.
14. **Barrierefreie Kontaktmöglichkeit, Impressum:** außerhalb dieser
    Prüfung.

## 9. Prüfungen auf dem Hosting (Phase 8)

| Nr. | Prüfung | Zweck |
|---|---|---|
| H-01 | Im Panel Format, Frist und Kürzung der Zugriffs- und Fehlerprotokolle ablesen, kürzeste Frist und IP-Kürzung einstellen, falls möglich; Bildschirmfoto ablegen | Q-03, Matrix D-12 |
| H-02 | `log_path` in `config.php` setzen; prüfen, dass `lead.php` dorthin und nicht ins Fehlerprotokoll des Hosters schreibt | P-31 |
| H-03 | Cron `purge.php` und `retry.php` eingerichtet; nach einer Stunde Zeile in `purge-JJJJ-MM-TT.log`; mit einem absichtlich alten `held`-Testlead prüfen, dass die Cron-Mail kommt und nur Anzahlen enthält; danach Testlead löschen (Abschnitt 7) | P-35, P-37 |
| H-04 | `REMOTE_ADDR` ist die Besucheradresse (`docs/deploy.md` §6 Punkt 5) | P-27 |
| H-05 | Testanfrage an das echte Vertriebspostfach: alle Kopfzeilen beim Empfang ablesen (`Received` enthält die Adresse des Webservers, nicht die des Besuchers), TLS zwischen Versandserver und Postfach, keine Weiterleitung | P-20, P-21, Q-08 |
| H-06 | Netzwerkprüfung aus Abschnitt 2 gegen `https://www.reticora.de` wiederholen (alle Seiten, 404, Formular): keine fremden Hosts und vor allem **kein `Set-Cookie` des Hosters** (manche Hoster setzen Cookies für Lastverteilung oder Schutzfunktionen) | P-01, P-06 |
| H-07 | `retention_days` in `config.php` setzen, sobald Q-05 entschieden ist (seit Ä-42 Pflicht: ohne Wert startet nichts) | P-34, DS-09 |
| H-08 | `config.preview.php` mit eigener Datenbank und Test-Postfach anlegen, sonst landen Tests aus der Vorschau in der echten Datenbank (`docs/deploy.md` §2 Schritt 7) | Inventar Nr. 5 |
| H-09 | Testanfragen der Abnahme nach ID löschen | Abschnitt 7 |
| H-10 | Backup-Frist des Hosters für Webspace und Datenbank ablesen | Q-07 |

## 10. Behoben in Phase 7

Behoben im Zweig `claude/phase-7-qa` nach den Entscheidungen des Auftraggebers vom 2026-11-18 (DS-03 stündlicher Schlüssel,
DS-04 Tagesprotokolle mit Löschung nach `retention_days`). Jede Verhaltensänderung hat zuerst einen scheiternden Test bekommen.
Spec-Einträge: §14 Ä-36, Ä-40 bis Ä-43, Ä-46. Die offenen Fragen Q-01 bis Q-12 und die Prüfungen H-01 bis H-10 auf dem Hosting
bleiben offen.

| Nr. | Behoben in Phase 7 | Umsetzung | Nachweis | Rest |
|---|---|---|---|---|
| DS-01 | `0314714` | `tests/e2e/privacy.spec.ts` über jede gebaute Seite beider Sprachen (`ROUTES`, Status „gebaut“), `/gibt-es-nicht/`, `/en/does-not-exist/` und die 422-Seite (Absenden ohne JavaScript): fremde Hosts (`request` und `requestfailed`), `Set-Cookie` in jeder Antwort, `context.cookies()`, `localStorage`, `sessionStorage`, `indexedDB.databases()` (fehlt die Funktion, Vermerk statt Erfolg), `caches.keys()`, Service-Worker-Registrierungen und -Steuerung, CSP-Verstöße; nach `networkidle` und `document.fonts.ready`. Läuft in der CI in Chromium, Firefox und WebKit; `pages.spec.ts` prüft dort nur noch Konsolenfehler (keine doppelte Host-Prüfung). | lokal Chromium: 46 Tests bestanden (42 gebaute Seiten, 2 × 404, 422, dazu ein Zähltest); Firefox und WebKit nur in der CI (lokal nicht installierbar) | H-06 (Cookie des Hosters) |
| DS-02 | `0314714` | Ein Test über `dist/` (`tests/unit/dist.test.ts`, übersprungen ohne `dist/` wie die anderen): kein `<link rel>` mit `preconnect`, `dns-prefetch`, `prefetch`, `prerender`; kein `speculationrules`; kein `src`, `srcset`, `poster`, `data`, `formaction` und kein `<link href>` (außer `canonical`/`alternate`) mit Schema oder `//`; kein `url(http…)`/`url(//…)` und kein `@import` in CSS; kein `sourceMappingURL`, keine `*.map`. Mit Gegenproben für jedes Muster. Ersetzt die Einzelsuchen beider Protokolle (Sicherheit B-01/B-02); das Paket prüft Source-Maps zusätzlich (`deploy-package.test.ts`). | `tests/unit/dist.test.ts` (12 Gegenproben, eine Positivprobe, Prüfung des Builds) | – |
| DS-03 | `94a44c2` | Schlüssel je Stundenfenster: `rate_limit_key.window_start` statt `day`, Wechsel beim ersten Gebrauch eines neuen Fensters (Anfrage oder `purge.php`, nur wenn noch das alte Fenster drinsteht). `sql/002_rate_limit_key_hourly.sql` stellt bestehende MariaDB-Tabellen idempotent um; `Database::migrate` spielt alle `NNN_*.sql` der Reihe nach ein. | `AppTest::testRateLimitKeyIsRandomAndOverwrittenHourly`, `PurgerTest::testPurgeOverwritesTheKeyOncePerHourEvenWithoutTraffic`, Integration (MariaDB 10.11): `KeyRotationTest` (stündlich, zwei Verbindungen), `MigrationTest::testTableFromTheFirstSchemaGetsTheHourlyKeyColumn` | Einordnung als pseudonyme Daten und Rechtsgrundlage: Q-04 |
| DS-04 | `94a44c2` (Code), `0314714` (Runbook) | `LogFiles::daily`: aus `log_path` `…/lead.log` wird `…/lead-JJJJ-MM-TT.log` (UTC), auch für das PHP-Fehlerprotokoll von `lead.php`. `purge.php` löscht Tagesdateien `lead-`, `purge-`, `retry-…` im Ordner von `log_path`, deren Tag vor `retention_days` liegt (`logs_deleted=` in der Ausgabe); andere Dateien bleiben. Runbook: Cron-Ausgaben als `purge-$(date -u +%F).log` und `retry-…`. | `LogFilesTest`, `PurgerTest::testPurgeScriptDeletesDailyLogFilesOlderThanTheRetention`, `EntryPointTest::testEventsAreWrittenToADailyLogFile` | Frist selbst offen (Q-05); Cron-Zeile im Panel des Hosters prüfen (H-03) |
| DS-05 | `94a44c2` | `pending`, älter als 15 Minuten (`LeadRepository::STALE_PENDING`), zählt als nicht zugestellt: `undelivered()` nimmt es auf (`retry.php` stellt zu, bei Fehler `not_delivered`), `purge.php` löscht `pending` nie und meldet hängengebliebene mit Exit 1 (`pending=` in der Ausgabe). | `RetrierTest::testPendingOlderThan15MinutesIsDeliveredLikeNotDeliveredButFreshPendingIsLeftAlone`, `testStalePendingThatFailsBecomesNotDelivered`, `PurgerTest::testNeverDeletesHeldOrNotDeliveredLeadsHoweverOld`, `testFreshPendingIsNeitherDeletedNorAnAlarm`, `testPurgeScriptExitsWith1WhileUndeliveredLeadsExist`; Integration: `PurgeTest` (altes `pending` bleibt, Exit 1), `testStalePendingIsDeliveredByRetryAndFreshPendingIsLeftAlone` | – |
| DS-06 | `0314714` | `docs/betrieb-anfragen.md` aus Abschnitt 7, angepasst an den stündlichen Schlüssel und die Tagesprotokolle; verlinkt aus `docs/deploy.md` §6 und `backend/README.md`. | Dokument | Zuständigkeit, Fristen, Identitätsprüfung: Q-12 |
| DS-07 | `94a44c2` | `a@b.de` → `a@example.com`, `x.de` → `example.org`, `cdn.x` → `cdn.example.org` (Unit-Tests der Release-, `security.txt`- und Sitemap-Prüfung), `name@firma.de` → `name@example.com` (`design/…/ContactForm/preview.html`), `1.2.3.x` → `192.0.2.x` (`AppTest`). | `git grep` ohne Treffer | – |
| DS-08 | `0314714` | Spec §6.2 und §6.3 tragen je einen Verweis auf den geltenden Stand, Spec §14 Ä-43 fasst ihn zusammen (keine Bestätigungsmail, stündlicher Schlüssel und Löschlauf, Zähler höchstens etwa zwei Stunden, Ausnahmen der Löschung, Tagesprotokolle); `content-plan.md` §9 verweist auf den Wegfall der Zeitfalle (Ä-07) und auf Abschnitt 8 dieses Protokolls. Die freigegebenen Abschnitte selbst sind nicht umgeschrieben. | Dokumente | – |
| DS-09 | `94a44c2` | `Config::fromArray` verlangt `retention_days` als ganze Zahl 1–3650, sonst `InvalidArgumentException` mit „'retention_days' fehlt oder ist ungültig (ganze Zahl von Tagen, 1–3650)“: Formular 500, Cronjobs Exit 1. `purge.php` nutzt `Config::retentionDays()` (kein stiller Standard mehr). | `ConfigTest::testRetentionDaysIsRequiredAndBounded` (fehlt, 0, negativ, 3651, Text, Kommazahl, leer), `testRetentionDaysIsReadAsGiven`, `testRequiredKeysAndSections` | Frist: Q-05 |

