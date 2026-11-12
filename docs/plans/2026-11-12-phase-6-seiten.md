# Phase 6: Übrige Seiten, Englisch, Kontaktformular – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle Seiten der Sitemap (`docs/content-plan.md` §2) deutsch und englisch bauen, dazu das Kontaktformular mit PHP-Backend, Auffindbarkeit (kanonische Adresse, `hreflang`, `sitemap.xml`, `robots.txt`) und die Prüfungen dafür.

**Architecture:** Wie Phase 5: Astro statisch, Bausteine `rt-*`, Daten in `src/data/`, Texte in `src/content/<lang>/`. Jede Seite ist eine dünne Astro-Datei, die einen sprachneutralen Seitenbaustein aus `src/views/` mit `lang` aufruft; deutsche und englische Route teilen sich so das Markup. Das Lead-Backend ist reines PHP 8.2 ohne Framework unter `backend/`, wird beim Deploy nach `/api/` und außerhalb des Webroots kopiert und im Test mit PHP-Entwicklungsserver und SQLite (gleiche PDO-Schnittstelle wie MariaDB) geprüft.

**Tech Stack:** wie Phase 5; zusätzlich PHP 8.2+ (CLI), PHPUnit 11 (per Composer, nur Entwicklung), PDO (MariaDB im Betrieb, SQLite im Test).

**Spec:** `docs/specs/2026-11-12-website-spec.md` (§3 Seiten, §4 Daten, §6 Lead-Backend, §7 Datenschutz, §8 Sicherheit, §10 Tests), `docs/content-plan.md` (§2 Sitemap, §3 Navigation, §6 Stichpunkte, §6.1–6.3 Preise/Matrix/Begriffe, §7 Claims, §8 Screenshots, §9 Formular, §10 Auffindbarkeit), `docs/design-system.md`, `docs/brand-strategy.md` §4 (Tonalität). Produktfakten: `/home/user/Reticora-CMDB/README.md` und der Code dort (nur lesen).

## Global Constraints

- Arbeitszweig `claude/phase-6-seiten` (gestapelt auf `claude/phase-5-startseite`). Commit-Regeln wie Phase 5 (deutscher Imperativ, zwei Schlusszeilen, Identität `Claude <noreply@anthropic.com>`). Kein Push durch Implementierer.
- Alle Global Constraints aus `docs/plans/2026-11-12-phase-5-startseite.md` gelten weiter (kein Inline-Skript/-Stil, keine fremden Hosts, Tokens, 44 px, eine `h1`, NBSP zwischen Zahl und Einheit, Adressen nur in `src/data/links.ts`).
- **Belegpflicht:** Jede Aussage mit Zahl, Sicherheits- oder Datenschutzbezug trägt einen `Beleg` auf einen Eintrag in `src/data/claims.ts`. Neue Claims bekommen die nächste freie Nummer, `status: 'offen'`, eine Fundstelle im README/Code in `note` und werden in `docs/content-plan.md` §7 nachgetragen. Was im README/Code nicht steht, wird nicht behauptet. Der Auftraggeber hat entschieden, Funktionen als fertig darzustellen; das betrifft dokumentierte Funktionen, nicht erfundene.
- **Keine erfundenen Rechtstexte.** Impressum, Datenschutz, AGB und Subprozessoren erhalten nur Gerüst, die bekannten Anbieterangaben aus `SITE` und einen sichtbaren, mit `data-placeholder` markierten Hinweis „Text folgt vom Anbieter“. Keine Aussage, die Website sei rechtskonform.
- Keine erfundenen Kunden, Zitate, Kennzahlen, Fallstudien, Zertifikate. Herstellernamen nur als Text.
- Tonalität nach `brand-strategy.md` §4: Sie-Form, aktive Verben, Angaben mit Einheit, Begriffe der App (`content-plan.md` §6.3). Englisch: Begriffe der englischen App-Oberfläche, britische/neutrale Schreibweise einheitlich, Preise „excl. VAT“, „Offer for businesses only.“
- Entwicklungs-Build trägt `noindex`; nur `RETICORA_RELEASE=1` erlaubt Indexierung. `/kontakt/danke/` und `/en/contact/thanks/` immer `noindex`.
- Budgets je Seite wie Startseite: JS ≤ 35 KB, gesamt ≤ 200 KB (gzip); Insel `form` ≤ 3 KB.
- PHP: `declare(strict_types=1)`, keine Abhängigkeit zur Laufzeit außer PDO und einem SMTP-Versand über Sockets in `Mailer`; vorbereitete Anweisungen; keine Ausgabe von Fehlern an den Browser; `config.php` nie im Repository; keine echten Personendaten in Tests oder Fixtures.

