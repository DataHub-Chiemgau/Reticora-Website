/**
 * Barrierefreiheit, Phase 7 Task 4: Prüfungen nach WCAG 2.2 A/AA je Seitentyp.
 * Protokoll: docs/qa/2026-11-barrierefreiheit.md (dort steht zu jedem Erfolgskriterium, welcher Test es prüft).
 *
 * Alle Messungen laufen als Skript in der Seite (`window.a11y`, per addInitScript eingesetzt, gilt trotz CSP).
 * Nur APIs, die Chromium, Firefox und WebKit kennen; was nur Chromium emulieren kann (erzwungene Farben,
 * Barrierefreiheitsbaum als Datei), ist in den anderen Browsern übersprungen und im Protokoll benannt.
 */
import { expect, test, type Browser, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ui } from '../../src/i18n';
import { E2E_DIR } from './helpers/backend';

type Theme = 'leitstand' | 'dokument';
interface PageType {
  key: string;
  path: string;
  lang: 'de' | 'en';
  theme: Theme;
  status?: number;
  /** Zustand nach dem Laden herstellen (Filter, Fehler, Serverseite 422). */
  setup?: (page: Page) => Promise<void>;
}

/** Fehlerseite des Servers (422): das Formular ohne die Insel absenden, wie ein Browser ohne JavaScript. */
async function serverError(page: Page) {
  try {
    execFileSync('php', ['-r', '$p = new PDO("sqlite:" . $argv[1]); $p->setAttribute(PDO::ATTR_TIMEOUT, 10); $p->exec("DELETE FROM rate_limit");', '--', join(E2E_DIR, 'main.sqlite')]);
  } catch {
    /* eigene Testinstanz ohne diese Datei: Limit dort hoch genug */
  }
  await page.locator('#f-name').fill('Erika Beispiel');
  await page.locator('#f-email').fill('keine-adresse');
  const r = page.waitForResponse((x) => x.url().endsWith('/api/lead.php') && x.request().method() === 'POST');
  await page.locator('form[data-lead]').evaluate((f: HTMLFormElement) => f.submit());
  expect((await r).status()).toBe(422);
  await expect(page.locator('#form-summary')).toBeVisible();
}

const PAGES: PageType[] = [
  { key: 'home-de', path: '/', lang: 'de', theme: 'leitstand' },
  { key: 'home-en', path: '/en/', lang: 'en', theme: 'leitstand' },
  { key: 'produkt-topologie-impact-de', path: '/produkt/topologie-impact/', lang: 'de', theme: 'leitstand' },
  { key: 'product-topology-impact-en', path: '/en/product/topology-impact/', lang: 'en', theme: 'leitstand' },
  { key: 'geraete-de', path: '/geraete/', lang: 'de', theme: 'leitstand' },
  {
    key: 'geraete-de-gefiltert',
    path: '/geraete/',
    lang: 'de',
    theme: 'leitstand',
    setup: async (page) => {
      await page.locator('.dev-filter button[data-set="storage"]').click();
      await expect(page.locator('.dev-count')).not.toHaveText(/^$/);
    },
  },
  { key: 'devices-en', path: '/en/devices/', lang: 'en', theme: 'leitstand' },
  { key: 'preise-de', path: '/preise/', lang: 'de', theme: 'leitstand' },
  { key: 'pricing-en', path: '/en/pricing/', lang: 'en', theme: 'leitstand' },
  { key: 'demo-de', path: '/demo/', lang: 'de', theme: 'leitstand' },
  { key: 'demo-en', path: '/en/demo/', lang: 'en', theme: 'leitstand' },
  { key: 'kontakt-de', path: '/kontakt/', lang: 'de', theme: 'leitstand' },
  {
    key: 'kontakt-de-fehler',
    path: '/kontakt/',
    lang: 'de',
    theme: 'leitstand',
    setup: async (page) => {
      await page.getByRole('button', { name: ui('de').form.submit }).click();
      await expect(page.locator('#form-summary')).toBeVisible();
    },
  },
  { key: 'kontakt-de-422', path: '/kontakt/', lang: 'de', theme: 'leitstand', setup: serverError },
  { key: 'contact-en', path: '/en/contact/', lang: 'en', theme: 'leitstand' },
  { key: 'impressum-de', path: '/impressum/', lang: 'de', theme: 'dokument' },
  { key: 'barrierefreiheit-de', path: '/barrierefreiheit/', lang: 'de', theme: 'dokument' },
  { key: 'legal-notice-en', path: '/en/legal-notice/', lang: 'en', theme: 'dokument' },
  { key: '404-de', path: '/gibt-es-nicht/', lang: 'de', theme: 'leitstand', status: 404 },
  { key: '404-en', path: '/en/does-not-exist/', lang: 'en', theme: 'leitstand', status: 404 },
];

/** Seiten, auf denen nur ein Zustand wechselt: Layoutprüfungen laufen auf der Grundseite. */
const BASE = PAGES.filter((p) => !p.setup);


async function open(page: Page, p: PageType) {
  const res = await page.goto(p.path);
  expect(res?.status(), p.path).toBe(p.status ?? 200);
  await page.evaluate(() => document.fonts.ready);
  if (p.setup) await p.setup(page);
}

// ---------------------------------------------------------------------------------------------
// Messwerkzeug in der Seite
// ---------------------------------------------------------------------------------------------

interface Rect { x: number; y: number; w: number; h: number }
interface FocusStop {
  id: string;
  desc: string;
  tag: string;
  rect: Rect;
  doc: Rect;
  outlineStyle: string;
  outlineWidth: number;
  outlineRatio: number;
  boxShadow: string;
  visibleArea: number;
  covered: boolean;
  coveredBy: string;
  scrollable: boolean;
}
interface ContrastFail { text: string; ratio: number; need: number; where: string }
interface ContrastReport { min: number; minText: string; count: number; fails: ContrastFail[]; unknown: number }
interface A11y {
  tagFocusables(): number;
  focusables(): { id: string; desc: string }[];
  focusInfo(): FocusStop | null;
  contrast(): ContrastReport;
  spill(): string[];
  hScrollers(): { desc: string; allowed: boolean; focusable: boolean }[];
  targets(): string[];
  motion(): string[];
  textSpacing(): void;
  names(): { name: string; href: string; desc: string }[];
  labelInName(): string[];
  ratio(a: string, b: string): number;
}
declare global {
  interface Window { a11y: A11y }
}

