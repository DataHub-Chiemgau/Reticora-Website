# Technische Spezifikation – Website für Reticora CMDB

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Freigegeben vom Auftraggeber am 2026-11-12** (`project-brief.md` W-E11). Änderungen nach der Freigabe stehen in §14. |
| Geltung | beschreibt, was gebaut wird und wie es geprüft wird. Inhalte, Gestaltung und Rechtliches stehen in den sechs Dokumenten unter `docs/`; diese Spezifikation verweist darauf und wiederholt sie nicht. |

## 1. Ziel und Abgrenzung

Gebaut wird die Marketing-Website `www.reticora.de` in Deutsch und Englisch:
statische Seiten, ein Kontaktformular mit kleinem Server-Teil, lauffähig auf
Hetzner Webhosting L.

Zum Umfang gehören die Seiten aus `content-plan.md` §2, die Bausteine aus
`design-system.md` §5, das Lead-Backend, Tests, CI und ein von Hand
freigegebener Deploy.

Nicht zum Umfang gehören: Änderungen an der App (Signup, Sprache per URL,
B2B-Abfrage; siehe F-20, F-21), Rechtstexte, echte Screenshots, Blog,
Newsletter, Reichweitenmessung, CRM-Anbindung.

## 2. Aufbau im Repository

```
(Wurzel des privaten Repositorys)
├── docs/                     Dokumente (diese Spezifikation unter specs/)
├── astro.config.ts           Ausgabe static, i18n, Sitemap
├── package.json              Skripte: dev, build, check, test, test:e2e
├── src/
│   ├── styles/tokens.css     Tokens beider Themen (aus design-system.md §3)
│   ├── styles/base.css       Grundstile, Schriften, Fokus
│   ├── layouts/              Leitstand.astro, Dokument.astro
│   ├── components/           ein Ordner je Baustein aus design-system.md §5
│   ├── islands/              impact.ts (Ausfallsimulation), copy.ts, form.ts
│   ├── content/              Seiteninhalte je Sprache (Markdown mit Frontmatter)
│   ├── data/                 site.ts, links.ts, pricing.ts, devices.ts,
│   │                         claims.ts, screenshots.ts, topology.ts
│   ├── i18n/                 de.ts, en.ts (Texte der Bausteine), routes.ts
│   └── pages/                Routen für Deutsch und /en/
├── public/                   .htaccess, fonts/, favicon, robots.txt,
│                             .well-known/security.txt
├── backend/
│   ├── public/api/lead.php   einziger Einstiegspunkt
│   ├── src/                  Validator, RateLimiter, LeadRepository, Mailer
│   ├── config/config.example.php
│   ├── migrations/001_init.sql
│   ├── bin/purge.php         Löschlauf für den Cronjob
│   └── tests/                PHPUnit
└── tests/                    Playwright: pages, a11y, privacy, forms, budget
```

Jede Einheit hat genau eine Aufgabe und eine schmale Schnittstelle:

| Einheit | Aufgabe | hängt ab von |
|---|---|---|
| `data/*.ts` | typisierte Fakten an genau einer Stelle (Preise, Links, Claims, Screenshots, Geräte) | nichts |
| `components/*` | Darstellung eines Bausteins | Tokens, `i18n` |
| `content/*` | Text der Seiten | Bausteine über Namen |
| `islands/impact.ts` | rechnet die Ausfallsimulation im Browser | Markup von `TopologyStage` |
| `backend/src/Validator` | prüft Eingaben, kennt weder Datenbank noch Mail | nichts |
| `backend/src/RateLimiter` | zählt Anfragen je Herkunft | Datenbank |
| `backend/src/LeadRepository` | speichert und löscht Anfragen | Datenbank |
| `backend/src/Mailer` | sendet zwei E-Mails | SMTP |

## 3. Seiten, Sprachen, Adressen

- Deutsch ohne Präfix, Englisch unter `/en/`. Jede Seite gibt es in beiden
  Sprachen; ein Test bricht ab, wenn ein Gegenstück fehlt.