## Review Focus

1. **Formular ohne JavaScript und mit Fehlern:** Absenden funktioniert, Fehler erscheinen am Feld und in einer Zusammenfassung mit Fokus, Eingaben stehen nie in der Adresse. → Task 7.
2. **Einschleusung:** Zeilenumbrüche in `name`/`email`/`company` (Mail-Kopfzeilen), HTML in `message`, fremde `Origin`, zu große Anfrage, manipuliertes `lang`/`topic` (Weiterleitungsziel bleibt fest). → Task 6.
3. **Sprachpaare:** Jede Seite verweist per `hreflang` und Sprachumschalter auf ihr Gegenstück, nicht auf die Startseite; keine Seite ohne Gegenstück. → Task 1, Task 8.
4. **Lange Tabellen bei 320 px:** Paketmatrix, Geräteliste und Quellränge bleiben lesbar (Scrollrahmen mit Hinweis oder Umbruch), die Seite scrollt nicht waagerecht. → Task 3, 4, 5.
5. **Geräteliste ohne JavaScript:** Der Filter ist eine Verbesserung; ohne JavaScript ist die ganze Tabelle sichtbar, nach Kategorie gruppiert. → Task 4.

---

### Task 1: Seitenrahmen, Auffindbarkeit, Sprachgerüst