function installA11y() {
  type C = [number, number, number, number];
  const parse = (c: string): C | null => {
    const m = /rgba?\(([^)]+)\)/.exec(c) ?? /color\(srgb ([^)]+)\)/.exec(c);
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const srgb = c.startsWith('color(');
    const [r, g, b] = parts.slice(0, 3).map((v) => (srgb ? v * 255 : v));
    return [r, g, b, parts.length > 3 ? parts[3] : 1];
  };
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c: C) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a: C, b: C) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const over = (top: C, bottom: C): C => {
    const a = top[3];
    return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1];
  };
  /** Hintergrund hinter einem Element: Schichten der Vorfahren bis zur ersten deckenden. */
  const bgOf = (start: Element | null): { color: C; unknown: boolean } => {
    const layers: C[] = [];
    let unknown = false;
    for (let e = start; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') unknown = true;
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) {
        layers.push(c);
        if (c[3] >= 1) break;
      }
    }
    let base: C = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { color: base, unknown };
  };
  const desc = (el: Element) => {
    const name = el.getAttribute('aria-label') ?? (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls} "${name.slice(0, 50)}"`;
  };
  /** Für Hilfstechnik gedacht, aber optisch weggeschnitten (sr-only, Köderfeld). */
  const clippedAway = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.clipPath === 'inset(50%)') return true;
      if (cs.overflow !== 'visible' && (e as HTMLElement).clientWidth <= 1 && (e as HTMLElement).clientHeight <= 1) return true;
      const r = e.getBoundingClientRect();
      if (cs.position === 'absolute' && (r.right < -1000 || r.bottom < -50)) return true; // Köderfeld links außerhalb, Sprunglink oben außerhalb
    }
    return false;
  };
  const shown = (el: Element) => {
    const anyEl = el as Element & { checkVisibility?: (o?: object) => boolean };
    if (anyEl.checkVisibility && !anyEl.checkVisibility({ visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.closest('[hidden], [inert]');
  };
  const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"]), iframe';
  const isScrollable = (el: Element) => {
    const cs = getComputedStyle(el);
    return ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) || ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1);
  };
  let counter = 0;
  const idOf = (el: Element) => {
    const h = el as HTMLElement;
    if (!h.dataset.a11y) h.dataset.a11y = String(++counter);
    return h.dataset.a11y;
  };
  /** Sichtbare Fläche eines Elements nach Abschneiden durch Viewport und scrollende Vorfahren; und ob etwas anderes darüber liegt. */
  const visibility = (el: Element) => {
    const r = el.getBoundingClientRect();
    let x1 = Math.max(r.left, 0), y1 = Math.max(r.top, 0), x2 = Math.min(r.right, innerWidth), y2 = Math.min(r.bottom, innerHeight);
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const q = e.getBoundingClientRect();
        x1 = Math.max(x1, q.left + e.clientLeft); y1 = Math.max(y1, q.top + e.clientTop);
        x2 = Math.min(x2, q.left + e.clientLeft + e.clientWidth); y2 = Math.min(y2, q.top + e.clientTop + e.clientHeight);
      }
    }
    const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    let free = 0, total = 0, by = '';
    if (area > 0) {
      for (const fx of [0.1, 0.5, 0.9])
        for (const fy of [0.15, 0.5, 0.85]) {
          const px = x1 + (x2 - x1) * fx, py = y1 + (y2 - y1) * fy;
          const t = document.elementFromPoint(px, py);
          total++;
          if (!t || t === el || el.contains(t) || t.contains(el)) free++;
          else by = desc(t);
        }
    }
    return { area, covered: area === 0 || free === 0, coveredBy: free === 0 ? by : '' };
  };

  const a11y = {
    ratio: (a: string, b: string) => ratio(parse(a)!, parse(b)!),
    tagFocusables() {
      const els = [...document.querySelectorAll(FOCUSABLE)].filter((e) => shown(e) && !(e as HTMLButtonElement).disabled && !e.closest('[aria-hidden="true"]') && !clippedAway(e));
      els.forEach(idOf);
      return els.length;
    },
    focusables() {
      return [...document.querySelectorAll(FOCUSABLE)]
        .filter((e) => shown(e) && !(e as HTMLButtonElement).disabled && !e.closest('[aria-hidden="true"]') && (!clippedAway(e) || e.matches('.sr-skip')))
        .map((e) => ({ id: idOf(e), desc: desc(e) }));
    },
    focusInfo(): FocusStop | null {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const outline = parse(cs.outlineColor) ?? [0, 0, 0, 0];
      const behind = bgOf(el.parentElement).color;
      const offset = parseFloat(cs.outlineOffset) || 0;
      const inside = offset < 0 ? bgOf(el).color : behind;
      const oc = over(outline, behind);
      const v = visibility(el);
      return {
        id: idOf(el),
        desc: desc(el),
        tag: el.tagName.toLowerCase(),
        rect: { x: r.left, y: r.top, w: r.width, h: r.height },
        doc: { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height },
        outlineStyle: cs.outlineStyle,
        outlineWidth: parseFloat(cs.outlineWidth) || 0,
        outlineRatio: Math.min(ratio(oc, behind), ratio(over(outline, inside), inside)),
        boxShadow: cs.boxShadow,
        visibleArea: v.area,
        covered: v.covered,
        coveredBy: v.coveredBy,
        scrollable: isScrollable(el),
      };
    },
    contrast(): ContrastReport {
      const fails: ContrastFail[] = [];
      let min = Infinity, minText = '', count = 0, unknown = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
        if (!n.data.trim()) continue;
        const el = n.parentElement;
        if (!el || el.closest('script, style, noscript, template, title, desc')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility !== 'visible' || !shown(el) || clippedAway(el)) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        if (![...range.getClientRects()].some((q) => q.width > 1 && q.height > 1)) continue;
        if (el.closest(':disabled')) continue;
        const svg = el instanceof SVGElement;
        let fg = parse(svg ? cs.fill : cs.color);
        if (!fg) continue;
        let opacity = 1;
        for (let e: Element | null = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
        fg = [fg[0], fg[1], fg[2], fg[3] * opacity];
        if (fg[3] === 0) continue; // unsichtbar gesetzt (z. B. Beschriftung einer blassen Kante)
        const bg = bgOf(el);
        if (bg.unknown) unknown++;
        const ratioNow = ratio(over(fg, bg.color), bg.color);
        let size = parseFloat(cs.fontSize);
        if (svg) size *= (el as unknown as SVGGraphicsElement).getScreenCTM?.()?.a ?? 1;
        const weight = parseInt(cs.fontWeight, 10) || 400;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const need = large ? 3 : 4.5;
        count++;
        const text = n.data.replace(/\s+/g, ' ').trim().slice(0, 40);
        if (ratioNow < min) { min = ratioNow; minText = `${text} (${desc(el)})`; }
        if (ratioNow + 0.005 < need) fails.push({ text, ratio: Math.round(ratioNow * 100) / 100, need, where: desc(el) });
      }
      return { min: Math.round(min * 100) / 100, minText, count, fails, unknown };
    },
    spill() {
      const found: { el: Element; msg: string }[] = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (el.closest('svg') || !shown(el) || clippedAway(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'inline' || cs.display === 'contents') continue;
        if (el.scrollHeight - el.clientHeight <= 1 && el.scrollWidth - el.clientWidth <= 1) continue;
        const scrolls = [cs.overflowX, cs.overflowY].some((o) => o === 'auto' || o === 'scroll');
        if (scrolls) continue; // Rahmen mit Scrollbalken: Inhalt bleibt erreichbar (seitliche Rahmen prüft hScrollers)
        const box = el.getBoundingClientRect();
        // Textstücke, die aus dem Kasten ragen (bei overflow hidden/clip abgeschnitten, sonst überlappend)
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
          if (!n.data.trim() || !n.parentElement || clippedAway(n.parentElement) || !shown(n.parentElement)) continue;
          // Nur Text, dessen Kasten innerhalb dieses Elements liegt (nicht absolut herausgestellte Teile)
          // … und nicht in einem inneren Rahmen, der selbst abschneidet oder scrollt (der wird für sich geprüft)
          let pos = false;
          for (let e: Element | null = n.parentElement; e && e !== el; e = e.parentElement) {
            const es = getComputedStyle(e);
            if (['absolute', 'fixed'].includes(es.position) || es.overflowX !== 'visible' || es.overflowY !== 'visible' || e instanceof SVGElement) pos = true;
          }
          if (pos) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          // Der Textkasten einer Zeile ist so hoch wie die Schrift (Ober- bis Unterlänge); bei enger Zeilenhöhe ragt er
          // um den halben Unterschied über die Zeile hinaus, ohne dass etwas überlappt. Diese Hälfte ist erlaubt.
          const lh = parseFloat(getComputedStyle(n.parentElement).lineHeight);
          for (const q of range.getClientRects()) {
            if (q.width < 1) continue;
            const tolY = 1.5 + (Number.isFinite(lh) ? Math.max(0, (q.height - lh) / 2) : 0);
            const dx = Math.max(box.left - q.left, q.right - box.right);
            const dy = Math.max(box.top - q.top, q.bottom - box.bottom);
            if (dx > 1.5 || dy > tolY) {
              found.push({ el, msg: `${desc(el)} [overflow ${cs.overflowX}/${cs.overflowY}, height ${cs.height}] ragt um ${Math.round(Math.max(dx, dy))} px: "${n.data.trim().slice(0, 30)}"` });
              break;
            }
          }
        }
      }
      // Nur das innerste Element nennen, nicht jeden Vorfahren, über den derselbe Text hinausragt
      return [...new Set(found.filter((f) => !found.some((g) => g.el !== f.el && f.el.contains(g.el))).map((f) => f.msg))];
    },
    hScrollers() {
      return [...document.body.querySelectorAll('*')]
        .filter((el) => {
          if (el.closest('svg') || !shown(el) || clippedAway(el)) return false;
          const cs = getComputedStyle(el);
          return (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1;
        })
        .map((el) => ({
          desc: desc(el).slice(0, 80),
          // Rahmen, die mit Absicht seitlich scrollen (design-system.md §4): Tabellen, Netzschemata, Code
          allowed: el.matches('.rt-table-wrap, .rt-topo-frame, .rt-schema-frame, pre'),
          focusable: (el as HTMLElement).tabIndex >= 0 || !!el.querySelector('a[href], button, summary, [tabindex="0"]'),
        }));
    },
    targets() {
      const sel = 'a[href], button, summary, input:not([type="hidden"]), select, textarea, [role="button"], .rt-topo .n';
      const all = [...document.querySelectorAll(sel)].filter((e) => shown(e) && !clippedAway(e) && !e.closest('[aria-hidden="true"]') && !(e as HTMLButtonElement).disabled);
      const boxes = all.map((e) => ({ e, r: e.getBoundingClientRect() }));
      const out: string[] = [];
      const inlineInText = (e: Element) => {
        // Ausnahme „im Satz“: nur echte Inline-Elemente, deren Block weiteren Text enthält
        if (getComputedStyle(e).display !== 'inline') return false;
        const block = e.parentElement;
        if (!block) return false;
        const own = (e.textContent ?? '').trim();
        const all = (block.textContent ?? '').replace(/\s+/g, ' ').trim();
        return all.length > own.length + 3;
      };
      for (const { e, r } of boxes) {
        if (r.width >= 23.5 && r.height >= 23.5) continue;
        if (inlineInText(e)) continue;
        // Abstandsausnahme: Kreis mit 24 px Durchmesser um die Mitte schneidet kein anderes Ziel und keinen anderen solchen Kreis
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let clash = '';
        for (const o of boxes) {
          if (o.e === e || o.e.contains(e) || e.contains(o.e)) continue;
          const dx = Math.max(o.r.left - cx, 0, cx - o.r.right), dy = Math.max(o.r.top - cy, 0, cy - o.r.bottom);
          const small = o.r.width < 23.5 || o.r.height < 23.5;
          const ocx = o.r.left + o.r.width / 2, ocy = o.r.top + o.r.height / 2;
          if (Math.hypot(dx, dy) < 12 || (small && Math.hypot(ocx - cx, ocy - cy) < 24)) { clash = desc(o.e); break; }
        }
        if (clash) out.push(`${desc(e)} ${r.width.toFixed(1)}×${r.height.toFixed(1)} zu nah an ${clash}`);
      }
      return out;
    },
    motion() {
      const out: string[] = [];
      const secs = (v: string) => Math.max(...v.split(',').map((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 0.001 : 1)));
      if (getComputedStyle(document.documentElement).scrollBehavior === 'smooth') out.push('html: scroll-behavior smooth');
      for (const el of document.querySelectorAll('*'))
        for (const pseudo of [null, '::before', '::after', '::marker']) {
          const cs = getComputedStyle(el, pseudo);
          const t = secs(cs.transitionDuration) + secs(cs.transitionDelay);
          const a = cs.animationName !== 'none' ? secs(cs.animationDuration) : 0;
          if (t > 0 && cs.transitionProperty !== 'none') out.push(`${desc(el)}${pseudo ?? ''}: transition ${cs.transitionProperty} ${cs.transitionDuration}`);
          if (a > 0) out.push(`${desc(el)}${pseudo ?? ''}: animation ${cs.animationName} ${cs.animationDuration}`);
          if (cs.scrollBehavior === 'smooth') out.push(`${desc(el)}: scroll-behavior smooth`);
        }
      return [...new Set(out)];
    },
    textSpacing() {
      const s = new CSSStyleSheet();
      s.replaceSync('* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }');
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, s];
    },
    names() {
      const text = (el: Element): string => {
        if (el.getAttribute('aria-hidden') === 'true') return '';
        if (el instanceof HTMLElement && el.hidden) return '';
        const label = el.getAttribute('aria-label');
        if (label) return label;
        const by = el.getAttribute('aria-labelledby');
        if (by) return by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
        let s = '';
        for (const c of el.childNodes) {
          if (c.nodeType === Node.TEXT_NODE) s += c.textContent;
          else if (c instanceof HTMLImageElement) s += c.alt;
          else if (c instanceof Element && getComputedStyle(c).display !== 'none') s += text(c);
        }
        return s;
      };
      return [...document.querySelectorAll('a[href]')]
        .filter((e) => !e.closest('[aria-hidden="true"], [hidden]') && getComputedStyle(e).display !== 'none' && (e.closest('details:not([open])') === null || e.closest('summary') !== null))
        .map((e) => ({ name: text(e).replace(/\s+/g, ' ').trim(), href: (e as HTMLAnchorElement).href, desc: desc(e) }));
    },
    labelInName() {
      const out: string[] = [];
      for (const e of document.querySelectorAll('[aria-label]')) {
        if (!e.matches('a, button, summary, input, select, textarea, [role="button"], [role="link"]')) continue;
        const visible = (e.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
        const name = (e.getAttribute('aria-label') ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (visible && !name.includes(visible)) out.push(`${desc(e)}: sichtbar „${visible}“, Name „${name}“`);
      }
      return out;
    },
  };
  (window as unknown as { a11y: typeof a11y }).a11y = a11y;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installA11y);
});

// ---------------------------------------------------------------------------------------------
// Tastaturweg: Reihenfolge, keine Falle, Sprunglink, Fokus sichtbar (2.4.7, 1.4.11) und nicht verdeckt (2.4.11)
// ---------------------------------------------------------------------------------------------

interface Walk { stops: FocusStop[]; trapped: boolean }

/**
 * Fokus messen, nachdem der Browser ihn in den sichtbaren Bereich geholt hat. WebKit (und vereinzelt Firefox) scrollt ein per
 * Tastatur fokussiertes Element erst beim nächsten Rendern in die Sicht, nicht schon beim Tastendruck (CI 1b1d518: Eingabefelder
 * „außerhalb des sichtbaren Bereichs“, in jedem Versuch andere). Ist der Fokus beim ersten Messen verdeckt, wird nach zwei
 * Bildern erneut gemessen; bleibt er verdeckt, zählt das wie bisher als Mangel (Gegenprobe im Test „Gegenprobe: verdeckter Fokus …“).
 */
async function focusInfoSettled(page: Page): Promise<FocusStop | null> {
  const info = await page.evaluate(() => window.a11y.focusInfo());
  if (!info?.covered) return info;
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  return page.evaluate(() => window.a11y.focusInfo());
}

async function walk(page: Page, key: 'Tab' | 'Shift+Tab', max = 400): Promise<Walk> {
  const stops: FocusStop[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key);
    const info = await focusInfoSettled(page);
    if (!info) {
      if (stops.length > 0) return { stops, trapped: false };
      continue;
    }
    if (seen.has(info.id)) return { stops, trapped: false };
    seen.add(info.id);
    stops.push(info);
  }
  return { stops, trapped: true };
}

/** Rückwärtssprung in der Lesereihenfolge: das nächste Ziel liegt ganz über dem vorigen und nicht rechts daneben (neue Spalte),
 *  oder in derselben Zeile ganz links davon. */
/** Startpunkt der Tab-Folge an den Seitenanfang legen (nach dem Herstellen eines Zustands steht er z. B. im Formular). */
async function toTop(page: Page) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
    const s = document.createElement('span');
    s.tabIndex = -1;
    document.body.prepend(s);
    s.focus();
    s.remove();
  });
}

/**
 * Startpunkt der Rückwärtsfolge hinter das letzte Element legen. Nach dem Hinweg hat Tab die Seite verlassen; wohin Umschalt+Tab
 * dann führt, ist Sache des Browsers: Chromium fokussiert das letzte Element, Firefox behält den Startpunkt der sequenziellen
 * Navigation auf dem zuletzt fokussierten Element und fokussiert das vorletzte (CI 1b1d518: auf jeder Seite fehlte „English“,
 * das letzte Ziel der Fußzeile). Ein nicht per Tab erreichbarer Anker am Ende von body gibt allen Browsern denselben Start.
 */
async function toBottom(page: Page) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    const s = document.createElement('span');
    s.tabIndex = -1;
    s.dataset.a11yEnd = '';
    document.body.append(s);
    s.focus({ preventScroll: true });
  });
}

function orderBreaks(stops: FocusStop[]) {
  const out: string[] = [];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1].doc, b = stops[i].doc;
    const above = b.y + b.h <= a.y - 1;
    const rightCol = b.x >= a.x + a.w - 1;
    const overlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    const sameLine = overlap > 0.5 * Math.min(a.h, b.h);
    const left = b.x + b.w <= a.x + 1;
    if ((above && !rightCol) || (sameLine && left)) out.push(`${stops[i - 1].desc} → ${stops[i].desc}`);
  }
  return out;
}

function focusProblems(stops: FocusStop[]) {
  const out: string[] = [];
  for (const s of stops) {
    const ring = s.outlineStyle !== 'none' && s.outlineWidth >= 2;
    if (!ring) out.push(`${s.desc}: Umriss ${s.outlineStyle} ${s.outlineWidth}px`);
    else if (s.outlineRatio < 3) out.push(`${s.desc}: Kontrast des Umrisses ${s.outlineRatio.toFixed(2)}`);
    if (s.covered) out.push(`${s.desc}: verdeckt${s.coveredBy ? ' von ' + s.coveredBy : ' (außerhalb des sichtbaren Bereichs)'}`);
  }
  return out;
}

for (const p of PAGES)
  test.describe(`Tastatur ${p.key}`, () => {
    for (const [label, size] of [['1280 px', { width: 1280, height: 900 }], ['390 px, Menü offen', { width: 390, height: 800 }]] as const)
      test(`Tab erreicht jedes Bedienelement in Lesereihenfolge, ohne Falle, Fokus sichtbar und nicht verdeckt (${label})`, async ({ page, browserName }) => {
        await page.setViewportSize(size);
        await open(page, p);
        if (size.width < 1120) await page.locator('details.rt-menu > summary').click();
        const expected = await page.evaluate(() => window.a11y.focusables());
        await toTop(page);
        const w = await walk(page, 'Tab');
        expect(w.trapped, 'Tastaturfalle: Tab kommt nicht zum Ende').toBe(false);
        expect(w.stops[0]?.desc, 'erstes Ziel ist der Sprunglink').toMatch(/a\.sr-skip/);
        const reached = new Set(w.stops.map((s) => s.id));
        // WebKit überspringt je nach Einstellung Auswahllisten; Scroller ohne tabindex sind in Chromium und Firefox zusätzliche Halte.
        const missing = expected.filter((e) => !reached.has(e.id) && !(browserName === 'webkit' && /^select/.test(e.desc)));
        expect(missing.map((m) => m.desc), 'nicht per Tab erreichbar').toEqual([]);
        const extra = w.stops.filter((s) => !expected.some((e) => e.id === s.id) && !s.scrollable);
        expect(extra.map((s) => s.desc), 'Halte, die nicht als Bedienelement erkannt sind').toEqual([]);
        expect(orderBreaks(w.stops), 'Tab-Reihenfolge weicht von der Lesereihenfolge ab').toEqual([]);
        expect(focusProblems(w.stops), 'Fokus nicht sichtbar oder verdeckt').toEqual([]);
        test.info().annotations.push({ type: 'Tab-Halte', description: `${p.key} ${label}: ${w.stops.length}` });
      });

    for (const [label, size] of [['1280 px', { width: 1280, height: 900 }], ['390 px', { width: 390, height: 800 }]] as const)
    test(`Umschalt+Tab: rückwärts derselbe Weg, Fokus nie verdeckt (${label})`, async ({ page }) => {
      await page.setViewportSize(size);
      await open(page, p);
      await toTop(page);
      const fwd = await walk(page, 'Tab');
      await toBottom(page);
      const back = await walk(page, 'Shift+Tab');
      expect(back.trapped).toBe(false);
      expect(back.stops.map((s) => s.desc).reverse(), 'Rückweg ist nicht die Umkehr des Hinwegs').toEqual(fwd.stops.map((s) => s.desc));
      expect(focusProblems(back.stops), 'Fokus nicht sichtbar oder verdeckt (rückwärts)').toEqual([]);
    });
  });

for (const p of BASE.filter((x) => ['home-de', 'home-en', 'preise-de', 'impressum-de', '404-de', 'kontakt-de'].includes(x.key)))
  test(`Sprunglink ${p.key}: sichtbar beim Fokus, führt zum Inhalt, nächster Tab landet im Hauptbereich`, async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, p);
    await page.keyboard.press('Tab');
    const skip = page.locator('a.sr-skip');
    await expect(skip).toBeFocused();
    const info = await page.evaluate(() => window.a11y.focusInfo());
    expect(info!.covered).toBe(false);
    expect(info!.rect.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#inhalt$/);
    // WebKit setzt den Startpunkt der Tab-Folge nicht immer auf das Ziel eines Sprunglinks: Prüfung in Phase 8 (VoiceOver + Safari).
    test.skip(browserName === 'webkit', 'Startpunkt nach Sprunglink in WebKit nicht verlässlich emulierbar');
    // Nächster Halt: das erste Bedienelement ab dem Beginn des Hauptbereichs (im Hauptbereich oder, wenn er keines hat, danach)
    const want = await page.evaluate(() => {
      const main = document.getElementById('inhalt')!;
      return window.a11y.focusables().find((f) => {
        const el = document.querySelector(`[data-a11y="${f.id}"]`)!;
        return main.contains(el) || !!(main.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      })!.id;
    });
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.a11y)).toBe(want);
  });

// ---------------------------------------------------------------------------------------------
// Umbruch (1.4.10): 320 CSS-px und 1280 px bei 400 % Zoom
// ---------------------------------------------------------------------------------------------

async function reflowReport(page: Page) {
  const r = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    scrollers: window.a11y.hScrollers(),
    spill: window.a11y.spill(),
    wide: [...document.body.querySelectorAll('*')]
      .filter((e) => {
        const q = e.getBoundingClientRect();
        return q.width > 0 && q.right > document.documentElement.clientWidth + 0.5 && (e as HTMLElement).checkVisibility?.() !== false && !e.closest('.rt-table-wrap, .rt-topo-frame, .rt-schema-frame, pre, .sr-only, .contact-trap');
      })
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).replace(/\s+/g, '.')} "${(e.textContent ?? '').trim().slice(0, 30)}"`)
      .slice(-5),
  }));
  if (r.page > 0) r.spill.push(...r.wide.map((w) => `breiter als die Seite: ${w}`));
  return r;
}

