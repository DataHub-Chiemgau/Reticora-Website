// Vorlagen der Kontaktseite und Fehlertexte für das Lead-Backend (Spec Ä-08).
// Der Build legt die fertige Kontaktseite je Sprache unter backend/templates/ ab; backend/src/ContactPage.php
// setzt dort Fehlertexte und die maskierten Eingaben ein. PHP sucht nur feste Zeichenfolgen (Marken), die
// Field.astro und ErrorSummary.astro ausgeben. Diese Liste muss mit ContactPage::markers() übereinstimmen.

export const FIELDS = ['name', 'email', 'company', 'topic', 'message'];
export const TOPICS = ['demo', 'enterprise', 'security', 'other'];

/** Gebaute Seite (relativ zu dist/) je Sprache. Fehlt eine Seite (Englisch vor Task 9), entsteht keine Vorlage. */
export const TEMPLATE_PAGES = [
  ['de', 'kontakt/index.html'],
  ['en', 'en/contact/index.html'],
];

/** Alle Marken. Jede enthält ein Anführungszeichen: maskierte Eingaben (ENT_QUOTES) können daher nie eine Marke bilden. */
export function markers() {
  return [
    ...['name', 'email', 'company', 'topic'].map((n) => ` data-rt-field="${n}">`),
    ' data-rt-field="message"></textarea>',
    ...TOPICS.map((t) => ` data-rt-option="${t}">`),
    ...FIELDS.map((n) => ` data-rt-error="${n}" hidden></p>`),
    ' data-rt="title">',
    ' data-rt="summary" hidden>',
    ' data-rt="summary-title"></p>',
    ' data-rt="summary-items"></ul>',
  ];
}

const count = (html, needle) => html.split(needle).length - 1;

/** Mängel einer Vorlage: jede Marke genau einmal, Formular vorhanden. Leer heißt in Ordnung. */
export function markerProblems(html) {
  const out = [];
  for (const m of markers()) {
    const n = count(html, m);
    if (n !== 1) out.push(`Marke ${JSON.stringify(m.trim())} ${n}-mal statt einmal`);
  }
  if (!/<form\b[^>]*\bdata-lead\b/.test(html)) out.push('Formular mit data-lead fehlt');
  return out;
}

/**
 * Fehlertexte einer Sprache aus `ui(lang).form` für PHP: Code (`feld.code`) → Text, dazu Überschriften der Zusammenfassung.
 * @param {{ titlePrefix: string, summaryOne: string, summaryMany: string, generic: string, errors: Record<string, Record<string, string>> }} form
 * @returns {{ titlePrefix: string, summaryOne: string, summaryMany: string, generic: string, errors: Record<string, string> }}
 */
export function formTexts(form) {
  /** @type {Record<string, string>} */
  const errors = {};
  for (const [field, byCode] of Object.entries(form.errors)) {
    for (const [code, text] of Object.entries(byCode)) errors[`${field}.${code}`] = text;
  }
  return { titlePrefix: form.titlePrefix, summaryOne: form.summaryOne, summaryMany: form.summaryMany, generic: form.generic, errors };
}
