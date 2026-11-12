# Phase 5: Grundgerüst und Startseite – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die deutsche Startseite von `www.reticora.de` im Design-System „Leitstand“ bauen, mit Tokens, Bausteinen, Netzschema samt Ausfallsimulation, Apache-Testserver und den Prüfungen dafür.

**Architecture:** Astro erzeugt statische Seiten. Tokens entstehen aus `design/leitstand/tokens.json`, die Baustein-Stile aus `design/leitstand/components/bundle.css`; Tailwind liefert Hilfsklassen. Zwei kleine Skripte ohne Framework (Ausfallsimulation, Kopierknopf) laden als eigene Dateien. Alle Browsertests laufen gegen einen lokalen Apache mit derselben `.htaccess` wie im Deploy.

**Tech Stack:** Node 22.23.4 · astro 7.4.11 · tailwindcss 4.3.5 mit @tailwindcss/vite 4.3.5 · typescript ^6 · @astrojs/check 0.9.12 · vitest 5.1.0 · @playwright/test 1.63.0 · @axe-core/playwright 4.14.0 · html-validate · @lhci/cli · Apache 2.4 (`apache2`) · fonttools (nur für `scripts/build-fonts.sh`)

**Spec:** `docs/specs/2026-11-12-website-spec.md` (mit §14), `docs/design-system.md`, `docs/copy/startseite-de.md`. Markup-Vorlage je Baustein: `design/leitstand/components/<Name>/preview.html`.

## Global Constraints

- Arbeitszweig `claude/phase-5-startseite`, Draft-PR gegen `main`. Commit-Betreff deutsch im Imperativ; jede Commit-Nachricht endet mit den beiden Zeilen `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` und `Claude-Session: https://claude.ai/code/session_01VVbMxUe5x13Myi67JY477Y`.
- Astro: `output: 'static'`, `site: 'https://www.reticora.de'`, `trailingSlash: 'always'`, `build.format: 'directory'`, `build.inlineStylesheets: 'never'`, `vite.build.assetsInlineLimit: 0`. Keine `client:`-Direktiven, kein UI-Framework.
- Im ausgelieferten HTML steht kein `<script>` ohne `src` und kein `style`-Attribut.
- Keine Anfrage an fremde Hosts, kein Cookie, kein Web Storage.
- Farben, Abstände, Radien, Schriften nur aus Tokens. Baustein-Klassen heißen `rt-*` und stammen aus `design/leitstand/components/bundle.css`.
- Texte wörtlich aus `docs/copy/startseite-de.md`. Anführungszeichen „…“, Auslassung `…`, geschütztes Leerzeichen zwischen Zahl und Einheit.
- Jedes Bedienelement mindestens 44 × 44 px; einzige Ausnahme ist die Beleg-Marke im Fließtext (mindestens 24 px hoch).
- Fokus: 2 px Umriss in `accent`, 2 px Abstand. Genau eine `h1` je Seite.
- Adressen außerhalb der Website stehen nur in `src/data/links.ts`.
- Größen: Insel `impact` ≤ 8 KB, Insel `copy` ≤ 1 KB (minifiziert, unkomprimiert); beide Schriftdateien zusammen ≤ 90 KB; JavaScript der Startseite ≤ 35 KB und HTML + CSS + JS + Schriften ≤ 200 KB (gzip).
- Bewegung höchstens 150 ms; mit `prefers-reduced-motion: reduce` keine.

## Review Focus

1. **JavaScript aus:** Alle Texte sind lesbar, Menü und Beleg klappen auf, das Netzschema zeigt den Ausgangszustand mit passendem Satz, die Knöpfe „Ausfall simulieren“ fehlen. → Test in Task 6 und Task 7.
2. **320 px Breite:** Lange Wörter („Ausfallsimulation“, „Geschäftskalender“, „Höheneinheit“) erzeugen kein waagerechtes Scrollen der Seite; das Menü bleibt bedienbar. → Test in Task 7.
3. **Schriften laden nicht:** Text bleibt sichtbar und lesbar in der Ersatzschrift. → Test in Task 2.
4. **Erzwungene Farben (Kontrastmodus von Windows):** Knöpfe, Felder und Knoten-Knöpfe behalten einen sichtbaren Rand, der Fokus bleibt sichtbar; die Ergebniszeile trägt die Aussage des Schemas. → Test in Task 5 und Task 6.
5. **Falsche Adressen:** `/index.html`, Adressen ohne Schrägstrich und unbekannte Pfade enden in einer Umleitung oder auf der 404-Seite mit Navigation und Pflichtlinks; auch diese Antworten tragen die Sicherheits-Kopfzeilen. → Test in Task 3.

---

### Task 1: Grundgerüst, Tokens, Tailwind

**Files:**
- Create: `package.json`, `.nvmrc`, `.gitignore`, `tsconfig.json`, `astro.config.ts`, `vitest.config.ts`
- Create: `scripts/build-tokens.mjs`, `src/styles/tokens.css` (erzeugt), `src/styles/global.css`
- Create: `src/pages/index.astro` (vorläufig; Task 7 ersetzt sie)
- Test: `tests/unit/tokens.test.ts`, `tests/unit/contrast.ts`

**Interfaces:**
- Consumes: `design/leitstand/tokens.json`
- Produces:
  - npm-Skripte `dev`, `tokens`, `build`, `check`, `test`
  - `renderTokensCss(tokens: object): string` (Export von `scripts/build-tokens.mjs`)
  - CSS-Variablen `--<name>` für jeden Farb-, Abstands-, Radius-, Layout- und Umbruch-Token sowie `--font-display`, `--font-text`, `--font-mono`
  - Tailwind-Farben `canvas panel raised line line-strong control fg fg-muted fg-subtle accent accent-strong accent-soft accent-fg signal danger success graph-active graph-failed`; Umbrüche `sm` 480, `md` 768, `lg` 1024, `nav` 1120, `xl` 1280 px
  - `contrast(hexA: string, hexB: string): number` (Export von `tests/unit/contrast.ts`, WCAG 2)