/**
 * 400 % Zoom bei 1280 × 900 Gerätepixeln: Der Browser rechnet dann mit 320 × 225 CSS-px Viewport und vier Gerätepixeln je CSS-px.
 * Genau das stellt ein Kontext mit viewport 320 × 225 und deviceScaleFactor 4 her (Medienabfragen, Umbrüche und Rundung wie beim
 * echten Zoom). CSS `zoom` am Wurzelelement wäre unzuverlässiger: Medienabfragen sähen weiter 1280 px, und Firefox kennt `zoom`
 * erst seit Version 126 mit abweichender Rechnung.
 */
async function zoomed(browser: Browser) {
  return browser.newContext({ viewport: { width: 320, height: 225 }, deviceScaleFactor: 4 });
}

for (const p of BASE)
  test.describe(`Umbruch ${p.key}`, () => {
    test('320 CSS-px: kein waagerechtes Scrollen der Seite, nur erlaubte Scrollrahmen, kein abgeschnittener Text', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await open(page, p);
      const r = await reflowReport(page);
      expect(r.page, `waagerechtes Scrollen der Seite: ${r.wide.join(', ')}`).toBeLessThanOrEqual(0);
      expect(r.scrollers.filter((s) => !s.allowed).map((s) => s.desc), 'seitlich scrollender Rahmen außerhalb der erlaubten').toEqual([]);
      expect(r.scrollers.filter((s) => !s.focusable).map((s) => s.desc), 'Scrollrahmen ohne Tastaturzugang').toEqual([]);
      expect(r.spill).toEqual([]);
    });

    test('1280 px bei 400 % Zoom (320 × 225 CSS-px, Faktor 4): wie oben, Menü öffnet, jedes Menüziel erreichbar', async ({ browser }) => {
      const ctx = await zoomed(browser);
      await ctx.addInitScript(installA11y);
      const page = await ctx.newPage();
      await open(page, p);
      const r = await reflowReport(page);
      expect(r.page, `waagerechtes Scrollen der Seite: ${r.wide.join(', ')}`).toBeLessThanOrEqual(0);
      expect(r.scrollers.filter((s) => !s.allowed).map((s) => s.desc)).toEqual([]);
      expect(r.spill).toEqual([]);
      await page.locator('details.rt-menu > summary').click();
      const links = page.locator('.rt-menu-body a');
      const n = await links.count();
      expect(n).toBeGreaterThan(8);
      for (let i = 0; i < n; i++) {
        await links.nth(i).focus();
        const info = await focusInfoSettled(page);
        expect(info!.covered, info!.desc).toBe(false);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await ctx.close();
    });
  });

