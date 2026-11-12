// Reine Prüffunktionen für die Release-Sperre. Jede liefert eine Liste von Mängeln; leer heißt in Ordnung.

import { contactUri } from './security-txt.mjs';

const blank = (v) => typeof v !== 'string' || v.trim() === '';
const PLACEHOLDER = /^(todo|tbd|xxx|\?)$/i;
const isoDate = (v) => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v);

export function checkClaims(claims) {
  const out = [];
  for (const c of claims) {
    if (c.status !== 'geprüft') out.push(`${c.id}: nicht geprüft`);
    else if (blank(c.checkedBy) || !isoDate(c.checkedOn)) out.push(`${c.id}: Name oder Datum der Prüfung fehlt`);
  }
  return out;
}

export function checkScreenshots(list) {
  return list.filter((s) => !s.file).map((s) => `${s.id}: Bild fehlt`);
}

export function checkRoutes(routes) {
  const out = [];
  for (const r of routes) {
    if (r.status === 'geplant') out.push(`${r.de}: Seite nur geplant, nicht gebaut`);
    else if (r.en && r.enStatus === 'geplant') out.push(`${r.en}: Seite nur geplant, nicht gebaut`);
  }
  return out;
}

/** Dist-Datei zu einer Adresse mit führendem „/“: Verzeichnis-URLs liegen als index.html, Fragment und Query zählen nicht. */
function distCandidates(url) {
  const p = decodeURI(url.split(/[?#]/)[0]).replace(/^\//, '');
  if (p === '' || p.endsWith('/')) return [`${p}index.html`];
  return [p, `${p}/index.html`];
}

/** Jede gebaute Seite (de, und en nach `enStatus`) muss in dist liegen. */
export function checkRoutesBuilt(routes, exists) {
  const out = [];
  for (const r of routes) {
    const pairs = [[r.de, r.status], [r.en, r.enStatus]];
    for (const [url, status] of pairs) {
      if (status === 'gebaut' && url && !distCandidates(url).some(exists)) out.push(`${url}: Seite fehlt in dist`);
    }
  }
  return out;
}

/** Jeder interne href/src (beginnt mit „/“, nicht „//“) in gebauten Seiten muss auf eine Datei in dist zeigen. */
export function checkInternalLinks(pages, exists) {
  const out = [];
  for (const { path, html } of pages) {
    const seen = new Set();
    for (const m of html.matchAll(/\s(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
      const url = m[1].split(/[?#]/)[0];
      if (seen.has(url)) continue;
      seen.add(url);
      if (!distCandidates(url).some(exists)) out.push(`${path}: ${url} nicht gebaut`);
    }
  }
  return out;
}

export function checkSite(site) {
  const fields = [
    ['email', 'E-Mail-Adresse'],
    ['phone', 'Telefonnummer'],
    ['managingDirector', 'Geschäftsführung'],
    ['registerCourt', 'Registergericht'],
    ['registerNumber', 'Registernummer'],
    ['vatId', 'USt-IdNr.'],
  ];
  return fields.filter(([k]) => blank(site[k]) || PLACEHOLDER.test(site[k].trim())).map(([, label]) => `Anbieter: ${label} fehlt`);
}

/** Spec Ä-13: ohne Meldeadresse keine /.well-known/security.txt. */
export function checkSecurityContact(site) {
  if (blank(site.securityContact)) return ['Anbieter: Meldeadresse für Sicherheitslücken fehlt'];
  try {
    contactUri(site.securityContact);
    return [];
  } catch {
    return ['Anbieter: Meldeadresse für Sicherheitslücken ist ungültig'];
  }
}

/** Ort einer Bilddatei unter public/, wie ScreenshotSlot sie ausliefert. */
export function screenshotPublicPath(file) {
  return file.startsWith('/') ? `public${file}` : `public/screenshots/${file}`;
}

export function checkScreenshotFiles(list, exists) {
  return list
    .filter((s) => s.file && !exists(screenshotPublicPath(s.file)))
    .map((s) => `${s.id}: Bilddatei fehlt auf Platte`);
}

/** Findet Platzhalter-Bilder in gebauten Seiten (Marker data-placeholder). */
export function checkDistHtml(files) {
  const out = [];
  for (const { path, html } of files) {
    for (const m of html.matchAll(/\sdata-placeholder(?:="([^"]*)")?/g)) {
      out.push(m[1] ? `${path}: Platzhalter für ${m[1]}` : `${path}: Platzhalter`);
    }
  }
  return out;
}

export function checkNotEmpty(claims, screenshots, routes) {
  const out = [];
  if (!claims?.length) out.push('Claim-Register ist leer');
  if (!screenshots?.length) out.push('Screenshot-Liste ist leer');
  if (!routes?.length) out.push('Routen-Liste ist leer');
  return out;
}

/** Ein Release-Build darf keine Entwicklungsseiten enthalten. */
export function checkDevPages(paths) {
  return paths.filter((p) => p === 'dev' || p.startsWith('dev/')).map((p) => `dist/${p}: Entwicklungsseite im Release-Build`);
}