- [ ] **Step 1: Projekt anlegen.** `package.json` mit `"type": "module"`, `"engines": {"node": ">=22.23.4"}`, den Versionen aus „Tech Stack“ als exakte `devDependencies` und den Skripten `dev: astro dev`, `tokens: node scripts/build-tokens.mjs`, `build: npm run tokens && astro build`, `check: astro check`, `test: vitest run`. `.nvmrc`: `22`. `.gitignore`: `node_modules/`, `dist/`, `.astro/`, `test-results/`, `playwright-report/`, `.lighthouseci/`. `tsconfig.json` erweitert `astro/tsconfigs/strict`. `astro.config.ts` mit den Werten aus „Global Constraints“, dem Vite-Plugin `tailwindcss()` und `i18n: { defaultLocale: 'de', locales: ['de', 'en'], routing: { prefixDefaultLocale: false } }`. `npm install`.

- [ ] **Step 2: Fehlschlagende Tests schreiben** (`tests/unit/tokens.test.ts`):

```ts
test('tokens.css entspricht tokens.json', () => {
  expect(read('src/styles/tokens.css')).toBe(renderTokensCss(JSON.parse(read('design/leitstand/tokens.json'))));
});
test('jedes Thema definiert jede Farbe', () => { /* je Thema: jede color.tokens[].name als --name im Block */ });
test.each(PAIRS)('%s auf %s im Thema %s ≥ %d', (fg, bg, theme, min) => {
  expect(contrast(color(fg, theme), color(bg, theme))).toBeGreaterThanOrEqual(min);
});
```

`PAIRS` (Vordergrund, Grund, Thema, Mindestwert):

| Vordergrund | Gründe | leitstand | dokument |
|---|---|---|---|
| `fg`, `fg-muted` | `canvas`, `panel`, `raised` | 7 | 4.5 |
| `fg-subtle`, `accent`, `signal`, `danger`, `success` | `canvas`, `panel` | 4.5 | 4.5 |
| `accent-strong` | `canvas`, `accent-soft` | 4.5 | 4.5 |
| `accent-fg` | `accent`, `accent-strong` | 4.5 | 4.5 |
| `control` | `canvas`, `panel`, `raised` | 3 | 3 |
| `graph-active`, `graph-failed` | `panel` | 3 | 3 |

- [ ] **Step 3: Tests laufen lassen.** Run: `npm test` · Expected: FAIL (`renderTokensCss` fehlt).

- [ ] **Step 4: `renderTokensCss` und das Skript schreiben.** Ausgabe in dieser Reihenfolge: Kommentarzeile `/* erzeugt aus design/leitstand/tokens.json – nicht von Hand ändern */`; Block `:root, [data-theme="leitstand"] { color-scheme: dark; … }` mit allen Farben des ersten Themas; Block `[data-theme="dokument"] { color-scheme: light; … }`; Block `:root { … }` mit `spacing`, `radius`, `layout`, `breakpoint` und den drei Schriftfamilien. Ohne Argument aufgerufen schreibt das Skript `src/styles/tokens.css`.

- [ ] **Step 5: `src/styles/global.css` schreiben:** `@import "tailwindcss";`, `@import "./tokens.css";`, dann `@theme inline` mit `--color-*: initial`, je Farbe `--color-<name>: var(--<name>)`, `--breakpoint-*: initial` und den fünf Umbrüchen in `rem`. Radien und Schriften werden nicht in `@theme` wiederholt (gleiche Variablennamen wie in `tokens.css`).

- [ ] **Step 6: Vorläufige Seite** `src/pages/index.astro`: `<html lang="de" data-theme="leitstand">`, importiert `global.css`, enthält `<main id="inhalt"><h1 class="display-xl">Reticora</h1></main>`.

- [ ] **Step 7: Prüfen.** Run: `npm test && npm run build && npm run check` · Expected: alle Tests PASS, `dist/index.html` vorhanden, `astro check` ohne Fehler.

- [ ] **Step 8: Commit** „Grundgerüst mit Astro, Tailwind und erzeugten Tokens“.

---

### Task 2: Schriften, Grundstile, Seitenrahmen

**Files:**
- Create: `scripts/build-fonts.sh`, `src/assets/fonts/archivo-leitstand.woff2`, `src/assets/fonts/jetbrains-mono-leitstand.woff2`, `public/lizenzen/OFL-Archivo.txt`, `public/lizenzen/OFL-JetBrains-Mono.txt`
- Create: `src/styles/fonts.css`, `src/styles/type.css`, `src/styles/base.css`
- Create: `src/layouts/Leitstand.astro`, `src/components/BrandMark.astro`
- Modify: `src/styles/global.css` (drei Importe), `src/pages/index.astro` (nutzt das Layout)
- Test: `tests/unit/dist.test.ts`, `tests/e2e/shell.spec.ts`, `playwright.config.ts` (vorläufig mit `astro preview`; Task 3 stellt auf Apache um)

