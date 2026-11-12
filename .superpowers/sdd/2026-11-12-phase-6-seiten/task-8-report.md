# Task 8 Report: Rechts- und Hinweisseiten als Gerüst, 404 in beiden Sprachen

Status: DONE. Commit "Rechts- und Hinweisseiten als Gerüst".

## Gebaut
- `Leitstand` hat die Prop `theme?: 'leitstand' | 'dokument'` (Standard unverändert); gesetzt auf `data-theme` am `html`-Element.
- `src/views/Legal.astro` ({lang, page}) für `/impressum/`, `/datenschutz/`, `/agb/`, `/subprozessoren/` (dünne Seiten, Thema Dokument): h1, Stand-Zeile (`Stand: [Datum: Angabe vom Anbieter]` als Platzhalter `<page>-stand`), bei den drei Textseiten ein Block `data-placeholder="privacy|terms|subprocessors"` mit `ui.legal.pending` („Text folgt vom Anbieter.“). Impressum zeigt nur Daten aus `SITE` mit schlichten Beschriftungen (Firma, Anschrift, E-Mail-Adresse, Telefon, Geschäftsführung, Registergericht, Registernummer, USt-IdNr.); fehlende sind Platzhalter `impressum-<feld>`. Kein selbst geschriebener Rechtstext.
- `src/views/Accessibility.astro` (Thema Dokument) wörtlich nach `barrierefreiheit-de.md` (Inhalte in `src/content/de/barrierefreiheit.ts`, Kontrasttabelle als `DataTable`), Kontaktweg als Platzhalter `barrierefreiheit-kontakt`.
- 404: `src/views/NotFound.astro`, deutsch (`src/pages/404.astro`, jetzt nach `fehlerseite-de.md`: Kennzeile, h1 mit Punkt, fünf Links, Hinweiszeile) und englisch (`src/pages/en/404.astro`, Texte aus `ui('en').notFound`). Immer noindex.
- `public/en/.htaccess`: `ErrorDocument 404 /en/404/` (und 403). Astro schreibt nur die 404 der Wurzel nach `404.html`; `src/pages/en/404.astro` wird zu `dist/en/404/index.html`, daher zeigt der ErrorDocument auf das Verzeichnis (gegen Apache getestet: Status 404, englischer Text, Kopfzeilen). Weil eine .htaccess im Unterordner die Rewrite-Regeln der Wurzel ersetzt, steht dort `RewriteEngine On` + `RewriteOptions Inherit`; die index.html-Regel der Wurzel nutzt dafür `%1` (Test `/en/index.html` -> `/en/`, Hostwechsel in `/en/`).
- Routen: `/impressum/`, `/datenschutz/`, `/agb/`, `/subprozessoren/`, `/barrierefreiheit/` auf `status: 'gebaut'` (`enStatus: 'geplant'`).

## Tests
`tests/e2e/legal.spec.ts` (Thema Dokument, Überschriften, Platzhalter und Marker, Impressum-Daten aus SITE, Barrierefreiheit wie Textdokument, deutsche und englische 404), `tests/e2e/server.spec.ts` (404-Text, CSP-Direktiven, `/backend/…` und Dotfiles 403, `/en/index.html`, Kopfzeilen und Hostwechsel in `/en/`), `tests/unit/dist.test.ts` (Insel form ≤ 3 KB, `checkDistHtml` meldet die Platzhalter der Seiten, kein `backend/` oder `<?php` im Build). Die generische Schleife `pages.spec.ts` (axe, 320/768/1280, canonical, keine fremden Hosts) läuft für alle neuen Seiten.

## Ergebnis der Kette (gemeinsamer Lauf nach beiden Commits, Chromium)
`npm run check` 0 Fehler (1 Hinweis, nicht von diesen Aufgaben); `npm test` 167 grün (13 Dateien); `npm run validate` sauber; PHPUnit OK (115 tests, 398 assertions); `npm run test:e2e` 411 grün, inkl. der Seiten der parallelen Aufgaben (ein früherer Lauf zeigte Fehler der Sicherheits- und Preisseite bei 320 px, die nicht von mir stammten und später behoben waren). `build:release` meldet die Platzhalter (per Unit-Test geprüft, die Release-Sperre schlägt ohnehin an: SITE-Angaben fehlen).

## Hinweise
- Die Sprachumschalter-Zeile auf der englischen 404 beschriftet das nicht vorhandene DE-Gegenstück mit „English version coming soon“ (vorhandene LangSwitch-Logik für Seiten ohne Gegenstück; nicht verändert).
- Die englische 404 verlinkt englische Adressen, die erst in Task 9 gebaut werden.
- Nicht in Commit 1/2 getrennt: UI-Texte für die 404 und die Rechtsseiten stehen schon in Commit 1 (`de.ts`/`en.ts`).
- Gemeinsam genutzt: `Placeholder.astro`, `.rt-placeholder`, `.legal-*`, `Leitstand theme`.
