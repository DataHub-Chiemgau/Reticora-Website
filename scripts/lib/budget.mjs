import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const gz = (file) => gzipSync(readFileSync(file)).length;
const local = (dist, url) => join(dist, url.split(/[?#]/)[0].replace(/^\//, ''));

/** Alle von der Startseite tatsächlich geladenen Dateien, nach Art gruppiert. */
export function homepageAssets(dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const js = new Set();
  const css = new Set();
  const fonts = new Set();

  const addJs = (url) => {
    const f = local(dist, url);
    if (js.has(f) || !existsSync(f)) return;
    js.add(f);
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/g))
      addJs(new URL(m[1], 'http://x' + (url.startsWith('/') ? url : '/' + url)).pathname);
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
  return { html: join(dist, 'index.html'), js: [...js], css: [...css], fonts: [...fonts] };
}

export function gzipTotal(files) {
  return files.reduce((n, f) => n + gz(f), 0);
}