**Interfaces:**
- Consumes: Tokens aus Task 1; `design/leitstand/fonts/*.woff2`; `design/leitstand/assets/Lizenzen/*.txt`
- Produces:
  - `Leitstand.astro` mit Props `{ title: string; description: string; lang: 'de' | 'en'; path: string; noindex?: boolean }`; rendert `<html lang data-theme="leitstand">`, Sprunglink „Zum Inhalt“ auf `#inhalt`, `<main id="inhalt">` mit `<slot />`; Kopf- und Fußzeile kommen in Task 5 dazu
  - `BrandMark.astro` mit Prop `{ class?: string }`: das SVG aus `design/leitstand/components/SiteHeader/preview.html`, `aria-hidden="true"`
  - Typ-Klassen `display-xl display-l heading-l heading-m heading-s lead body body-s caption data data-label`
  - npm-Skript `test:e2e: playwright test`

- [ ] **Step 1: Schriften kürzen.** `scripts/build-fonts.sh` nutzt `fonttools`: Archivo auf `wdth=100:112`, `wght=400:600` begrenzen, JetBrains Mono auf `wght=400:500`; beide auf die Zeichen `U+0020-007E, U+00A0-00FF, U+2013, U+2018-201A, U+201C-201E, U+2022, U+2026, U+20AC, U+2192` kürzen; Ausgabe als WOFF2 in `src/assets/fonts/`. Skript ausführen, Dateien einchecken. Lizenztexte nach `public/lizenzen/` kopieren.

- [ ] **Step 2: Fehlschlagende Tests schreiben.**

```ts
// tests/unit/dist.test.ts (läuft nach npm run build)
test('kein Inline-Skript und kein style-Attribut im HTML', () => { /* jede dist/**/*.html: kein <script ohne src=, kein ' style="' */ });
test('Schriften zusammen höchstens 90 KB', () => { /* Summe dist/_astro/*.woff2 <= 90_000 */ });
test('jede @font-face-Regel hat font-display: swap', () => { /* dist/_astro/*.css */ });

// tests/e2e/shell.spec.ts
test('display-xl misst 36 px bei 360 und 72 px bei 1280', ...);   // getComputedStyle(h1).fontSize, Toleranz 0.5
test('Archivo lädt vom eigenen Host mit Hash im Namen', ...);      // Antwort-URL passt auf /_astro/archivo-leitstand.[hash].woff2
test('html trägt lang="de" und data-theme="leitstand"; genau eine h1', ...);
test('Sprunglink ist das erste fokussierbare Element und führt zu #inhalt', ...);
test('ohne Schriftdateien bleibt die h1 sichtbar', ...);           // route('**/*.woff2', abort); boundingBox().width > 0
```

- [ ] **Step 3: Tests laufen lassen.** Run: `npm run build && npm test && npm run test:e2e` · Expected: FAIL.

- [ ] **Step 4: Stile schreiben.** `fonts.css`: zwei `@font-face`-Regeln (`Archivo`, `font-weight: 400 600`, `font-stretch: 100% 112%`; `JetBrains Mono`, `font-weight: 400 500`), `font-display: swap`, `src` als relative URL auf `src/assets/fonts/`. `base.css`: die Grundregeln vom Anfang von `design/leitstand/components/bundle.css` (bis einschließlich `a:hover`), dazu `.sr-skip` für den Sprunglink. `type.css`: die elf Klassen mit diesen Größen (fließend zwischen 360 und 1280 px Breite):

| Klasse | `font-size` | `line-height` | weitere |
|---|---|---|---|
| `display-xl` | `clamp(2.25rem, 1.37rem + 3.913vw, 4.5rem)` | `clamp(2.5rem, 1.717rem + 3.478vw, 4.5rem)` | 600, `font-stretch: 112%`, `letter-spacing: -0.02em`, Familie display |
| `display-l` | `clamp(2rem, 1.511rem + 2.174vw, 3.25rem)` | `clamp(2.25rem, 1.761rem + 2.174vw, 3.5rem)` | wie oben |
| `heading-l` | `clamp(1.75rem, 1.554rem + 0.87vw, 2.25rem)` | `clamp(2.125rem, 1.929rem + 0.87vw, 2.625rem)` | 600, 112 %, `-0.015em` |
| `heading-m` | `clamp(1.375rem, 1.277rem + 0.435vw, 1.625rem)` | `clamp(1.75rem, 1.652rem + 0.435vw, 2rem)` | 600, 112 %, `-0.01em` |
| `heading-s` | `1.1875rem` | `1.625rem` | 600, 106 % |
| `lead` | `clamp(1.125rem, 1.076rem + 0.217vw, 1.25rem)` | `clamp(1.75rem, 1.652rem + 0.435vw, 2rem)` | 400, Familie text |
| `body` | `1.0625rem` | `1.75rem` | 400 |
| `body-s` | `0.9375rem` | `1.5rem` | 400 |
| `caption` | `0.8125rem` | `1.25rem` | 400 |
| `data` | `0.875rem` | `1.375rem` | 400, Familie mono, `font-variant-numeric: tabular-nums` |
| `data-label` | `0.75rem` | `1rem` | 500, Familie mono, `letter-spacing: 0.04em` |

- [ ] **Step 5: `Leitstand.astro` und `BrandMark.astro` schreiben**; `<head>` mit `charset`, `viewport`, `title`, `description`, kanonischer Adresse aus `Astro.site` und `path`, `robots noindex` wenn `noindex` oder `process.env.RETICORA_RELEASE !== '1'`, Vorabladen von Archivo. `index.astro` auf das Layout umstellen.

- [ ] **Step 6: Prüfen.** Run: `npm run build && npm test && npm run test:e2e` · Expected: PASS.

- [ ] **Step 7: Commit** „Schriften, Grundstile und Seitenrahmen Leitstand“.

---

### Task 3: Apache-Testserver, `.htaccess`, 404-Seite

**Files:**
- Create: `tests/server/start.sh`, `tests/server/httpd.conf.tmpl`, `public/.htaccess`, `src/pages/404.astro`
- Modify: `playwright.config.ts` (`webServer`), `package.json` (Skript `serve`)
- Test: `tests/e2e/server.spec.ts`, `tests/e2e/privacy.spec.ts`