// ---------------------------------------------------------------------------------------------
// Textabstände (1.4.12)
// ---------------------------------------------------------------------------------------------

for (const p of BASE)
  for (const width of [1280, 320])
    test(`Textabstände ${p.key} bei ${width} px: Zeilenhöhe 1,5, Absatz 2 em, Zeichen 0,12 em, Wort 0,16 em ohne Verlust`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, p);
      const before = await page.evaluate(() => window.a11y.spill());
      expect(before, 'schon ohne geänderte Abstände').toEqual([]);
      await page.evaluate(() => window.a11y.textSpacing());
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const r = await reflowReport(page);
      expect(r.spill, 'Text ragt aus seinem Kasten oder wird abgeschnitten').toEqual([]);
      expect(r.page, `waagerechtes Scrollen der Seite: ${r.wide.join(', ')}`).toBeLessThanOrEqual(0);
      expect(r.scrollers.filter((s) => !s.allowed).map((s) => s.desc)).toEqual([]);
    });

// ---------------------------------------------------------------------------------------------
// Zielgröße (2.5.8), Bewegung (2.3.3 als Gestaltungsregel, 2.2.2), erzwungene Farben, Kontrast (1.4.3, 1.4.11)
// ---------------------------------------------------------------------------------------------

for (const p of PAGES)
  for (const [label, size] of [['1280 px', { width: 1280, height: 900 }], ['390 px', { width: 390, height: 800 }]] as const)
    test(`Zielgröße ${p.key} (${label}): jedes Ziel mindestens 24 × 24 px oder mit Abstand`, async ({ page }) => {
      await page.setViewportSize(size);
      await open(page, p);
      expect(await page.evaluate(() => window.a11y.targets())).toEqual([]);
      if (size.width < 1120) {
        await page.locator('details.rt-menu > summary').click();
        expect(await page.evaluate(() => window.a11y.targets())).toEqual([]);
      }
    });

