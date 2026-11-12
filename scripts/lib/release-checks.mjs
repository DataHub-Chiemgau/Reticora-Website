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

export function checkSite(site) {
  const out = [];
  if (!site.email) out.push('Anbieter: E-Mail-Adresse fehlt');
  if (!site.phone) out.push('Anbieter: Telefonnummer fehlt');
  return out;
}

/** Ein Release-Build darf keine Entwicklungsseiten enthalten. */
export function checkDevPages(paths) {
  return paths.filter((p) => p === 'dev' || p.startsWith('dev/')).map((p) => `dist/${p}: Entwicklungsseite im Release-Build`);
}