**Interfaces:**
- Consumes: `dist/` aus `npm run build`
- Produces: `npm run serve` startet Apache im Vordergrund auf `http://127.0.0.1:8080` mit `dist/` als Wurzel und `AllowOverride All`; `playwright.config.ts` nutzt `baseURL: 'http://127.0.0.1:8080'`, `webServer: { command: 'npm run build && npm run serve', url: baseURL, reuseExistingServer: !process.env.CI }`, Projekte `chromium` immer, `firefox` und `webkit` nur wenn `process.env.CI`

- [ ] **Step 1: Fehlschlagende Tests schreiben.**

```ts
// tests/e2e/server.spec.ts
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
for (const path of ['/', '/gibt-es-nicht/', '/index.html'])
  test(`Kopfzeilen auf ${path}`, async ({ request }) => {
    const r = await request.get(path, { maxRedirects: 0 });
    expect(r.headers()['content-security-policy']).toBe(CSP);
    expect(r.headers()['strict-transport-security']).toBe('max-age=31536000');
    expect(r.headers()['x-content-type-options']).toBe('nosniff');
    expect(r.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(r.headers()['cross-origin-opener-policy']).toBe('same-origin');
    expect(r.headers()['permissions-policy']).toContain('camera=()');
  });
test('/index.html leitet dauerhaft auf / um', ...);                         // 301, Location endet auf '/'
test('Host reticora.de leitet in einem Schritt auf https://www.reticora.de/ um', ...);  // Header Host, 301, exakte Location
test('Host www.reticora.de über http leitet auf https um', ...);
test('unbekannter Pfad: Status 404, Seite mit Links Startseite, Impressum, Datenschutz', ...);
test('Dateien unter /_astro/ ein Jahr im Cache, HTML ohne Cache', ...);     // 'public, max-age=31536000, immutable' bzw. 'no-cache'
test('keine CSP-Verstöße in der Konsole', ...);

// tests/e2e/privacy.spec.ts
test('Startseite: keine fremden Hosts, keine Cookies, leerer Web Storage', ...);
```

- [ ] **Step 2: Tests laufen lassen.** Run: `npm run test:e2e` · Expected: FAIL.

- [ ] **Step 3: `tests/server/start.sh` schreiben.** Bricht mit klarer Meldung ab, wenn `apache2` fehlt (`sudo apt-get install -y apache2`). Erzeugt aus `httpd.conf.tmpl` eine Konfiguration in einem temporären Verzeichnis (`Listen 127.0.0.1:8080`, `DocumentRoot` = `dist`, Module `mpm_event`, `authz_core`, `dir`, `mime`, `rewrite`, `headers`, `expires`, `deflate`, `setenvif`, `<Directory> AllowOverride All`, Protokolle nach stderr) und startet `apache2 -DFOREGROUND -f <datei>`.

- [ ] **Step 4: `public/.htaccess` schreiben** (dieser Inhalt, ergänzt um die vollständige `Permissions-Policy`):

```apache
Options -Indexes
ErrorDocument 404 /404.html
RewriteEngine On
# Produktionshost: http und ohne www in einem Schritt auf https://www
RewriteCond %{HTTP_HOST} ^(www\.)?reticora\.de$ [NC]
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} !^www\. [NC]
RewriteRule ^ https://www.reticora.de%{REQUEST_URI} [R=301,L]
# index.html nie in der Adresse
RewriteCond %{THE_REQUEST} \s/+(.*/)?index\.html[\s?] [NC]
RewriteRule ^(.*/)?index\.html$ /$1 [R=301,L]
Header always set Strict-Transport-Security "max-age=31536000"
Header always set Content-Security-Policy "<CSP wie im Test>"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Cross-Origin-Opener-Policy "same-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
<FilesMatch "\.html$">
  Header always set Cache-Control "no-cache"
</FilesMatch>
<If "%{REQUEST_URI} =~ m#^/_astro/#">
  Header always set Cache-Control "public, max-age=31536000, immutable"
</If>
AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
```

- [ ] **Step 5: `src/pages/404.astro`** im Layout `Leitstand` (`noindex`): `h1` „Diese Seite gibt es nicht“, ein Satz, Links „Zur Startseite“ (`/`), „Kontakt“ (`/kontakt/`), „Impressum“ (`/impressum/`), „Datenschutz“ (`/datenschutz/`).

- [ ] **Step 6: Prüfen.** Run: `npm run test:e2e` · Expected: PASS.

- [ ] **Step 7: Commit** „Apache-Testserver, .htaccess mit Sicherheits-Kopfzeilen, 404-Seite“.

---

### Task 4: Daten und Rechenregeln

**Files:**
- Create: `src/data/types.ts`, `src/data/site.ts`, `src/data/links.ts`, `src/data/pricing.ts`, `src/data/claims.ts`, `src/data/screenshots.ts`, `src/data/topology.ts`, `src/lib/impact.ts`
- Test: `tests/unit/impact.test.ts`, `tests/unit/data.test.ts`

**Interfaces:**
- Produces:

```ts
// src/data/types.ts
export type Lang = 'de' | 'en';
export type ClaimId = `C-${string}`;
export type ScreenshotId = `S-${string}`;
export interface Claim { id: ClaimId; title: Record<Lang, string>; evidence: Record<Lang, string>; asOf: string; status: 'offen' | 'geprüft'; checkedBy?: string; checkedOn?: string }
export interface Screenshot { id: ScreenshotId; motif: Record<Lang, string>; width: number; height: number; file?: string }
export interface Plan { id: 'essentials' | 'standard' | 'pro' | 'enterprise-shared' | 'enterprise-local'; name: string; monthly: number; from: boolean; yearly: number | null; betaYearly: number | null; summary: Record<Lang, string> }
export interface TopoNode { id: string; x: number; y: number; label: 'top' | 'left' | 'right' | 'side' | 'below' }
export interface TopoEdge { from: string; to: string; rel: 'powered_by' | 'hosted_on'; labelAt: number }

// src/data/*.ts
export const SITE: { company: string; street: string; city: string; email: string | null; phone: string | null };
export const LINKS: { signup: string; login: string; demo: string; demoUser: string; demoPassword: string };
export const PLANS: readonly Plan[]; export const EXTRAS: { perCiMonthly: 0.05; perMonitoringServiceMonthly: 0.03 }; export const BETA: { firstSixMonths: 0.2; nextSixMonths: 0.1 };
export const CLAIMS: readonly Claim[]; export function claim(id: ClaimId): Claim;   // wirft bei unbekannter ID
export const SCREENSHOTS: readonly Screenshot[]; export function screenshot(id: ScreenshotId): Screenshot;
export const TOPO_NODES: readonly TopoNode[]; export const TOPO_EDGES: readonly TopoEdge[]; export const TOPO_INITIAL_FAILED: readonly string[];  // ['pdu-a']

// src/lib/impact.ts
export const REDUNDANT_RELS: ReadonlySet<string>;   // powered_by, member_of_cluster
export interface ImpactResult { failed: string[]; affected: string[]; guarded: string[] }   // jeweils in Knotenreihenfolge
export function computeImpact(nodes: readonly string[], edges: readonly Pick<TopoEdge, 'from' | 'to' | 'rel'>[], failed: readonly string[]): ImpactResult;
export function impactSentence(lang: Lang, r: ImpactResult): { main: string; guarded: string | null };
```

- [ ] **Step 1: Fehlschlagende Tests schreiben.** `impact.test.ts` prüft die sechs Zeilen aus `docs/design-system.md` §6.2 (z. B. `computeImpact(N, E, ['pdu-a'])` → `affected: ['sw-access-01']`, `guarded: ['srv-01', 'srv-02']`; `['usv-01']` → acht betroffene) und je Fall den Satz aus §6.4 wörtlich in beiden Sprachen (z. B. `main: 'Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt).'`, `guarded: 'Durch Redundanz geschützt: srv-01, srv-02.'`; leere Auswahl → `'Wählen Sie ein CI, um seinen Ausfall zu simulieren.'`). Dazu: Ein Knoten mit zwei `hosted_on`-Versorgern fällt aus, sobald einer ausfällt; ein unbekannter Knoten in `failed` wird ignoriert. `data.test.ts` prüft: `betaYearly === Math.round(yearly * 0.9)` für jedes Paket mit Jahrespreis; Preise 49/490, 119/1190, 299/2990, 999 und 1999 mit `from: true`; Claim-IDs eindeutig, jede mit deutschem Titel und Beleg, alle `status: 'offen'`; Screenshots S-01 bis S-18 lückenlos; alle Werte in `LINKS` beginnen mit `https://` außer `demoUser` und `demoPassword`.

- [ ] **Step 2: Tests laufen lassen.** Run: `npm test` · Expected: FAIL.

- [ ] **Step 3: Daten anlegen.** `site.ts`: Firmierung und Anschrift aus `docs/project-brief.md` W-E05, `email` und `phone` `null`. `links.ts`: `https://www.reticora.cloud/onboarding`, `https://www.reticora.cloud/login`, `https://www.demo.reticora.cloud`, `demo@reticora.cloud`, `Demo`. `pricing.ts` nach `docs/content-plan.md` §6.1, Kurzbeschreibungen aus `docs/copy/startseite-de.md` §10 (englisch sinngleich). `claims.ts`: alle Einträge aus `docs/content-plan.md` §7 und die neuen aus `docs/copy/startseite-de.md` (C-26 bis C-38), mit den dort genannten Änderungen an C-01, C-06, C-13; `evidence` nennt die Tatsache, nicht das Repository; `asOf: '2026-11'`. `screenshots.ts` nach `docs/content-plan.md` §8, 1440 × 900, S-05 720 × 900. `topology.ts`: Knoten und Kanten mit den Koordinaten aus `design/leitstand/components/TopologyStage/preview.html` (viewBox `0 0 1100 420`).

- [ ] **Step 4: `computeImpact` und `impactSentence` schreiben.** Abschluss über die Kanten: Ein Knoten fällt aus, wenn für einen Beziehungstyp alle seine Versorger ausgefallen sind (redundanter Typ) bzw. einer (sonst). `guarded`: nicht ausgefallen, aber mit mindestens einem ausgefallenen Versorger über einen redundanten Typ.

- [ ] **Step 5: Prüfen.** Run: `npm test` · Expected: PASS.

- [ ] **Step 6: Commit** „Datendateien und Rechenregeln der Ausfallsimulation“.

---

### Task 5: Bausteine

**Files:**
- Create: `src/styles/components.css`
- Create in `src/components/`: `Button.astro`, `SiteHeader.astro`, `SiteFooter.astro`, `StatusStrip.astro`, `ScreenshotSlot.astro`, `SpecList.astro`, `Beleg.astro`, `Steps.astro`, `DataTable.astro`, `CodeSample.astro`, `Notice.astro`, `StatusTag.astro`, `Section.astro`
- Create: `src/islands/copy.ts`, `src/i18n/de.ts`, `src/integrations/dev-pages.ts`, `src/dev/bausteine.astro`
- Modify: `src/styles/global.css`, `src/layouts/Leitstand.astro` (Kopf- und Fußzeile), `astro.config.ts` (Integration)
- Test: `tests/e2e/components.spec.ts`