for (const p of BASE)
  test(`Bewegung ${p.key}: mit prefers-reduced-motion keine Übergänge und Animationen, sonst höchstens 150 ms`, async ({ page }) => {
    await open(page, p);
    const normal = await page.evaluate(() => window.a11y.motion());
    for (const m of normal) {
      const d = /transition \S+ ([\d.]+)(m?s)/.exec(m);
      if (d) expect(parseFloat(d[1]) * (d[2] === 'ms' ? 0.001 : 1), m).toBeLessThanOrEqual(0.15);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => window.a11y.motion())).toEqual([]);
  });

for (const p of BASE)
  test(`erzwungene Farben ${p.key}: Bedienelemente behalten Rand oder Umriss, Fokus bleibt sichtbar`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced-colors lässt sich nur in Chromium emulieren');
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, p);
    await page.emulateMedia({ forcedColors: 'active' });
    const boxes = await page
      .locator('button:visible, input:not([type="hidden"]):visible, select:visible, textarea:visible, a.rt-btn:visible, details.rt-menu > summary:visible, [tabindex="0"]:visible')
      .evaluateAll((els) =>
        els
          .filter((e) => !e.closest('[aria-hidden="true"]'))
          .map((e) => {
            const cs = getComputedStyle(e);
            const w = Math.max(...['Top', 'Right', 'Bottom', 'Left'].map((s) => (cs.getPropertyValue(`border-${s.toLowerCase()}-style`) === 'none' ? 0 : parseFloat(cs.getPropertyValue(`border-${s.toLowerCase()}-width`)))));
            // Scrollrahmen (tabindex=0) sind keine Bedienelemente mit eigener Fläche: ihr Rand darf am umgebenden Kasten sitzen.
            let wp = 0;
            if (e.getAttribute('tabindex') === '0' && e.parentElement) {
              const ps = getComputedStyle(e.parentElement);
              wp = ps.borderTopStyle === 'none' ? 0 : parseFloat(ps.borderTopWidth);
            }
            return { d: `${e.tagName.toLowerCase()}.${e.className} "${(e.textContent ?? '').trim().slice(0, 30)}"`, w: Math.max(w, wp), fc: cs.forcedColorAdjust };
          }),
      );
    expect(boxes.filter((b) => b.w < 1 && b.fc !== 'none').map((b) => b.d), 'ohne Rand im Modus erzwungene Farben').toEqual([]);
    const w = await walk(page, 'Tab');
    expect(w.stops.filter((s) => s.outlineStyle === 'none' || s.outlineWidth < 1).map((s) => s.desc), 'Fokus ohne Umriss').toEqual([]);
  });

