/** Texte der Seiten „Kontakt“ und „Danke“, wörtlich aus docs/copy/kontakt-de.md.
 *  Beschriftungen, Hilfetexte und Fehlertexte des Formulars stehen in `ui(lang).form`. */
export const kontakt = {
  meta: {
    title: 'Kontakt – Reticora',
    description: 'Vorführung, Enterprise, Sicherheit und Datenschutz oder eine andere Frage: Schreiben Sie uns über das Formular. Angebot nur für Unternehmen.',
  },
  hero: {
    h1: 'Kontakt',
    lead: 'Schreiben Sie uns, worum es geht. Wir antworten an Ihre geschäftliche E-Mail-Adresse.',
  },
  direct: { title: 'Anbieter', imprint: 'Impressum' },
  danke: {
    meta: { title: 'Vielen Dank – Reticora', description: 'Ihre Nachricht ist bei uns angekommen.' },
    h1: 'Vielen Dank für Ihre Nachricht.',
    text: 'Ihre Anfrage ist bei uns angekommen. Wir antworten an die E-Mail-Adresse, die Sie angegeben haben.',
    demo: 'Live-Demo öffnen',
    home: 'Zur Startseite',
  },
} as const;