**Interfaces:**
- Consumes: `claim()`, `screenshot()`, `LINKS`, `SITE` aus Task 4; `BrandMark` aus Task 2
- Produces (Props; Beschriftungen kommen als Slot, sofern nicht anders genannt):

| Baustein | Props |
|---|---|
| `Button` | `{ href?: string; variant?: 'primary' \| 'secondary' \| 'quiet'; size?: 'md' \| 'lg'; type?: 'button' \| 'submit' }` (mit `href` ein `a`, sonst `button`) |
| `SiteHeader` | `{ lang: Lang; path: string }` |
| `SiteFooter` | `{ lang: Lang }` |
| `StatusStrip` | `{ items: { label: string; value: string }[] }` |
| `ScreenshotSlot` | `{ id: ScreenshotId; figure: number; caption: string; ratio?: '16x10' \| '4x5'; lang: Lang }` |
| `SpecList` | `{ items: { term: string; value: string; claim?: ClaimId }[]; lang: Lang }` |
| `Beleg` | `{ claim: ClaimId; lang: Lang }` |
| `Steps` | `{ steps: { title: string; text: string }[] }` |
| `DataTable` | `{ label: string; columns: { key: string; head: string; numeric?: boolean }[]; rows: Record<string, string>[]; rowHeader: string }` |
| `CodeSample` | `{ title: string; copyLabel: string; copiedLabel: string }`, Code als Slot |
| `Notice` | `{ variant?: 'info' \| 'signal'; lead: string }` |
| `StatusTag` | `{ tone?: 'ok' \| 'signal' \| 'danger' \| 'neutral' }` |
| `Section` | `{ id: string; title: string; lead?: string }` (rendert `section` mit `h2.heading-l`) |

  `src/i18n/de.ts` exportiert `UI: { nav: {...}; actions: { trial: '30 Tage testen'; demo: 'Live-Demo'; login: 'Anmelden'; contact: 'Kontakt' }; b2b: 'Angebot nur für Unternehmen.'; skip: 'Zum Inhalt'; menu: 'Menü'; beleg: 'Beleg'; copy: 'Kopieren'; copied: 'Kopiert'; placeholder: 'Platzhalter für Screenshot'; ... }`. Die Entwicklungsseite liegt unter `/dev/bausteine/` und wird nur ohne `RETICORA_RELEASE=1` eingehängt.

- [ ] **Step 1: Fehlschlagende Tests schreiben** (`tests/e2e/components.spec.ts`, Seite `/dev/bausteine/`):

```ts
test('axe ohne Befunde, im Thema Leitstand und im Abschnitt data-theme="dokument"', ...);
test('jedes Bedienelement außer .rt-beleg > summary misst mindestens 44 × 44 px', ...);   // a.rt-btn, button, summary, .rt-nav a, .rt-lang a
test('Menü und Beleg öffnen und schließen per Tastatur', ...);                              // focus + Enter auf summary
test('Kopierknopf kopiert den Code und meldet „Kopiert“', ...);                             // Zwischenablage-Recht, role=status
test('erzwungene Farben: Knöpfe haben einen 1 px breiten Rand, der Fokus bleibt sichtbar', ...);  // emulateMedia({ forcedColors: 'active' })
test('ScreenshotSlot zeigt ID, Motiv und Zielmaß und hat das Seitenverhältnis des Manifests', ...);
test('aktive Navigation trägt aria-current="page"; die aktive Sprache ist kein Link', ...);
```

- [ ] **Step 2: Tests laufen lassen.** Run: `npm run test:e2e -- components` · Expected: FAIL.

- [ ] **Step 3: `components.css` anlegen:** die Regeln ab `/* Knopf */` aus `design/leitstand/components/bundle.css` in `@layer components`, ohne die Vorschau-Hilfen (`.rt-stage`, `.rt-row`, `.rt-stack`). Ergänzen: `.rt-slot--4x5 { aspect-ratio: 4 / 5; }`, `.rt-topo .lbl-start { text-anchor: start; }`, `.rt-topo .lbl-end { text-anchor: end; }`, `@media (forced-colors: active) { .rt-btn { border-color: ButtonText; } }`. In `global.css` importieren.

- [ ] **Step 4: Bausteine schreiben.** Markup je Baustein wie in `design/leitstand/components/<Name>/preview.html`, Regeln aus dem `README.md` daneben. `SiteHeader`: Navigation in der Zeile ab Umbruch `nav`, darunter das `details`-Menü; Ziele der drei Handlungen aus `LINKS` bzw. `/demo/`. `Beleg` und `ScreenshotSlot` lesen Titel, Beleg, Motiv und Maße aus den Datendateien. `CodeSample` bindet `src/islands/copy.ts` ein; ohne JavaScript ist der Knopf `hidden`.

- [ ] **Step 5: Entwicklungsseite** `src/dev/bausteine.astro` mit je einem Beispiel pro Baustein und einem Abschnitt `data-theme="dokument"`; `src/integrations/dev-pages.ts` hängt sie per `injectRoute` ein.

- [ ] **Step 6: Prüfen.** Run: `npm run test:e2e -- components && npm test` · Expected: PASS (auch `tests/unit/dist.test.ts`).

- [ ] **Step 7: Commit** „Bausteine des Design-Systems mit Entwicklungsseite“.

---

### Task 6: Netzschema mit Ausfallsimulation

**Files:**
- Create: `src/components/TopologyStage.astro`, `src/islands/impact.ts`
- Modify: `src/dev/bausteine.astro`
- Test: `tests/e2e/topology.spec.ts`, `tests/unit/dist.test.ts` (Größe der Insel)