for (const p of PAGES)
  test(`Kontrast ${p.key} (${p.theme}): jeder Text gegen seinen berechneten Hintergrund`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, p);
    await expect(page.locator('html')).toHaveAttribute('data-theme', p.theme);
    // Belege aufklappen: ihr Text steht auf der Fläche raised
    await page.locator('details.rt-beleg').evaluateAll((ds) => ds.forEach((d) => d.setAttribute('open', '')));
    const r = await page.evaluate(() => window.a11y.contrast());
    test.info().annotations.push({ type: 'Kontrast', description: `${p.key}: ${r.count} Textstellen, kleinster Wert ${r.min.toFixed(2)} (${r.minText}); mit Hintergrundbild ${r.unknown}` });
    expect(r.count).toBeGreaterThan(10);
    expect(r.unknown, 'Textstellen auf Hintergrundbildern (nicht berechenbar)').toBe(0);
    expect(r.fails).toEqual([]);
  });

test('Kontrast im Druck (helles Thema auf jeder Seite): Startseite und Preise', async ({ page }) => {
  for (const path of ['/', '/preise/']) {
    await page.goto(path);
    // Ohne Übergänge: sonst misst die Prüfung Zwischenfarben des Wechsels von dunkel nach hell. Erst die
    // Bewegung abschalten, dann auf Druck wechseln: WebKit startet Übergänge sonst noch mit den Regeln des
    // Zustands davor (gemessen: Knopf „pdu-a“ mitten im Wechsel, 1,06 : 1). Ein echter Druck rendert keinen
    // Übergang, daher betrifft das nur die Messung.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    const r = await page.evaluate(() => window.a11y.contrast());
    expect(r.fails, path).toEqual([]);
  }
});

test('Kontrast der Bedienelemente (1.4.11): Felder, Knöpfe mit Rand und Filterknöpfe gegen ihre Umgebung, beide Themen', async ({ page }) => {
  for (const path of ['/kontakt/', '/geraete/', '/', '/barrierefreiheit/']) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);
    const bad = await page.locator('.rt-input:visible, .rt-btn--secondary:visible, .rt-chip:visible, .rt-menu-toggle').evaluateAll((els) =>
      els.flatMap((e) => {
        const cs = getComputedStyle(e);
        if (cs.borderTopStyle === 'none') return [`${e.className}: kein Rand`];
        let bg = 'rgb(0, 0, 0)';
        for (let x = e.parentElement; x; x = x.parentElement) {
          const c = getComputedStyle(x).backgroundColor;
          if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') { bg = c; break; }
        }
        const r = window.a11y.ratio(cs.borderTopColor, bg);
        return r < 3 ? [`${e.className} "${(e.textContent ?? '').trim().slice(0, 20)}": ${r.toFixed(2)}`] : [];
      }),
    );
    expect(bad, path).toEqual([]);
  }
});

// ---------------------------------------------------------------------------------------------
// Sprache von Teilen (3.1.2), Statusmeldungen (4.1.3), Namen (2.4.4, 2.5.3, 4.1.2), Struktur (1.3.1, 2.4.6)
// ---------------------------------------------------------------------------------------------

for (const p of BASE)
  test(`Sprache ${p.key}: Links in die andere Sprache tragen lang der anderen Sprache, alle lang-Werte gültig`, async ({ page }) => {
    await open(page, p);
    const other = p.lang === 'de' ? 'en' : 'de';
    const switches = await page.locator('a[hreflang]').evaluateAll((els) => els.map((e) => ({ lang: e.getAttribute('lang'), hreflang: e.getAttribute('hreflang'), text: (e.getAttribute('aria-label') ?? e.textContent ?? '').trim() })));
    expect(switches.length, 'Sprachumschalter in Kopf, Menü und Fuß').toBeGreaterThanOrEqual(3);
    for (const s of switches) {
      expect(s.hreflang).toBe(other);
      expect(s.lang, s.text).toBe(other);
    }
    // Links mit Ziel in der anderen Sprache ohne lang (Inhalte, nicht die Umschalter)
    const cross = await page.locator('main a[href^="/"]').evaluateAll(
      (els, o) => els.filter((e) => (o === 'en' ? /^\/en\//.test(e.getAttribute('href')!) : !/^\/en\//.test(e.getAttribute('href')!)) && !e.closest('[lang]:not(html)')).map((e) => e.outerHTML.slice(0, 80)),
      other,
    );
    expect(cross).toEqual([]);
    const langs = await page.locator('[lang]').evaluateAll((els) => els.map((e) => e.getAttribute('lang')));
    for (const l of langs) expect(['de', 'en']).toContain(l);
  });

test.describe('Statusmeldungen (4.1.3)', () => {
  for (const lang of ['de', 'en'] as const)
    test(`Gerätefilter ${lang}: Anzahl steht in einer höflichen Live-Region, Fokus bleibt auf dem Knopf`, async ({ page }) => {
      await page.goto(lang === 'de' ? '/geraete/' : '/en/devices/');
      const out = page.locator('.dev-count');
      expect(await out.evaluate((e) => e.getAttribute('aria-live') ?? (e.getAttribute('role') === 'status' ? 'polite' : null))).toBe('polite');
      const before = await out.textContent();
      const b = page.locator('.dev-filter button[data-set="storage"]');
      await b.focus();
      await page.keyboard.press('Enter');
      await expect(out).not.toHaveText(before!);
      await expect(out).toHaveText(new RegExp(lang === 'de' ? 'Gerätefamilie' : 'device famil'));
      await expect(b).toBeFocused();
      await expect(b).toHaveAttribute('aria-pressed', 'true');
    });

  for (const lang of ['de', 'en'] as const)
    test(`Kopierknöpfe ${lang}: Rückmeldung in role=status neben dem Knopf, Fokus bleibt`, async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => undefined } });
      });
      await page.goto(lang === 'de' ? '/demo/' : '/en/demo/');
      const row = page.locator('.demo-row').first();
      const b = row.locator('button');
      await b.focus();
      await page.keyboard.press('Enter');
      await expect(row.getByRole('status')).toHaveText(ui(lang).copied);
      await expect(b).toBeFocused();
    });

  for (const lang of ['de', 'en'] as const)
    test(`Kontaktformular ${lang}: „Wird gesendet“ wird als Status gemeldet, nicht nur am deaktivierten Knopf`, async ({ page }) => {
      const T = ui(lang);
      let release: () => void = () => undefined;
      const held = new Promise<void>((r) => (release = r));
      await page.route('**/api/lead.php', async (route) => {
        await held;
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false}' });
      });
      await page.goto(lang === 'de' ? '/kontakt/' : '/en/contact/');
      await page.locator('#f-name').fill('Erika Beispiel');
      await page.locator('#f-email').fill('erika@example.com');
      await page.locator('#f-company').fill('Beispiel GmbH');
      await page.locator('#f-topic').selectOption('demo');
      await page.getByRole('button', { name: T.form.submit }).click();
      const status = page.locator('form[data-lead] [role="status"]');
      await expect(status).toHaveText(T.form.sending);
      release();
      // Fehler: Meldung mit role=alert erhält den Fokus, der Status ist wieder leer
      await expect(page.locator('[data-notice="500"]')).toBeFocused();
      await expect(status).toHaveText('');
    });

  test('Kontaktformular: Fehler mit JavaScript als role=alert mit Fokus, Feldfehler über aria-describedby', async ({ page }) => {
    await page.goto('/kontakt/');
    await page.getByRole('button', { name: ui('de').form.submit }).click();
    const sum = page.locator('#form-summary');
    await expect(sum).toBeFocused();
    await expect(sum).toHaveAttribute('role', 'alert');
    await expect(page.locator('#f-name')).toHaveAccessibleDescription(ui('de').form.errors.name.required);
    await expect(page.locator('#f-email')).toHaveAccessibleDescription(new RegExp(ui('de').form.fields.email.hint));
  });

  test('Ausfallsimulation: Ergebniszeile ist role=status und ändert sich beim Umschalten', async ({ page }) => {
    await page.goto('/');
    const out = page.locator('.rt-topo-result');
    await expect(out).toHaveAttribute('role', 'status');
    const before = await out.textContent();
    await page.locator('.rt-topo-controls button[data-ci="usv-01"]').click();
    await expect(out).not.toHaveText(before!);
  });
});

