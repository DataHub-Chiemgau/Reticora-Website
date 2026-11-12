import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

/** Relative Importe eines Chunks: statisch (from "./x.js", import "./x.js") und dynamisch (import("./x.js")). */
export function chunkImports(code) {
  return [...code.matchAll(/(?:from\s*|import\s*\(?\s*)["'](\.{1,2}\/[^"']+\.js)["']/g)].map((m) => m[1]);
}

const gz = (file) => gzipSync(readFileSync(file)).length;
const local = (dist, url) => join(dist, url.split(/[?#]/)[0].replace(/^\//, ''));

/** Alle von einer gebauten Seite (Standard: Startseite) tatsächlich geladenen Dateien, nach Art gruppiert. */
export function pageAssets(dist, htmlFile = join(dist, 'index.html')) {
  const html = readFileSync(htmlFile, 'utf8');
  const js = new Set();
  const css = new Set();
  const fonts = new Set();

  const addJs = (url) => {
    const f = local(dist, url);
    if (js.has(f) || !existsSync(f)) return;
    js.add(f);
    for (const imp of chunkImports(readFileSync(f, 'utf8')))
      addJs(new URL(imp, 'http://x' + (url.startsWith('/') ? url : '/' + url)).pathname);
  };
  const addCss = (url) => {
    const f = local(dist, url);
    if (css.has(f)) return;
    css.add(f);
    for (const m of readFileSync(f, 'utf8').matchAll(/url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/g))
      fonts.add(local(dist, new URL(m[1], 'http://x' + url).pathname));
  };

  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) addJs(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    const tag = m[0];
    const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
    if (!href || !href.startsWith('/')) continue;
    if (/rel="stylesheet"/.test(tag)) addCss(href);
    else if (/rel="modulepreload"/.test(tag)) addJs(href);
    else if (/as="font"/.test(tag)) fonts.add(local(dist, href));
  }
  return { html: htmlFile, js: [...js], css: [...css], fonts: [...fonts], entries: [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]) };
}

export const homepageAssets = (dist) => pageAssets(dist);

/** Alle gebauten HTML-Seiten (ohne Entwicklungsseiten nicht ausgenommen: der Aufrufer filtert). */
export function htmlPages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? htmlPages(p) : p.endsWith('.html') ? [p] : [];
  });
}

/** Das Einstiegsskript samt aller statischen und dynamischen Importe (absolute Dateipfade). */
export function scriptClosure(dist, url) {
  const seen = new Set();
  const load = (u) => {
    const f = local(dist, u);
    if (seen.has(f) || !existsSync(f)) return;
    seen.add(f);
    for (const imp of chunkImports(readFileSync(f, 'utf8'))) load(new URL(imp, 'http://x' + (u.startsWith('/') ? u : '/' + u)).pathname);
  };
  load(url);
  return [...seen];
}

/** Unkomprimierte (minifizierte) Größe eines Skripts samt aller Importe. */
export const scriptSize = (dist, url) => scriptClosure(dist, url).reduce((n, f) => n + statSync(f).size, 0);

/** Welche Insel ein Einstiegsskript ist, erkannt am Inhalt des Skripts oder seiner Importe; sonst null. */
export function islandOf(dist, url) {
  const code = scriptClosure(dist, url).map((f) => readFileSync(f, 'utf8')).join('\n');
  if (code.includes('form[data-lead]')) return 'form';
  if (code.includes('[data-filter]') || code.includes('data-filter')) return 'filter';
  if (code.includes('data-topo')) return 'impact';
  if (code.includes('[data-copy]')) return 'copy';
  return null;
}

export function gzipTotal(files) {
  return files.reduce((n, f) => n + gz(f), 0);
}
