// Reine Prüffunktionen für die Release-Sperre. Jede liefert eine Liste von Mängeln; leer heißt in Ordnung.

export function checkClaims(claims) {
  const out = [];
  for (const c of claims) {
    if (c.status !== 'geprüft') out.push(`${c.id}: nicht geprüft`);
    else if (!c.checkedBy || !c.checkedOn) out.push(`${c.id}: Name oder Datum der Prüfung fehlt`);
  }
  return out;
}

export function checkScreenshots(list) {
  return list.filter((s) => !s.file).map((s) => `${s.id}: Bild fehlt`);
}

export function checkRoutes(routes) {
  return routes.filter((r) => r.status === 'geplant').map((r) => `${r.de}: Seite nur geplant, nicht gebaut`);
}

const blank = (v) => typeof v !== 'string' || v.trim() === '';

export function checkSite(site) {
  const fields = [
    ['email', 'E-Mail-Adresse'],
    ['phone', 'Telefonnummer'],
    ['managingDirector', 'Geschäftsführung'],
    ['registerCourt', 'Registergericht'],
    ['registerNumber', 'Registernummer'],
    ['vatId', 'USt-IdNr.'],
  ];
  return fields.filter(([k]) => blank(site[k])).map(([, label]) => `Anbieter: ${label} fehlt`);
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