**Files:**
- Create: `src/i18n/en.ts`, `src/i18n/index.ts`, `src/components/PageHero.astro`, `src/components/Cta.astro`, `src/components/Seo.astro`, `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `tests/unit/i18n.test.ts`, `tests/e2e/pages.spec.ts`
- Modify: `src/layouts/Leitstand.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/i18n/routes.ts`, `src/i18n/de.ts`

**Interfaces (Produces):**
- `ui(lang: Lang): typeof UI` aus `src/i18n/index.ts`; `en.ts` hat exakt dieselben Schlüssel wie `de.ts` (Typprüfung und Unit-Test).
- `ROUTES` vollständig mit englischen Adressen: `/en/product/discovery/`, `/en/product/data-quality/`, `/en/product/topology-impact/`, `/en/product/administration/`, `/en/product/operations/`, `/en/product/compliance/`, `/en/product/api/`, `/en/devices/`, `/en/solutions/isp/`, `/en/solutions/msp/`, `/en/security/`, `/en/pricing/`, `/en/demo/`, `/en/contact/`, `/en/contact/thanks/`, `/en/legal-notice/`, `/en/privacy/`, `/en/terms/`, `/en/subprocessors/`, `/en/accessibility/`. Dazu `counterpart(path: string): string | null` und `localize(dePath: string, lang: Lang): string`.
- `Leitstand.astro` Props `{ lang, title, description, path, noindex?: boolean }`; rendert `Seo` (kanonische Adresse aus `SITE.url + path`, `hreflang` de/en/x-default nur wenn das Gegenstück `gebaut` ist, Open-Graph-Titel/-Beschreibung ohne Bild von Dritten, `robots noindex` außerhalb des Release-Builds).
- `PageHero` Props `{ eyebrow?: string; title: string; lead: string }` (einzige `h1`); `Cta` Props `{ lang }`: Abschlussband mit „30 Tage testen“, „Live-Demo“, „Kontakt“ und „Angebot nur für Unternehmen.“
- Kopf- und Fußzeile lesen alle Texte aus `ui(lang)` und alle Ziele über `localize`; der Sprachumschalter zeigt auf `counterpart(path)`.
- `sitemap.xml` listet nur `gebaut`-Routen beider Sprachen mit `xhtml:link`-Alternativen, ohne `noindex`-Seiten; `robots.txt` verweist auf die Sitemap und sperrt im Entwicklungs-Build alles.

- [ ] Tests zuerst: Schlüsselgleichheit de/en; `counterpart`/`localize` für drei Paare und `/`; `pages.spec.ts` als Schleife über alle `gebaut`-Routen (lädt mit 200, eine `h1`, `lang`-Attribut passend, kein waagerechtes Scrollen bei 320/768/1280, kanonische Adresse = eigene Adresse, `hreflang`-Ziel existiert, Sprachumschalter führt zum Gegenstück, axe ohne Befunde, keine fremden Hosts, keine Konsolenfehler). Die Schleife wächst mit jeder späteren Task von selbst.
- [ ] Umsetzen, `npm run check && npm run build && npm test && npm run validate && npm run test:e2e -- --trace off` grün, Commit „Seitenrahmen, Sprachgerüst und Auffindbarkeit“.

### Task 2: Deutsche Texte aller Seiten (nur Dokumente und Daten)

**Files:**
- Create: `docs/copy/<seite>-de.md` für jede Seite aus §2 außer Startseite (Produkt ×7, Geräte, ISP, MSP, Sicherheit, Preise, Demo, Kontakt, Danke, Barrierefreiheit, 404-Texte), `src/data/devices.ts`, `tests/unit/devices.test.ts`
- Modify: `src/data/claims.ts`, `docs/content-plan.md` §7, `src/data/pricing.ts` (Paketmatrix §6.2 als `FEATURES`, Add-ons, Fragen nur soweit belegt)

**Vorgaben:** Aufbau je Dokument wie `docs/copy/startseite-de.md`: Titel (≤ 60 Zeichen), Beschreibung (≤ 155), `h1`, Vorspann, Abschnitte mit Überschrift, Text, Abbildung (S-Nummer und Unterschrift), Claim-Nummer je Aussage. Inhalte nach `content-plan.md` §6, Fakten ausschließlich aus README/Code des Produkts; jede neue Aussage bekommt einen Claim mit Fundstelle. `devices.ts`: `DEVICES: { vendor: string; family: string; category: 'network' | 'server' | 'storage' | 'power' | 'other'; protocols: string[] }[]` aus `collector/profiles` (Skript oder von Hand, Fundstelle im Kommentar); Test: keine Dubletten, jede Kategorie belegt. Lösungen ISP/MSP: je drei bis vier Arbeitssituationen, keine Fallstudien. Preise-Fragen nur mit Antworten aus README §14 und den Entscheidungen W-E in `docs/project-brief.md`. Barrierefreiheit: nur nachweisbare Angaben (geprüft mit axe, Tastatur, Kontrastwerte aus dem Design-System), Kontaktweg als Platzhalter, keine Konformitätsbehauptung.

- [ ] Dokumente schreiben, Claims und Daten ergänzen, `npm test` grün, Commit „Texte der übrigen Seiten deutsch, Claims und Gerätedaten“.

### Task 3: Produktseiten (7) deutsch

**Files:** Create `src/content/de/produkt/*.ts`, `src/views/Product*.astro` oder ein gemeinsamer `src/views/ProductPage.astro` mit Abschnittstypen (`text+figure`, `spec-list`, `table`, `steps`, `code`), `src/pages/produkt/<slug>/index.astro` ×7; Modify `src/i18n/routes.ts` (Status `gebaut`), `tests/e2e/pages.spec.ts` falls nötig.

Texte wörtlich aus den Dokumenten der Task 2. Topologie-Seite nutzt `TopologyStage`, API-Seite `CodeSample`, Datenqualität die Tabelle der Quellränge als `DataTable`. Jede Seite endet mit `Cta`. Seitenspezifische Tests: `h1` und Abschnittsüberschriften je Seite wie im Dokument; Platzhalter-IDs wie im Dokument.

- [ ] Tests zuerst, umsetzen, volle Prüfkette grün, Screenshots 1280/360 ansehen, Commit „Produktseiten deutsch“.

### Task 4: Geräte, Lösungen ISP und MSP deutsch

**Files:** Create `src/content/de/{geraete,isp,msp}.ts`, `src/views/{Devices,Solution}.astro`, `src/islands/filter.ts` (≤ 2 KB), Seiten ×3; Modify routes.

Geräteliste: echte Tabelle, nach Kategorie gruppiert; Filter als Knopfgruppe (`aria-pressed`), nur mit JavaScript sichtbar; Hinweis zu unbekannten Geräten (`generic_device`, Review) mit Beleg; Markenhinweis wie auf der Startseite. Tests: ohne JS alle Zeilen sichtbar; Filter „Storage“ zeigt nur Storage-Zeilen und meldet die Anzahl in einer `aria-live`-Zeile; 320 px ohne Seitenscrollen.

- [ ] Tests zuerst, umsetzen, Prüfkette grün, Commit „Geräte und Lösungen deutsch“.

### Task 5: Sicherheit, Preise, Demo deutsch

**Files:** Create `src/content/de/{sicherheit,preise,demo}.ts`, `src/views/{Security,Pricing,Demo}.astro`, Seiten ×3; Modify routes, ggf. `src/data/links.ts`.

Preise: Pakettabelle aus `PLANS` (monatlich, jährlich, Beta-Jahrespreis), Paketmatrix aus `FEATURES` als Tabelle mit Zeilenköpfen und Textwerten („enthalten“/„–“, nicht nur Symbole), Zusatzkosten (0,05 € je zusätzlichem CI, 0,03 € je Monitoring-Dienst, monatlich), Beta-Rabatt, Test, Fragen als `details`. „zzgl. MwSt.“ und „Angebot nur für Unternehmen.“ sichtbar am Tabellenkopf. Druckansicht im hellen Thema (`@media print`). Demo: Kennwertliste Adresse/Benutzer/Passwort aus `LINKS` mit Kopierknopf je Wert, drei Dinge zum Ausprobieren, Hinweis auf das gemeinsame Konto, Knopf „Demo öffnen“. Sicherheit: Abschnitte nach `content-plan.md` §6, `ConnectionSchema`, Meldeweg für Sicherheitslücken als Platzhalter, solange keine Adresse vorliegt.

- [ ] Tests zuerst (Preise: jede Zahl gegen `PLANS`; Matrixzeilen = `FEATURES.length`; Demo: Werte = `LINKS`), umsetzen, Prüfkette grün, Commit „Sicherheit, Preise und Demo deutsch“.

### Task 6: Lead-Backend in PHP

**Files:** Create `backend/public/lead.php`, `backend/src/{Config,Validator,RateLimiter,LeadRepository,Mailer,Signer,Responder}.php`, `backend/bin/{purge.php,migrate.php}`, `backend/sql/001_init.sql` (MariaDB) und `001_init.sqlite.sql`, `backend/config.example.php`, `backend/composer.json`, `backend/phpunit.xml`, `backend/tests/*Test.php`, `backend/README.md`; Modify `.github/workflows/ci.yml` (PHP einrichten, `composer install`, `phpunit`), `.gitignore`.

**Vertrag:** exakt Spezifikation §6.1–6.4 (Felder, Grenzen, Antworten je Fall, feste Weiterleitungsziele, Rate-Limit 5 je Stunde über HMAC der IP mit Tagesschlüssel, Köderfeld, Zeitfalle 3 s bis 2 h mit `ts`+`sig`, 16 KB, `Origin`-Prüfung gegen `SITE.url`-Host aus der Konfiguration). `Mailer` hinter einer Schnittstelle `MailTransport` (`SmtpTransport` für den Betrieb, `ArrayTransport` für Tests); Kopfzeilen nur aus festen Werten, `Reply-To` erst nach Validierung; Bestätigungsmail ohne Wiedergabe der Nachricht. Signatur der Mails aus der Konfiguration (Pflichtangaben liefert der Anbieter; im Beispiel leer und so dokumentiert). `Signer::issue(now): {ts, sig}` und `verify`. Weil die Seite statisch ist, liefert `GET /api/lead.php?token=1` ein frisches `{ts, sig}` als JSON (kein Cookie, `Cache-Control: no-store`); `form.ts` holt es beim Laden und füllt zwei versteckte Felder. Fehlen `ts` und `sig` ganz (kein JavaScript), entfällt die Zeitfalle und es greifen Köderfeld und Rate-Limit; ist nur eines vorhanden oder die Signatur falsch, gilt die Anfrage als Zeitfallen-Treffer.

**Tests (PHPUnit):** jede Feldgrenze; Steuerzeichen und Zeilenumbruch in einzeiligen Feldern; Kopfzeilen-Einschleusung; unbekanntes `topic`/`lang`; Köderfeld; Zeitfalle zu früh/zu alt/gefälschte Signatur; Rate-Limit 6. Anfrage → 429 mit `Retry-After`; fremde `Origin`; GET/PUT abgelehnt; Speicherung per SQLite; Versandfehler → Eintrag „nicht zugestellt“; `purge` löscht nach Frist und protokolliert nur Anzahlen; keine Eingabe erscheint in einer Weiterleitungsadresse.

- [ ] Tests zuerst, umsetzen, `composer install && vendor/bin/phpunit` grün (PHP lokal installieren, falls nötig), Commit „Lead-Backend in PHP“.

### Task 7: Kontaktseite, Dankeseite, Formular-Insel

**Files:** Create `src/content/de/kontakt.ts`, `src/views/{Contact,Thanks}.astro`, `src/components/{Field,ErrorSummary}.astro`, `src/islands/form.ts`, Seiten ×2, `tests/e2e/contact.spec.ts`, `tests/server/php-router.php`; Modify `tests/server/start.sh`/`httpd.conf.tmpl` (Apache reicht `/api/` an den PHP-Entwicklungsserver durch oder lädt PHP-CGI; `mod_proxy` nur im Test), `public/.htaccess` (CSP `form-action 'self'`, `connect-src 'self'`), routes.

Formular nach `content-plan.md` §9: fünf Felder, sichtbare Labels, `autocomplete`, Pflichtkennzeichnung im Text, Fehlertexte je Code aus `ui(lang)`, Zusammenfassung mit Links zu den Feldern und Fokus, Köderfeld für Hilfstechnik verborgen und nicht fokussierbar, Hinweis zur Verarbeitung als Platzhalter mit Link zur Datenschutzseite. Ohne JS: normales Absenden, bei Fehler `303` zurück mit `?fehler=name.required,…`, die Seite zeigt die Zusammenfassung über `form.ts` – ohne JavaScript steht eine allgemeine Fehlerzeile per `:target` (`#fehler`). Direkte Kontaktdaten aus `SITE` (fehlende als Platzhalter).

**Tests (Playwright gegen Apache + PHP + SQLite):** Erfolg mit und ohne JavaScript; jeder Feldfehler; Köderfeld; Rate-Limit; Tastaturweg; axe; keine Eingaben in Adressen; kein fremder Host.

- [ ] Tests zuerst, umsetzen, Prüfkette grün, Commit „Kontaktformular und Dankeseite“.

### Task 8: Rechts- und Hinweisseiten, 404 in beiden Sprachen

**Files:** Create `src/views/{Legal,Accessibility}.astro`, Seiten `/impressum/`, `/datenschutz/`, `/agb/`, `/subprozessoren/`, `/barrierefreiheit/`, `src/pages/en/404.astro`, `public/en/.htaccess` (englische Fehlerseite); Modify routes, `scripts/lib/release-checks.mjs` (Platzhalter auf Rechtsseiten zählen als Mangel – bereits über `data-placeholder`).

Helles Dokumentthema (`data-theme="dokument"`). Impressum zeigt die vorhandenen Angaben aus `SITE` und Platzhalter für die fehlenden; die übrigen drei nur Überschrift, Stand-Zeile und Platzhalterhinweis. Barrierefreiheit nach dem Dokument der Task 2.

- [ ] Tests (Thema, Platzhaltermarker vorhanden, `build:release` meldet sie), umsetzen, Commit „Rechts- und Hinweisseiten als Gerüst“.

### Task 9: Englische Fassung

**Files:** Create `docs/copy/en/*.md` (Übersetzung jeder deutschen Fassung inkl. Startseite), `src/content/en/**`, `src/pages/en/**` (je eine dünne Datei), Modify `src/data/claims.ts`/`pricing.ts`/`devices.ts`/`screenshots.ts` (englische Felder vollständig), routes (alle `en` `gebaut`), `tests/unit/content-parity.test.ts`.

Begriffe nach `content-plan.md` §6.3. Test: `src/content/en` hat dieselbe Struktur (Schlüssel, Anzahl Abschnitte, Claim-Nummern, Screenshot-IDs) wie `de`; kein deutscher Reststring auf englischen Seiten (Stichprobe über häufige deutsche Wörter in `dist/en/**`); Preise und Limits identisch.

- [ ] Tests zuerst, umsetzen, Prüfkette grün, Commit „Englische Fassung“.

### Task 10: Abschlussprüfung der Phase

**Files:** Modify `lighthouserc.json` (Startseite, Preise, Kontakt, eine Produktseite, je de), `tests/unit/budget.test.ts` (Budget je gebauter Seite), `README.md`, `docs/compliance-matrix.md`, `docs/vendor-register.md` (SMTP/Hosting-Bezug des Formulars), `docs/project-brief.md` (Stand), `docs/specs/…` §14 (Änderungen dieser Phase).

- [ ] Prüfkette samt `build:release` (muss scheitern: Claims, Bilder, Platzhalter, Anbieterangaben – aber keine geplanten Seiten und keine toten Links mehr), Commit „Budgets je Seite, Dokumentation Phase 6“.

## Nach Phase 6

Phase 7: manuelle Barrierefreiheitsprüfung, Sicherheits- und Datenschutzprüfung mit Protokoll. Phase 8: Rechtstexte und Anbieterangaben vom Auftraggeber, geprüfte Claims, Screenshots, Deploy auf Hetzner (Datenbank, `config.php`, Cronjob für `purge.php`).