for (const p of PAGES)
  test(`Namen ${p.key}: keine leeren Linknamen, gleiche Namen nur bei gleichem Ziel, sichtbarer Text im Namen`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, p);
    const links = await page.evaluate(() => window.a11y.names());
    expect(links.filter((l) => !l.name).map((l) => l.desc), 'Link ohne Namen').toEqual([]);
    const byName = new Map<string, Set<string>>();
    for (const l of links) byName.set(l.name.toLowerCase(), (byName.get(l.name.toLowerCase()) ?? new Set()).add(l.href));
    const dup = [...byName].filter(([, hrefs]) => hrefs.size > 1).map(([n, hrefs]) => `${n}: ${[...hrefs].join(' | ')}`);
    expect(dup, 'gleicher Linkname, verschiedene Ziele').toEqual([]);
    expect(await page.evaluate(() => window.a11y.labelInName()), 'Label in Name (2.5.3)').toEqual([]);
    // Knöpfe: kein leerer Name; gleiche Namen nur, wenn sie dasselbe tun (hier: keiner doppelt)
    const buttons = await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').replace(/\s+/g, ' ').trim()));
    expect(buttons.filter((b) => !b)).toEqual([]);
    expect(buttons.filter((b, i) => buttons.indexOf(b) !== i), 'doppelter Knopfname').toEqual([]);
  });

for (const p of PAGES)
  test(`Struktur ${p.key}: Landmarken, Überschriftenfolge, Tabellenköpfe, beschriftete Bereiche`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, p);
    const s = await page.evaluate(() => {
      const nameOf = (e: Element) => e.getAttribute('aria-label') ?? (e.getAttribute('aria-labelledby') ?? '').split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
      const visible = (e: Element) => getComputedStyle(e).display !== 'none' && !e.closest('[hidden]');
      const navs = [...document.querySelectorAll('nav')].map(nameOf);
      const regions = [...document.querySelectorAll('section[aria-label], section[aria-labelledby], [role="region"]')].map(nameOf);
      const heads = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible).map((h) => +h.tagName[1]);
      const jumps: string[] = [];
      for (let i = 1; i < heads.length; i++) if (heads[i] > heads[i - 1] + 1) jumps.push(`h${heads[i - 1]} → h${heads[i]}`);
      const tables = [...document.querySelectorAll('table')].map((t) => ({
        th: t.querySelectorAll('th').length,
        cells: [...t.querySelectorAll('td')].length,
        named: !!(t.closest('[aria-label]') || t.querySelector('caption') || t.getAttribute('aria-label') || t.getAttribute('aria-labelledby')),
      }));
      return {
        main: document.querySelectorAll('main').length,
        banner: [...document.querySelectorAll('header')].filter((h) => !h.closest('main, article, aside, section, nav')).length,
        footer: [...document.querySelectorAll('footer')].filter((h) => !h.closest('main, article, aside, section, nav')).length,
        navs,
        regions,
        h1: heads.filter((h) => h === 1).length,
        first: heads[0],
        jumps,
        tables,
        dupIds: [...document.querySelectorAll('[id]')].map((e) => e.id).filter((id, i, a) => a.indexOf(id) !== i),
        // Zellen, deren einziger Inhalt ein Strich ist: Screenreader lesen „–“ in der Standardeinstellung oft gar nicht vor
        dashCells: [...document.querySelectorAll('td, th')]
          .filter((c) => {
            const spoken = [...c.childNodes].map((n) => (n instanceof Element ? (n.closest('[aria-hidden="true"]') ? '' : n.textContent) : n.textContent)).join('').trim();
            return /^[–—-]+$/.test(spoken);
          })
          .map((c) => c.outerHTML.slice(0, 80)),
      };
    });
    expect(s.main).toBe(1);
    expect(s.banner).toBe(1);
    expect(s.footer).toBe(1);
    expect(s.navs.filter((n) => !n), 'Navigation ohne Namen').toEqual([]);
    expect(new Set(s.navs).size, `Navigationen mit gleichem Namen: ${s.navs.join(' | ')}`).toBe(s.navs.length);
    expect(s.regions.filter((n) => !n)).toEqual([]);
    expect(s.h1).toBe(1);
    expect(s.jumps, 'übersprungene Überschriftenebene').toEqual([]);
    for (const t of s.tables) {
      expect(t.th).toBeGreaterThan(0);
      expect(t.named, 'Tabelle ohne Namen').toBe(true);
    }
    expect(s.dupIds).toEqual([]);
    expect(s.dashCells, 'Tabellenzelle nur mit Strich, ohne Wort für Screenreader').toEqual([]);
  });