- Englische Adressen sind übersetzt (`/en/pricing/`, `/en/security/`);
  `i18n/routes.ts` ordnet die Paare zu und speist `hreflang` und die
  Sprachwahl.
- Alle Adressen enden mit Schrägstrich. `.htaccess` leitet die Form ohne
  Schrägstrich und `http` dauerhaft um. Keine Umleitung nach
  Browser-Sprache.
- Kanonische Adresse, `hreflang` (de, en, x-default), `sitemap.xml`,
  `robots.txt`; `/kontakt/danke/` und `/en/contact/thanks/` sind `noindex`.
- Ziele außerhalb der Website stehen nur in `data/links.ts`:
  Registrierung `https://www.reticora.cloud/onboarding`, Anmeldung
  `https://www.reticora.cloud/login`, Demo `https://www.demo.reticora.cloud`.
- Die Seiten `/impressum/`, `/datenschutz/`, `/agb/`, `/subprozessoren/`
  nutzen das Layout `Dokument` und zeigen, solange der Text des Anbieters
  fehlt, einen deutlich gekennzeichneten Platzhalter. Der Build für den
  Go-live bricht ab, wenn ein Platzhalter übrig ist.

## 4. Inhalte und Daten

| Datei | Inhalt | Prüfung beim Build |
|---|---|---|
| `data/site.ts` | Firmierung, Anschrift, Kontakt | Pflichtfelder gefüllt (Go-live) |
| `data/pricing.ts` | Tarife, Preise, Beta-Rabatt, Zusatzkosten (`content-plan.md` §6.1) | Beta-Jahrespreis = Jahrespreis × 0,9 |
| `data/claims.ts` | Claim-Register (`content-plan.md` §7) mit Status `offen` oder `geprüft`, Name, Datum | jeder `Beleg` verweist auf einen Eintrag; Go-live nur mit `geprüft` |
| `data/screenshots.ts` | Manifest S-01 bis S-18 mit Motiv, Maß, Datei | Go-live nur ohne offenen Platzhalter |
| `data/devices.ts` | Geräteklassen aus `collector/profiles` | – |
| `data/topology.ts` | Knoten, Beziehungen und Ausgangszustand des Netzschemas | Ergebnis der Rechenregeln gegen die Tabelle in `design-system.md` §6.2 |

Zwei Build-Arten: `build` (Entwicklung, Platzhalter erlaubt, Seite trägt
`noindex`) und `build:release` (bricht bei offenem Claim, Platzhalter oder
fehlender Pflichtangabe ab).

## 5. Darstellung

- Tokens und Bausteine nach `design-system.md`. Tailwind liest die Tokens als
  CSS-Variablen; Bausteine nutzen nur semantische Namen.
- Schriften: zwei WOFF2-Dateien unter `public/fonts/`, auf die genutzten
  Zeichen gekürzt, `font-display: swap`, Archivo vorab geladen. Die
  Lizenztexte liegen daneben.
- JavaScript: Standard keines. Drei Inseln ohne Framework, jede lädt nur auf
  Seiten, die sie brauchen:

| Insel | Aufgabe | ohne JavaScript | Budget |
|---|---|---|---|
| `impact.ts` | Ausfallsimulation | Standbild im Ausgangszustand | 8 KB |
| `copy.ts` | Kopierknopf am Code | Knopf fehlt | 1 KB |
| `form.ts` | Senden ohne Seitenwechsel, Fehler am Feld | normales Absenden, Antwortseite | 3 KB |

- Bilder über `astro:assets` (AVIF und WebP, feste Maße). `ScreenshotSlot`
  liest das Manifest und zeigt Bild oder Platzhalter.
- Kein Inline-Skript und kein Inline-Stil im ausgelieferten HTML, damit die
  Content-Security-Policy ohne `unsafe-inline` auskommt (§8).

## 6. Lead-Backend

### 6.1 Vertrag

