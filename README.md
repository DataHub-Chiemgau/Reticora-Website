# Reticora Website

Statische Marketing-Website für Reticora (Astro 7, Tailwind 4, Apache). Aktueller Stand: Phase 5, deutsche Startseite.

## Voraussetzungen

- Node 22 (siehe `.nvmrc`, mindestens 22.23.4)
- `apache2` für den lokalen Testserver (`sudo apt-get install -y apache2`)
- Playwright-Browser für die E2E-Tests (`npx playwright install --with-deps`)

## Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Tokens erzeugen und nach `dist/` bauen (inklusive Entwicklungsseite `/dev/bausteine`) |
| `npm run check` | Astro- und TypeScript-Prüfung |
| `npm test` | Unit-Tests (Vitest); Tests, die `dist/` brauchen, werden ohne Build übersprungen |
| `npm run validate` | HTML-Prüfung von `dist/` (html-validate) |
| `npm run serve` | Apache auf `http://127.0.0.1:8080` mit `dist/` als Wurzel |
| `npm run test:e2e` | Playwright-Tests gegen den Apache-Testserver |
| `npm run lhci` | Lighthouse (fünf Läufe, Mobilprofil) gegen den Apache-Testserver |
| `npm run build:release` | Release-Build ohne Entwicklungsseiten, danach Release-Sperre |

## Release-Sperre

`npm run build:release` bricht heute mit Exit-Code 1 ab, und zwar absichtlich. Die Prüfung listet offene Claims, fehlende Screenshots, noch nicht gebaute Seiten, fehlende Anbieterangaben (E-Mail, Telefon) und Entwicklungsseiten in `dist/`. Die Seite darf nicht online gehen, bevor diese Liste leer ist und die Rechtsprüfung abgeschlossen ist.

## Budgets

Die Tests in `tests/unit/budget.test.ts` messen die von der Startseite geladenen Dateien (gzip): JavaScript höchstens 35 KB, HTML + CSS + JS + Schriften höchstens 200 KB.

## Aufbau

- `src/pages`, `src/components`, `src/layouts`, `src/islands`, `src/styles`: Seiten, Bausteine, Skript-Inseln
- `src/data`: Claims, Screenshots, Preise, Links, Topologie, Anbieterangaben
- `src/i18n`: Texte und Routen
- `src/dev`, `src/integrations`: Entwicklungsseite und ihre Einbindung (fehlt im Release-Build)
- `scripts`: Token-Erzeugung, Schriften, Release-Prüfung
- `tests/unit`, `tests/e2e`, `tests/server`: Tests und Apache-Testserver
- `design`: Design-Quellen und Tokens
- `docs`: Spezifikationen, Inhaltsplan, Designsystem, Compliance-Matrix, Pläne