**Interfaces:**
- Consumes: `TOPO_NODES`, `TOPO_EDGES`, `TOPO_INITIAL_FAILED`, `computeImpact`, `impactSentence` aus Task 4
- Produces: `TopologyStage.astro` mit Props `{ lang: Lang }`. Markup: `section.rt-topo[data-topo][data-lang]`; SVG `role="img"` mit `title` und `desc`; je Kante `g.e[data-from][data-to][data-rel]`, je Knoten `g.n[data-id]`; Knopfgruppe `div.rt-topo-controls[role="group"][hidden]` mit `button.rt-chip[data-ci][aria-pressed]`; `p.rt-topo-result[role="status"]`; Legende

- [ ] **Step 1: Fehlschlagende Tests schreiben.**

```ts
test('Ausgangszustand: pdu-a ausgefallen, Satz „Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt). Durch Redundanz geschützt: srv-01, srv-02.“', ...);
test('pdu-b dazu: „Fallen 2 CIs (pdu-a, pdu-b) gemeinsam aus, sind 6 weitere CIs betroffen (grau dargestellt).“', ...);
test('usv-01 allein: 8 betroffen; vm-db-01 allein: „… ist kein weiteres CI betroffen.“; nichts gewählt: Aufforderung', ...);
test('Klick auf einen Punkt wirkt wie der Knopf', ...);
test('Leertaste schaltet aria-pressed; der Punkt des fokussierten Knopfs trägt .is-focus', ...);
test('betroffene Knoten tragen .is-affected, ihre Kanten .is-dim; ausgefallene .is-failed', ...);
test('ohne JavaScript: Knopfgruppe verborgen, Ausgangssatz im HTML, Klassen des Ausgangszustands gesetzt', ...);   // javaScriptEnabled: false
test('reduzierte Bewegung: transition-duration der Punkte ist 0s', ...);
test('erzwungene Farben: Knoten-Knöpfe haben einen sichtbaren Rand', ...);
test('axe ohne Befunde auf dem Schema', ...);
// tests/unit/dist.test.ts
test('Insel impact höchstens 8 KB', ...);
```

- [ ] **Step 2: Tests laufen lassen.** Run: `npm run test:e2e -- topology` · Expected: FAIL.

- [ ] **Step 3: `TopologyStage.astro` schreiben.** Der Server rendert den Ausgangszustand vollständig (Klassen und Satz aus `computeImpact(…, TOPO_INITIAL_FAILED)` und `impactSentence`). Kantenlinien enden 14 Einheiten vor den Punkten; die Beschriftung liegt bei `labelAt` auf der Kante, entlang der Kante gedreht, 5 Einheiten darüber. Namen nach `label`: `top` über dem Punkt, `left`/`right` daneben (`lbl-end`/`lbl-start`), `side` rechts unten, `below` darunter.

- [ ] **Step 4: `src/islands/impact.ts` schreiben.** Liest Knoten und Kanten aus dem Markup, entfernt `hidden` von der Knopfgruppe, schaltet bei Klick auf Knopf oder Punkt die Auswahl um, setzt Klassen, `aria-pressed` und den Text der Ergebniszeile über `textContent`. Kein Zustand außerhalb des DOM, kein Speicher.

- [ ] **Step 5: Prüfen.** Run: `npm run build && npm test && npm run test:e2e -- topology` · Expected: PASS.

- [ ] **Step 6: Commit** „Netzschema mit Ausfallsimulation nach den Regeln der App“.

---

### Task 7: Startseite