`POST /api/lead.php`, `Content-Type: application/x-www-form-urlencoded`.

| Feld | Regel |
|---|---|
| `name` | Pflicht, 1–200 Zeichen |
| `email` | Pflicht, gültige Adresse, höchstens 254 Zeichen |
| `company` | Pflicht, 1–200 Zeichen |
| `topic` | Pflicht, einer von `demo`, `enterprise`, `security`, `other` |
| `message` | freiwillig, höchstens 4000 Zeichen |
| `lang` | `de` oder `en` |
| `website` | Köderfeld, muss leer sein |
| `ts`, `sig` | Zeitstempel der Seite und dessen HMAC; Alter zwischen 3 Sekunden und 2 Stunden |

Steuerzeichen und Zeilenumbrüche in einzeiligen Feldern werden abgelehnt.
Anfragen über 16 KB, mit fremder `Origin` oder anderer Methode werden
abgelehnt.

Antworten:

| Fall | mit `Accept: application/json` | sonst |
|---|---|---|
| angenommen | `200 {"ok":true}` | `303` nach `/kontakt/danke/` bzw. `/en/contact/thanks/` |
| Eingabefehler | `422 {"ok":false,"errors":{feld:code}}` | `303` zurück zum Formular mit Fehlercodes in der Adresse (keine Eingaben in der Adresse) |
| zu viele Anfragen | `429` mit `Retry-After` | Hinweisseite |
| Köderfeld gefüllt oder Zeitfalle | wie „angenommen“, ohne Speichern und Senden | wie „angenommen“ |
| Serverfehler | `500 {"ok":false}` | Hinweisseite mit direkter Kontaktadresse |

Weiterleitungsziele sind fest im Code; keine Adresse stammt aus der Anfrage.

### 6.2 Ablauf

1. Methode, Größe, `Origin` prüfen.
2. Rate-Limit: höchstens 5 Anfragen je Herkunft und Stunde. Gespeichert wird
   ein HMAC der IP-Adresse mit täglich wechselndem Schlüssel, nie die Adresse
   selbst.
3. Eingaben prüfen (`Validator`).
4. Anfrage in MariaDB speichern (`LeadRepository`, vorbereitete Anweisungen).
5. E-Mail an das Vertriebspostfach und Bestätigung an die anfragende Person
   senden (`Mailer`, SMTP mit Anmeldung; Kopfzeilen aus festen Werten;
   Pflichtangaben des Anbieters in der Signatur). Schlägt der Versand fehl,
   bleibt die Anfrage gespeichert und trägt den Vermerk „nicht zugestellt“;
   der Löschlauf meldet solche Einträge.
6. Antwort.

### 6.3 Daten und Löschung

Tabelle `lead` (ID, Zeit, Sprache, die fünf Formularfelder, Zustellstatus)
und Tabelle `rate_limit` (Hash, Zeitfenster, Zähler). `bin/purge.php` läuft
täglich als Cronjob: löscht Leads nach der vom Auftraggeber festgelegten
Frist (Vorschlag 90 Tage) und Rate-Limit-Einträge nach 24 Stunden. Das
Protokoll enthält nur Anzahlen.

### 6.4 Konfiguration und Geheimnisse

`config.php` liegt außerhalb des Webroots und enthält Datenbankzugang,
SMTP-Zugang, Empfängeradresse und den HMAC-Schlüssel. Im Repository liegt
nur `config.example.php`. Fehlerausgabe im Browser ist aus; Fehler gehen in
ein Protokoll ohne Formularinhalte.

## 7. Datenschutz

- Keine Anfragen an fremde Hosts, keine Cookies, kein Web Storage, keine
  Messung (`compliance-matrix.md` T-01, `vendor-register.md` §6).
- Thema und Sprache werden nicht gespeichert: Marketingseiten sind immer
  dunkel, die Sprache steht in der Adresse.
- Das Formular fragt fünf Angaben ab (`content-plan.md` §9).

## 8. Sicherheit