for (const p of BASE)
  test(`Links im Fließtext ${p.key}: unterstrichen, nicht nur durch Farbe erkennbar (1.4.1)`, async ({ page }) => {
    await open(page, p);
    const bad = await page.locator('body a[href]').evaluateAll((els) =>
      els.flatMap((a) => {
        const cs = getComputedStyle(a);
        if (cs.display !== 'inline' || !(a as HTMLElement).checkVisibility?.()) return [];
        const block = a.parentElement!;
        const own = (a.textContent ?? '').replace(/\s+/g, ' ').trim();
        const all = (block.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (all.length <= own.length + 3) return []; // allein stehender Link, kein Fließtext
        return cs.textDecorationLine.includes('underline') ? [] : [`"${own}" in „${all.slice(0, 40)}…“`];
      }),
    );
    expect(bad).toEqual([]);
  });

test('Einheitliche Navigation und Hilfe (3.2.3, 3.2.6): Kopf, Menü und Fuß haben auf jeder Seite dieselben Ziele in derselben Reihenfolge', async ({ page }) => {
  const shape = async () =>
    page.evaluate(() => ({
      header: [...document.querySelectorAll('.rt-header a, .rt-header [aria-current="true"]')].map((a) => a.textContent!.trim()),
      menu: [...document.querySelectorAll('.rt-menu-body a')].map((a) => a.textContent!.trim()),
      footer: [...document.querySelectorAll('.rt-footer a')].map((a) => a.textContent!.trim()),
    }));
  const seen: Record<string, string> = {};
  for (const p of BASE) {
    await open(page, p);
    const s = JSON.stringify(await shape());
    const prev = seen[p.lang];
    if (prev) expect(s, p.key).toBe(prev);
    else seen[p.lang] = s;
  }
});

test('Ausrichtung (1.3.4): keine Medienabfrage und kein Skript, das eine Ausrichtung erzwingt; Hoch- und Querformat ohne waagerechtes Scrollen', async ({ page, request }) => {
  for (const p of BASE.filter((x) => ['home-de', 'preise-de', 'kontakt-de'].includes(x.key))) {
    await page.goto(p.path);
    const assets = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"], script[src]')].map((e) => (e as HTMLLinkElement).href || (e as HTMLScriptElement).src));
    for (const url of assets) {
      const body = await (await request.get(url)).text();
      expect(body, url).not.toMatch(/orientation\s*:|orientation\.lock/);
    }
    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${p.key} ${size.width}×${size.height}`).toBeLessThanOrEqual(0);
    }
  }
});

/** Der echte Barrierefreiheitsbaum von Chromium (CDP), nicht Playwrights eigene Berechnung: Rollen und Zustände der Widgets. */
test('Chromium-Baum (CDP): gestapelte Tabellen bleiben Tabellen, Beleg ist aufklappbar, Ausfallknöpfe gedrückt, Ergebniszeile höflich live', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP gibt es nur in Chromium');
  type AX = { ignored: boolean; role?: { value: string }; name?: { value: string }; properties?: { name: string; value: { value: unknown } }[] };
  const cdp = await context.newCDPSession(page);
  const tree = async () => ((await cdp.send('Accessibility.getFullAXTree')) as { nodes: AX[] }).nodes.filter((n) => !n.ignored);
  const prop = (n: AX, k: string) => n.properties?.find((p) => p.name === k)?.value.value;
  const roles = (nodes: AX[], r: string) => nodes.filter((n) => n.role?.value === r);
  await page.setViewportSize({ width: 390, height: 800 });
  for (const [path, tables] of [['/barrierefreiheit/', 1], ['/preise/', 2], ['/produkt/topologie-impact/', 1]] as const) {
    await page.goto(path);
    const nodes = await tree();
    expect(roles(nodes, 'table').length, path).toBe(tables);
    expect(roles(nodes, 'LayoutTable').length, path).toBe(0);
    expect(roles(nodes, 'columnheader').length, path).toBeGreaterThanOrEqual(3);
    expect(roles(nodes, 'cell').length, path).toBeGreaterThan(5);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const nodes = await tree();
  const belege = roles(nodes, 'DisclosureTriangle').filter((n) => n.name?.value.startsWith('Beleg'));
  expect(belege.length).toBeGreaterThan(10);
  for (const b of belege) expect(prop(b, 'expanded')).toBe(false);
  const chips = roles(nodes, 'button').filter((n) => /^(usv|pdu|srv|sw|nas|vm)-/.test(n.name?.value ?? ''));
  expect(chips.length).toBe(9);
  expect(chips.filter((c) => prop(c, 'pressed') === 'true').map((c) => c.name?.value)).toEqual(['pdu-a']);
  const live = roles(nodes, 'status');
  expect(live.length).toBeGreaterThanOrEqual(2); // Ergebniszeile der Simulation, Rückmeldung des Kopierknopfs
  for (const l of live) expect(prop(l, 'live')).toBe('polite');
});

// ---------------------------------------------------------------------------------------------
// Barrierefreiheitsbaum je Seitentyp (Chromium): docs/qa/a11y-snapshots/<seite>.yml
// Neu schreiben: A11Y_SNAPSHOT_UPDATE=1 npm run test:e2e -- tests/e2e/a11y-audit.spec.ts -g Baum
// ---------------------------------------------------------------------------------------------

const SNAP_DIR = join(process.cwd(), 'docs/qa/a11y-snapshots');
for (const p of PAGES)
  test(`Baum ${p.key}: Barrierefreiheitsbaum entspricht der geprüften Fassung`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Baum wird in Chromium festgehalten');
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, p);
    const tree = await page.locator('body').ariaSnapshot();
    const file = join(SNAP_DIR, `${p.key}.yml`);
    if (process.env.A11Y_SNAPSHOT_UPDATE === '1' || !existsSync(file)) {
      mkdirSync(SNAP_DIR, { recursive: true });
      writeFileSync(file, `# ${p.path} (${p.key}), Chromium, 1280 × 900; Prüfung in docs/qa/2026-11-barrierefreiheit.md\n${tree}\n`);
      if (process.env.A11Y_SNAPSHOT_UPDATE !== '1') throw new Error(`${file} fehlte und wurde angelegt; bitte prüfen und einchecken`);
    }
    const saved = readFileSync(file, 'utf8').split('\n').slice(1).join('\n').trimEnd();
    expect(tree.trimEnd(), `Baum geändert: ${file} prüfen und mit A11Y_SNAPSHOT_UPDATE=1 neu schreiben`).toBe(saved);
  });

// ---------------------------------------------------------------------------------------------
// Gegenprobe: das Messwerkzeug erkennt eingebaute Mängel (sonst bewiese ein grüner Lauf nichts)
// ---------------------------------------------------------------------------------------------

test('Gegenprobe: verdeckter Fokus, fehlender Umriss, überlaufender Text, kleines Ziel, Bewegung und schwacher Kontrast werden erkannt', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/impressum/');
  await page.evaluate(() => {
    const s = new CSSStyleSheet();
    s.replaceSync(`
      .probe-bar { position: fixed; top: 0; left: 0; right: 0; height: 120px; background: #222; z-index: 50; }
      a.rt-brand:focus-visible { outline: none; }
      .probe-box { height: 20px; overflow: hidden; width: 200px; }
      .probe-small { width: 12px; height: 12px; padding: 0; }
      .probe-move { transition: opacity 1s; }
      .probe-faint { color: #8a8a8a; background: #999999; }
    `);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, s];
    const main = document.querySelector('main')!;
    main.insertAdjacentHTML(
      'afterbegin',
      '<div class="probe-box">Ein Text, der in zwanzig Pixeln Höhe keinen Platz hat und deshalb abgeschnitten wird.</div>' +
        '<p><button class="probe-small" type="button">a</button><button class="probe-small" type="button">b</button></p>' +
        '<p class="probe-move probe-faint">Blasser Text</p>',
    );
    document.body.insertAdjacentHTML('beforeend', '<div class="probe-bar"></div>');
  });
  await page.locator('a.rt-brand').focus();
  // auch nach dem Abwarten des Renderns (focusInfoSettled) bleibt ein wirklich verdeckter Fokus verdeckt
  const info = await focusInfoSettled(page);
  expect(info!.covered).toBe(true);
  expect(focusProblems([info!]).join(' ')).toMatch(/Umriss none.*verdeckt/);
  expect((await page.evaluate(() => window.a11y.spill())).join(' ')).toMatch(/probe-box/);
  expect((await page.evaluate(() => window.a11y.targets())).join(' ')).toMatch(/probe-small/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await page.evaluate(() => window.a11y.motion())).join(' ')).toMatch(/probe-move/);
  expect((await page.evaluate(() => window.a11y.contrast())).fails.map((f) => f.text)).toContain('Blasser Text');
  const stop = (desc: string, x: number, y: number): FocusStop => ({ ...info!, desc, doc: { x, y, w: 100, h: 40 } });
  expect(orderBreaks([stop('unten', 0, 500), stop('oben', 0, 100)])).toEqual(['unten → oben']);
  expect(orderBreaks([stop('rechts', 400, 100), stop('links', 0, 100)])).toEqual(['rechts → links']);
  expect(orderBreaks([stop('Spalte 1 unten', 0, 500), stop('Spalte 2 oben', 300, 100)])).toEqual([]);
});
