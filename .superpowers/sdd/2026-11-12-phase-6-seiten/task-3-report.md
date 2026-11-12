# Task 3 – Bericht: Produktseiten deutsch

Status: DONE_WITH_CONCERNS. Commit 7b639bd „Produktseiten deutsch“.

## Gebaut
- `src/views/ProductPage.astro` (Props `{ lang, slug }`, lädt `content(lang).produkt[slug]`) + `ProductLeaf.astro` (Kennwerte, Tabelle, Code). Sieben Dreizeiler `src/pages/produkt/<slug>/index.astro`.
- Inhaltsmodell `src/content/types.ts` (generisch, wiederverwendbar): Blöcke `prose`, `figure`, `shots`, `specs`, `table`, `steps`, `code`, `topology`, `schema`, `notice`, `link`, `split`. Seite = Meta + Kopf (Knöpfe, Betriebsleiste, Netzschema) + Abschnitte + optional eigener Abschluss.
- `src/content/rich.ts`: Auszeichnung in Texten (`[C-xx]` wird Beleg, Backticks wird `<code>`, `**fett**`), `nbsp()` (geschütztes Leerzeichen Zahl/Einheit), `highlightShell()`. Komponente `Rich.astro`. Absätze mit Beleg werden `div.rt-para[role=paragraph]`.
- Inhalte `src/content/de/produkt/*.ts`; `src/content/index.ts` (`content(lang)`, EN folgt Task 9). Dokumentenspeicher der Verwaltungsseite kommt aus `FEATURES` in `src/data/pricing.ts`.
- Teilnavigation (7 Links, `aria-current`) nur mit Beschriftungen der Fußzeile (`ui.footer.columns[0]`), keine neuen Texte.
- Routen: sieben deutsche Seiten `gebaut`, `enStatus` bleibt `geplant`.

## Gemeinsame Änderungen (additiv)
- `PageHero`: `lead` optional, Slot `lead` (Beleg im Vorspann), Standard-Slot (Knöpfe) unter dem Vorspann.
- `SpecList` und `DataTable`: Zellen/Werte laufen durch `Rich` (Belege und Code in Zellen), `DataTable` mit optionalem `lang`.
- Neu: `ActionRow.astro` (Knöpfe in Reihenfolge, erster primär).
- CSS: ein Block „Produktseiten“ am Ende von `components.css`.
- Geändert wegen Sammelflips in `ROUTES`: `tests/e2e/home.spec.ts` (alle `enStatus` geplant statt „nur Startseite gebaut“) und `tests/unit/i18n.test.ts` (`isBuilt('/en/product/discovery/')` statt `/preise/`).

## Abweichungen vom Textdokument
- Claim-Spalten der Tabellen/Kennwerte sind Belege hinter dem Wert; „Beleg der Tabelle: C-46“ (Quellränge) steht als Beleg unter der Tabelle.
- Compliance: Hauptknopf „Kontakt“ verlinkt `/kontakt/` ohne Anliegen-Vorauswahl („Sicherheit und Datenschutz“): Das Kontaktdokument definiert keinen Query-Parameter. Folgt, sobald Task 7 einen festlegt.
- Compliance hat eigenen Abschluss (Überschrift „Sie bereiten eine Prüfung vor?“, Knöpfe Kontakt, Live-Demo, 30 Tage testen) statt `Cta`.
- Beschriftungen aus dem Dokument als Hinweiszeile übernommen: „Weitere Arten von Reviews:“, „Beispiel (…)“, „Beispiele (…)“, „Limits“. Der Name „Rangfolge der Quellen“ ist die Tabellenbeschriftung (aria-label), nicht sichtbar.
- Reihenfolge innerhalb von Abschnitten zugunsten des Layouts verschoben: Topologie §2 Screenshot vor der Beispieltabelle; Compliance §1 Screenshot neben dem Text, Kennwerte darunter; API §2 Codebeispiel neben dem Text, Limits darunter.
- Textstellen mit Zahl und Einheit tragen geschütztes Leerzeichen.

## Tests (real)
- `tests/e2e/produkt.spec.ts`: 43 Tests (Chromium), grün: je Seite Titel, h1, h2-Liste exakt, Screenshot-IDs, fortlaufende Abbildungen, Belege, Teilnavigation, Abschluss; Topologie-Stage (Ausgangszustand `pdu-a`, Umschalten), Quellrang-Tabelle, Dokumentenspeicher, API-Code + Kopierknopf, Betriebsleiste, Hauptknöpfe.
- `tests/unit/rich.test.ts`: 7 grün. `npm run check`: 0 Fehler (zeitweise Fehler in fremder `Field.astro`).
- Volllauf (Arbeitsbaum mit allen parallelen Arbeiten): Unit 162 von 164 grün; e2e 12 rot, keine davon auf Produktseiten. Firefox/WebKit nicht gelaufen (nur Chromium-Projekt lokal).
- Seiten-Schleife `pages.spec.ts` (200, eine h1, kein Scrollen 320/768/1280, axe, ...) für alle sieben Produktseiten grün; `validate` ohne Befund auf `dist/produkt/*`.
- Screenshots 1280/360 in dem Scratchpad (`<slug>-1280.png`, `-360.png`) angesehen; Tabellen laufen in Scrollrahmen, Kennwerte stapeln unter 48rem.

## Fremde Fehler (nicht behoben)
- `tests/unit/i18n.test.ts`: `.form.fields.topic.options.enterprise` identisch in en/de (Kontakt). Tokens-Test zeitweise rot.
- e2e: axe/320-px-Scrollen auf /sicherheit/, /preise/, /demo/, /kontakt/, /impressum/, /datenschutz/, /agb/, /subprozessoren/; Server-404-Test; `validate`: unique-landmark/empty-heading auf rechtlichen Seiten und Kontakt.

## Hinweise
- Gemeinsame Dateien (`index.ts`, `routes.ts`, `components.css`) im Commit nur mit meinen Anteilen; Teile der anderen Implementierer blieben unstaged.
- `figure`-Beleg: Unterschrift der Schemazeichnung (C-02) trägt einen Beleg in der `figcaption`.