`.htaccess` setzt für alle Antworten:

| Kopfzeile | Wert |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000` (ohne `preload`, bis alle Subdomains geklärt sind) |
| `Content-Security-Policy` | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | alle Gerätefunktionen aus |
| `Cross-Origin-Opener-Policy` | `same-origin` |

Dazu: Verzeichnislisten aus, Zugriff auf `backend/` außer `public/api/`
gesperrt, Dateien mit Hash im Namen ein Jahr im Cache, HTML ohne Cache,
Komprimierung, eigene 404-Seite.

Abhängigkeiten: Lockfile, `npm audit` und Prüfung der PHP-Abhängigkeiten im
CI. Der Build wird auf fremde Hosts, Quelltext-Karten und Geheimnisse
durchsucht.

## 9. Fehlerfälle

| Fall | Verhalten |
|---|---|
| Seite nicht gefunden | 404-Seite im Layout der Sprache mit Links zur Startseite, zu Kontakt, Impressum und Datenschutz |
| JavaScript aus | alle Inhalte lesbar, Menü und Beleg funktionieren, Formular sendet, Netzschema als Standbild |
| Schrift lädt nicht | Systemschrift aus der Ersatzliste; Layout bleibt stabil |
| Versand der E-Mail scheitert | Anfrage ist gespeichert; Besucher sieht die Bestätigung; Vermerk für den Betreiber |
| Datenbank nicht erreichbar | Hinweisseite mit direkter Kontaktadresse; nichts geht verloren, weil nichts angenommen wurde |
| Screenshot fehlt | Platzhalter in endgültiger Größe |

## 10. Tests

| Ebene | Werkzeug | prüft |
|---|---|---|
| Daten | Vitest | Preise (Beta-Rechnung), Sprachpaare, Claims, Rechenregeln des Netzschemas gegen `design-system.md` §6.2 |
| PHP | PHPUnit | Validator (Grenzwerte, Steuerzeichen, Kopfzeilen-Einschleusung), Rate-Limit, Löschlauf |
| Seiten | Playwright, 360 / 768 / 1280 px, Chromium, Firefox, WebKit | jede Seite lädt, eine `h1`, kein waagerechtes Scrollen, Pflichtlinks, Sprachwechsel |
| Barrierefreiheit | `@axe-core/playwright` auf jeder Seite in beiden Themen; Tastaturtests für Menü, Beleg, Ausfallsimulation, Formular | keine Befunde; dazu manuelle Prüfung nach Liste |
| Datenschutz | Playwright-Netzwerktest | null fremde Hosts, null Cookies, leerer Web Storage |
| Formular | Playwright gegen PHP und MariaDB im CI | Erfolg, jeder Feldfehler, Köderfeld, Zeitfalle, Rate-Limit, ohne JavaScript |
| Sicherheit | Playwright und Skript | Kopfzeilen, CSP ohne Verstöße in der Konsole, keine Geheimnisse im Build |
| Leistung | Lighthouse CI | Budgets aus `project-brief.md` §7 |
| Verweise und HTML | Link-Prüfer, HTML-Validator | keine toten Links, gültiges HTML |

Geschrieben wird testgetrieben: erst der Test, dann der Baustein.

## 11. CI und Deploy

- Workflow `website.yml` mit Pfadfilter `website/**`: Lint, Typprüfung,
  Tests, Build. Die Produkt-CI bleibt unberührt.
- Deploy ist ein eigener Workflow mit manuellem Start und Freigabe über eine
  geschützte Umgebung: `build:release`, dann Upload per rsync über SSH oder,
  falls der Tarif kein SSH bietet, per SFTP-Spiegelung. Zugangsdaten liegen
  nur als Secrets der Umgebung vor.
- Zuerst in ein Vorschauverzeichnis mit Zugangsschutz, nach Sichtprüfung auf
  die Hauptdomain. Rückweg: der vorige Build bleibt als Verzeichnis liegen.
- Datenbank-Migration und `config.php` werden einmalig von Hand eingerichtet
  und dokumentiert; der Deploy fasst sie nicht an.

## 12. Reihenfolge der Umsetzung

| Phase | Ergebnis | Freigabe |
|---|---|---|
| 5 | Grundgerüst, Tokens, Bausteine, Startseite deutsch, Tests dafür | Auftraggeber sieht die Startseite in der Vorschau |
| 6 | übrige Seiten, Englisch, Formular und Backend | Inhalte je Seite |
| 7 | vollständige Quality Gates, Sicherheits- und Datenschutzprüfung, manuelle Barrierefreiheitsprüfung | Prüfprotokoll |
| 8 | Rechtstexte, geprüfte Claims, Screenshots, Deploy | Go-live durch den Auftraggeber |

## 13. Annahmen und offene Punkte

- Hetzner Webhosting L bietet PHP 8, MariaDB, Cronjobs, `mod_headers` und
  `mod_rewrite`. Das wird gerade gegengeprüft; das Ergebnis fließt hier ein
  (F-09).
- Die App antwortet unter `https://www.reticora.cloud/onboarding` und
  `/login` (F-02).
- Offene Geschäftsfakten stehen in `project-brief.md` §8; sie blockieren
  erst die Phasen, die dort genannt sind.

## 14. Änderungen nach der Freigabe

Die Freigabe vom 2026-11-12 gilt dem Stand ohne diesen Abschnitt. Die
folgenden Punkte stammen aus der technischen Gegenprüfung und aus den
Antworten des Auftraggebers vom selben Tag. Sie ändern nicht, was gebaut
wird, sondern machen es auf dem Zielsystem lauffähig und prüfbar. Wo ein
Punkt einer früheren Stelle widerspricht, gilt dieser Abschnitt.

| Nr. | Betrifft | Änderung | Grund |
|---|---|---|---|
| Ä-01 | §2 | Eigenes privates Repository; die Wurzel ist das, was bisher `website/` war. | Entscheidung W-E10 |
| Ä-02 | §3, §4 | Neue Seite `/demo/` (englisch `/en/demo/`) mit Zugangsdaten und Link zur Demo. `data/links.ts` führt zusätzlich die Demo-Zugangsdaten. | Entscheidung W-E13 |
| Ä-03 | §4 | `data/pricing.ts`: Zusatzkosten 0,05 € je zusätzlichem CI und 0,03 € je Monitoring-Service im Monat; Beschreibungen der beiden Enterprise-Pakete; Regeln zu Testende und Downgrade. Die Stufen heißen „Paket“. | W-E12, W-E14, W-E15 |
| Ä-04 | §4 | `data/devices.ts` wird nicht beim Build aus dem Produkt-Repository gelesen, sondern von einem Skript als Datei übernommen und eingecheckt. Der Stand (Commit des Produkts) steht in der Datei. | getrennte Repositories |
| Ä-05 | §5 | Kein Inline-Skript im HTML: Inseln sind eigene Dateien, die Astro nicht einbettet (`vite.build.assetsInlineLimit: 0`, keine `client:`-Direktiven, kein Framework). Stile liegen in Dateien (`build.inlineStylesheets: 'never'`). Ein Test durchsucht den Build nach `<script>` ohne `src` und nach `style`-Attributen. | sonst blockiert die Content-Security-Policy die Inseln |
| Ä-06 | §5 | Schriften liegen unter `src/assets/fonts/` und bekommen einen Hash im Namen. Archivo wird auf die genutzten Zeichen und den genutzten Bereich der Achsen gekürzt; Ziel beider Schriften zusammen unter 90 KB. | Budget; lange Cache-Dauer |
| Ä-07 | §6.1 | Die Zeitfalle (`ts`, `sig`) entfällt. Eine statische Seite kann keinen vom Server signierten Zeitstempel tragen. Schutz: Köderfeld, Rate-Limit je Herkunft, Obergrenze für alle Anfragen je Stunde. | technisch nicht umsetzbar ohne weiteren dynamischen Pfad |
| Ä-08 | §6.1, §9 | Ohne JavaScript zeigt `lead.php` bei Eingabefehlern die Kontaktseite selbst an: Der Build legt die fertige Kontaktseite je Sprache als Vorlage außerhalb des Webroots ab; PHP setzt Fehlertexte und die maskierten Eingaben ein und antwortet mit `422`. Keine Fehlercodes in der Adresse. | Eingaben bleiben erhalten; Fehler stehen am Feld |
| Ä-09 | §6.2 | Das Formular sendet nur an das Vertriebspostfach. Es geht keine automatische E-Mail an die eingegebene Adresse; den Eingang bestätigt die Dankeseite. | sonst ließe sich das Formular zum Versand an Dritte missbrauchen |
| Ä-10 | §6.2, §6.3 | Rate-Limit: HMAC der Adresse (IPv6 auf das /64-Präfix gekürzt) mit einem Schlüssel, der täglich überschrieben wird. Abgelaufene Einträge löscht ein stündlicher Lauf und jeder Aufruf des Endpunkts. | ein gesalzener Hash einer IP-Adresse ist umkehrbar; ein täglicher Lauf löscht nicht nach 24 Stunden |
| Ä-11 | §6.4, §8 | PHP 8.4. Eine gepflegte SMTP-Bibliothek über Composer mit `composer.lock`; `vendor/` liegt außerhalb des Webroots, `composer audit` läuft im CI. Im Webroot liegt vom Backend nur `api/lead.php`. Eigener Datenbankbenutzer mit zufälligem Passwort, weil der Datenbankserver des Hosters von außen erreichbar ist. | Sicherheit auf Shared Hosting |
| Ä-12 | §8 | Kopfzeilen mit `Header always set`, damit sie auch für Umleitungen und Fehlerseiten gelten. Eine Umleitung in einem Schritt von `http` und von der Adresse ohne `www` auf `https://www.reticora.de`. Astro: `trailingSlash: 'always'`, `build.format: 'directory'`. Englische 404-Seite über `/en/.htaccess`. Komprimierung und HTTP/2 werden im Hosting-Konto je Domain eingeschaltet. | Verhalten von Apache |
| Ä-13 | §8 | `/.well-known/security.txt` mit `Contact` und `Expires` (Build-Datum plus 180 Tage); ein geplanter CI-Lauf meldet eine Datei, die in weniger als 30 Tagen abläuft. | RFC 9116 verlangt beide Felder |
| Ä-14 | §10 | Seiten-, Formular-, Kopfzeilen- und Leistungstests laufen gegen einen Container mit Apache 2.4, PHP 8.4, MariaDB und einem SMTP-Fänger, mit demselben Build und derselben `.htaccess` wie im Deploy. | `.htaccess` und PHP wirken nur dort |
| Ä-15 | §10 | Leistung: LCP und CLS aus Lighthouse (Mobilprofil, Median aus fünf Läufen), dazu TBT ≤ 150 ms; INP wird mit Playwright bei gedrosselter CPU gemessen. Der SEO-Wert gilt nicht für Seiten mit `noindex` und nicht für die 404-Seite. | INP ist im Seitenaufruf nicht messbar |
| Ä-16 | §11 | Deploy über SSH auf Port 222 mit dem Schlüssel des Hauptbenutzers, SFTP als Rückweg. Vorschau in einem Verzeichnis mit Zugangsschutz. | Angaben des Hosters, im Konto zu bestätigen |
| Ä-17 | §5 | Der Filter der Geräteliste ist eine vierte Insel (2 KB); ohne JavaScript steht die vollständige Tabelle mit Sprungmarken je Kategorie. | war in der Liste der Inseln nicht genannt |
| Ä-18 | §6.1, §6.2 | Obergrenze aus Ä-07: höchstens 60 angenommene Anfragen je festem Stundenfenster insgesamt (`rate_limit.global_max`, begrenzt auf 1–1000); darüber `429` wie beim Limit je Herkunft. Es zählen nur gültige Anfragen ohne Köderfeld. `rate_limit.max` (je Herkunft, Standard 5) ist auf 1–100 begrenzt. | Vorschlag der Umsetzung; ein Testwert kann nicht unbegrenzt in den Betrieb gelangen |
| Ä-19 | §6.1, §6.2 | Reihenfolge: Methode, Größe, Origin, Content-Type, Rate-Limit je Herkunft, Eingaben, Köderfeld, Obergrenze, Speichern, Mail. Ein ungültiges Formular ergibt immer `422`, auch mit gefülltem Köderfeld. Andere Methoden als POST ergeben `405` mit `Allow: POST`; es gibt keinen GET-Pfad. Eingabefehler: neuer Code `topic.required` für ein leeres Anliegen (`topic.invalid` nur für unbekannte Werte). | ein ungültiges Formular darf nie auf der Dankeseite enden |
| Ä-20 | §6.1, §9 | Umsetzung von Ä-08: Die Integration `src/integrations/lead-templates.ts` kopiert nach dem Build `dist/kontakt/index.html` und, sobald vorhanden, `dist/en/contact/index.html` nach `backend/templates/contact.<lang>.html` und schreibt `form-texts.json` aus `ui(lang).form`; der Build bricht ab, wenn eine Marke fehlt. Auf dem Hosting liegt `templates/` neben `vendor/` außerhalb des Webroots und wird mit jedem Deploy aus demselben Build ersetzt. Feld- und Zusammenfassungsbausteine tragen feste Marken (`data-rt-*`); PHP ersetzt nur diese Zeichenfolgen (`strtr`), maskiert jede Eingabe mit `htmlspecialchars` und setzt dieselbe CSP wie `.htaccess`. Die Zusammenfassung trägt `autofocus`. Fehlt die Vorlage, zeigt PHP eine kurze Hinweisseite mit den Fehlertexten (422, Eingaben gehen verloren). | Eingaben bleiben erhalten, keine HTML-Verarbeitung von Eingaben |
| Ä-21 | §5, §6.1 | `?topic=demo\|enterprise\|security\|other` wählt das Anliegen auf `/kontakt/` vor; das macht die Insel `form` (feste Liste). Ohne JavaScript bleibt die Auswahl leer. Sonst liest keine Seite etwas aus der Adresse. | Links „Kontakt aufnehmen“ mit Anliegen; eine statische Seite je Anliegen lohnt nicht |
| Ä-22 | §6.2, §6.3 | Umsetzung von Ä-10: IPv4 bleibt ungekürzt, IPv4-gemappte IPv6-Adressen zählen als IPv4. Der Schlüssel (32 Zufallsbytes) liegt in der Tabelle `rate_limit_key` und wird beim ersten Gebrauch eines neuen UTC-Tages überschrieben. Abgelaufen ist ein Zähler, sobald sein Stundenfenster vorbei ist; gelöscht wird bei jedem POST, der die Datenbank erreicht, und durch `bin/purge.php` (stündlicher Cronjob statt täglich, §6.3). Kein `secret` mehr in `config.php`. | ein abgelaufener Zähler hat keinen Zweck mehr |
| Ä-23 | §6.2, §6.4, §8 | Umsetzung von Ä-11: PHPMailer (`phpmailer/phpmailer` ^7) ist die einzige Laufzeitabhängigkeit; PHP-Anforderung `>=8.3`, CI auf 8.4. SMTP nur mit Anmeldung und `ssl`/`starttls`; Ausnahme nur mit `mail.allow_insecure` für Tests. Gesamtfrist für alle Antworten eines Versands (`mail.deadline`, 15 s). Fehler in Mail- oder Datenbank-Konfiguration ergeben für POST das allgemeine `500`, bevor etwas gespeichert ist. Mit Ä-09 entfallen Bestätigungsmail, Zustellstatus `confirmation_failed` und die Signatur-Einstellung. | Sicherheit auf Shared Hosting; vorhersagbares Verhalten |
| Ä-24 | §6.1 | In `name` und `company` sind U+200C und U+200D erlaubt; Bidi-Steuerzeichen und alle übrigen Formatzeichen bleiben abgelehnt. | Namen in persischer oder indischer Schrift |
| Ä-25 | §8 | `SITE.securityContact` (zunächst `null`) speist `security.txt` aus Ä-13 mit `Contact`, `Expires`, `Preferred-Languages: de, en` und `Canonical`. Solange der Wert fehlt, entsteht keine Datei, und `build:release` meldet „Anbieter: Meldeadresse für Sicherheitslücken fehlt“. Der geplante CI-Lauf für den Ablauf aus Ä-13 steht noch aus. | keine erfundene Meldeadresse |
| Ä-26 | §3 | `/demo/` und `/en/demo/` tragen `noindex` und stehen nicht in der Sitemap, bis der Auftraggeber entscheidet. | Zugangsdaten auf einer indexierten Seite laden zu automatisiertem Missbrauch ein |
| Ä-27 | §5 | Die Preisseite zeigt die Tabelle ohne Umschalter Monat/Jahr; beide Preise stehen immer sichtbar, je Paket gibt es eine Handlung („30 Tage testen“ bzw. „Kontakt aufnehmen“). Unter 64 rem steht je Paket ein Block statt der Tabelle. | ein Umschalter verbirgt Angaben und braucht JavaScript; weicht vom Layouthinweis in `docs/copy/preise-de.md` ab |
| Ä-28 | §5 | Die Fragen auf der Preisseite sind eine immer geöffnete Definitionsliste, kein `details`; der Druck zeigt alle Antworten. | Antworten bleiben ohne Klick les- und druckbar |
| Ä-29 | §5 | `DataTable` bleibt ein fokussierbarer Scrollrahmen, stapelt aber unter 48 rem (Beschriftung je Zelle über `data-label`). Matrix und Geräteliste bleiben Scrollrahmen mit Hinweis. | kein waagerechtes Scrollen bei 320 und 360 px |
| Ä-30 | §10, §11 | Die CI wiederholt fehlgeschlagene Playwright-Tests einmal (`retries: 1` nur mit `CI`). Lokal gibt es keine Wiederholung. | in Firefox hing das Laden einer Seite vereinzelt (ein Test von 255); Ursache offen |
| Ä-31 | §10 | Ä-14 (Container mit Apache, PHP, MariaDB und SMTP-Fänger) wird in Phase 7 umgesetzt, nicht in Phase 6. Bis dahin laufen Tests gegen Apache, den PHP-Entwicklungsserver und SQLite; MariaDB und echter SMTP-Versand bleiben ungeprüft. | Umfang der Phase 6 |
| Ä-32 | §3 | Die englischen Adressen stehen verbindlich in der Routentabelle `src/i18n/routes.ts` (`ROUTES`); `docs/content-plan.md` §2 nennt nur die deutschen. Abschnittsanker (`id`) sind in beiden Sprachen gleich und bleiben deutsch. | eine gemeinsame Ansicht je Seite |
| Ä-33 | §8, §10 | Umsetzung von Ä-13 (zweite Hälfte) und Ä-15: Der Workflow `security-txt.yml` läuft wöchentlich und manuell, prüft über `scripts/check-security-txt.mjs`, dass `Expires` mindestens 30 Tage voraus liegt, und endet ohne Meldeadresse mit einem Hinweis. Die Budgets (JavaScript ≤ 35 KB, Gesamt ≤ 200 KB gzip, Inseln `impact` ≤ 8 KB, `copy` ≤ 1 KB, `form` ≤ 3 KB, `filter` ≤ 2 KB) gelten für jede gebaute Seite. Lighthouse misst Startseite, Preise, Kontakt, Discovery, `/en/` und `/en/pricing/`. | Ä-25 hielt den Lauf als offen fest |