**Files:**
- Create: `src/content/de/home.ts`, `src/components/ConnectionSchema.astro`, `src/i18n/routes.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: alle Bausteine aus Task 5 und 6, Daten aus Task 4
- Produces:
  - `HOME` (Export von `src/content/de/home.ts`): die Texte aus `docs/copy/startseite-de.md`, nach Abschnitten gegliedert
  - `ROUTES: { de: string; en: string | null; status: 'gebaut' | 'geplant' }[]` (Export von `src/i18n/routes.ts`); „geplant“ sind alle Seiten aus `docs/content-plan.md` §2 außer `/` und `/404`
  - `ConnectionSchema.astro` mit Props `{ lang: Lang }`: SVG `role="img"`, links eine Fläche „Ihr Netz“ mit vier Punkten und dem Collector, rechts eine Fläche „Reticora (EU)“, dazwischen zwei Linien von links nach rechts mit den Beschriftungen `HTTPS 443` und `NATS mTLS 4222`; Farben aus Tokens

- [ ] **Step 1: Fehlschlagende Tests schreiben.**

```ts
test('Titel und Beschreibung wie im Textdokument', ...);
test('h1 lautet „Die CMDB, die Ihr Netz selbst ausliest und jeden Wert belegt.“', ...);
test('zehn h2 in dieser Reihenfolge', ...);   // So entsteht Ihr Bestand … Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.
test('Hauptknopf führt zu LINKS.signup, „Live-Demo“ zu /demo/, „Anmelden“ zu LINKS.login', ...);
test('„Angebot nur für Unternehmen.“ steht am Einstieg, bei den Paketen und im Abschluss', ...);
test('Platzhalter S-02, S-03, S-04, S-05, S-06, S-18 vorhanden; Abb. 1 bis 7 in Reihenfolge', ...);
test('Betriebsleiste nennt Sweep, Poll, Puffer, Verbindung, Hosting mit den Werten aus dem Textdokument', ...);
test('Pakettabelle zeigt fünf Pakete mit 49 €, 119 €, 299 €, ab 999 €, ab 1.999 €', ...);
test('axe ohne Befunde', ...);
for (const w of [320, 360, 768, 1280]) test(`kein waagerechtes Scrollen bei ${w} px`, ...);   // scrollWidth === clientWidth
test('ohne JavaScript: alle zehn h2 sichtbar, Menü öffnet, Belege öffnen', ...);
test('jeder interne Link zeigt auf eine Adresse aus ROUTES', ...);
```

- [ ] **Step 2: Tests laufen lassen.** Run: `npm run test:e2e -- home` · Expected: FAIL.

- [ ] **Step 3: `home.ts` und `routes.ts` anlegen**, Texte wörtlich übernehmen.

- [ ] **Step 4: `index.astro` bauen** in der Reihenfolge des Textdokuments. Einstieg: `h1.display-xl` (höchstens 18 Zeichen breit je Zeile über `max-width: 18ch`), darunter Vorspann links und die zwei Knöpfe rechts, dann `TopologyStage`, dann `StatusStrip`. Abschnitt 3 und 4: Text und Abbildung nebeneinander ab Umbruch `lg`; in Abschnitt 4 Abb. 4 über die volle Breite, darunter Abb. 5 (`4x5`) neben Abb. 6. Abschnitt 6 als Definitionsliste, zweispaltig ab `md`. Abschnitt 10 als `DataTable`. Jeder Abschnitt ist ein Band mit Haarlinie und den Innenabständen aus `docs/design-system.md` §4.

- [ ] **Step 5: `ConnectionSchema.astro` schreiben.**

- [ ] **Step 6: Prüfen.** Run: `npm run build && npm test && npm run test:e2e` · Expected: PASS.

- [ ] **Step 7: Commit** „Startseite deutsch“.

---

### Task 8: Budgets, Verweise, Release-Sperre, CI

**Files:**
- Create: `scripts/lib/release-checks.mjs`, `scripts/check-release.mjs`, `lighthouserc.json`, `.htmlvalidate.json`, `.github/workflows/ci.yml`, `README.md`
- Modify: `package.json` (Skripte `build:release`, `validate`, `lhci`)
- Test: `tests/unit/release-checks.test.ts`, `tests/unit/budget.test.ts`

**Interfaces:**
- Consumes: `CLAIMS`, `SCREENSHOTS`, `SITE`, `ROUTES`
- Produces:
  - `checkClaims(claims): string[]`, `checkScreenshots(list): string[]`, `checkRoutes(routes): string[]`, `checkSite(site): string[]` (je eine Liste von Mängeln, leer heißt in Ordnung)
  - `npm run build:release` = `RETICORA_RELEASE=1 npm run build && node scripts/check-release.mjs` (Exit-Code 1 und Liste der Mängel, wenn eine Prüfung etwas findet)

- [ ] **Step 1: Fehlschlagende Tests schreiben.**

```ts
// release-checks.test.ts
test('offener Claim wird mit ID gemeldet', () => expect(checkClaims([{ id: 'C-01', status: 'offen' }])).toEqual(['C-01: nicht geprüft']));
test('geprüfter Claim ohne Name oder Datum wird gemeldet', ...);
test('Screenshot ohne Datei wird gemeldet', () => expect(checkScreenshots([{ id: 'S-02' }])).toEqual(['S-02: Bild fehlt']));
test('geplante Seite wird gemeldet', ...);
test('fehlende E-Mail-Adresse und Telefonnummer des Anbieters werden gemeldet', ...);
// budget.test.ts (nach npm run build, Größen mit gzip)
test('JavaScript der Startseite höchstens 35 KB', ...);
test('HTML + CSS + JS + Schriften der Startseite höchstens 200 KB', ...);
```

- [ ] **Step 2: Tests laufen lassen.** Run: `npm run build && npm test` · Expected: FAIL.

- [ ] **Step 3: Prüfungen und `check-release.mjs` schreiben.** Der Stand heute muss scheitern: `npm run build:release` endet mit Exit-Code 1 und nennt offene Claims, fehlende Bilder, geplante Seiten und fehlende Anbieterangaben.

- [ ] **Step 4: Werkzeuge einrichten.** `.htmlvalidate.json` mit `html-validate:recommended`; Skript `validate: html-validate "dist/**/*.html"`. `lighthouserc.json`: Adresse `http://127.0.0.1:8080/`, fünf Läufe, Mobilprofil, Grenzen `largest-contentful-paint` ≤ 2000, `cumulative-layout-shift` ≤ 0.05, `total-blocking-time` ≤ 150, Kategorien `performance`, `accessibility`, `best-practices` ≥ 0.95 (SEO erst im Release-Build).

- [ ] **Step 5: CI** `.github/workflows/ci.yml` bei Push und Pull Request: Node aus `.nvmrc`, `npm ci`, `sudo apt-get install -y apache2`, `npm run check`, `npm run build`, `npm test`, `npm run validate`, `npx playwright install --with-deps`, `npm run test:e2e`, `npm run lhci`, `npm audit --omit=dev --audit-level=high`.

- [ ] **Step 6: `README.md`:** Voraussetzungen (Node 22, `apache2`), die Skripte, Aufbau der Ordner, Hinweis auf `docs/`.

- [ ] **Step 7: Prüfen.** Run: `npm run check && npm run build && npm test && npm run validate && npm run test:e2e` · Expected: PASS; `npm run build:release` · Expected: Exit-Code 1 mit Mängelliste.

- [ ] **Step 8: Commit** „Budgets, HTML-Prüfung, Release-Sperre und CI“, Branch pushen, Draft-PR anlegen.

---

## Nach Phase 5

Eigene Pläne folgen für: übrige Seiten deutsch (6a), englische Fassung (6b), Kontaktformular mit PHP-Backend (6c), vollständige Quality Gates (7), Rechtstexte, Screenshots und Deploy (8).
