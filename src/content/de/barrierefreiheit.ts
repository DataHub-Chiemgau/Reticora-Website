/** Texte der Seite „Barrierefreiheit“, wörtlich aus docs/copy/barrierefreiheit-de.md.
 *  Der Kontaktweg am Ende ist ein Platzhalter (`ui(lang).placeholders.a11yContact`). */
export const barrierefreiheit = {
  meta: {
    title: 'Barrierefreiheit – Reticora',
    description: 'Wie wir diese Website auf Barrierefreiheit prüfen, welche Kontraste gelten, was bekannt eingeschränkt ist und wie Sie uns Hinweise geben.',
  },
  hero: {
    h1: 'Barrierefreiheit dieser Website',
    lead: 'Hier steht, was wir an dieser Website prüfen, mit welchem Ergebnis und wo es Grenzen gibt. Die Angaben gelten für die Website, nicht für die Anwendung Reticora.',
    asOf: '12. November 2026',
  },
  pruefen: {
    title: 'Wie wir prüfen',
    items: [
      'Jede Seite wird bei jeder Änderung automatisch mit axe-core geprüft. Stand heute: ohne Befund. [C-97]',
      'Mit der Tastatur geprüft und bedienbar: das Menü, die aufklappbaren Belege, die Ausfallsimulation und das Kontaktformular. [C-98]',
      'Die Ausfallsimulation hat zusätzlich zu den Punkten im Schema einen Umschaltknopf je CI und eine Ergebniszeile, die Screenreader vorlesen.',
    ],
  },
  kontraste: {
    title: 'Kontraste',
    text: 'Die Farben sind so gewählt, dass Text mindestens das Kontrastverhältnis 4,5 : 1 und Umrisse von Bedienelementen mindestens 3 : 1 erreichen. Die Werte sind nach der Formel der WCAG 2 berechnet. [C-95]',
    label: 'Kontrastverhältnisse nach Farbthema',
    after: 'Die Werte stammen aus unseren Gestaltungsvorgaben und sind von uns berechnet, nicht von Dritten geprüft. [C-95]',
    heads: { pair: 'Paar', dark: 'dunkles Thema „Leitstand“', light: 'helles Thema „Dokument“', min: 'Mindestwert' },
    rows: [
      { pair: 'Text auf Seitengrund', dark: '16,0 : 1', light: '15,7 : 1', min: '4,5 : 1' },
      { pair: 'Vorspann und Beschreibungen auf Seitengrund', dark: '8,3 : 1', light: '6,4 : 1', min: '4,5 : 1' },
      { pair: 'Hinweise und Bildunterschriften auf Seitengrund', dark: '6,4 : 1', light: '5,0 : 1', min: '4,5 : 1' },
      { pair: 'Akzentfarbe auf Seitengrund', dark: '9,0 : 1', light: '5,0 : 1', min: '4,5 : 1' },
      { pair: 'Umriss von Bedienelementen auf Seitengrund', dark: '3,9 : 1', light: '3,1 : 1', min: '3,0 : 1' },
    ],
  },
  bewegung: {
    title: 'Bewegung und Darstellung',
    text: 'Bewegung gibt es nur als Antwort auf eine Handlung, höchstens 150 ms lang. Ist im System „Bewegung reduzieren“ eingestellt, entfällt sie ganz. [C-96] Im Modus „Erzwungene Farben“ (etwa dem Kontrastmodus von Windows) übernehmen Knöpfe, Netzschema und Ausfallsimulation die Systemfarben; ausgefallene und betroffene CIs bleiben unterscheidbar. [C-99] Farbe trägt nie allein eine Aussage: Zustände haben ein Wort, das Netzschema eine Ergebniszeile.',
  },
  grenzen: {
    title: 'Bekannte Einschränkungen',
    items: [
      'Die Bilder der Anwendung sind noch Platzhalter. Jeder Platzhalter nennt in Text, was später zu sehen sein wird.',
      'Schemazeichnungen wie das Netzschema sind vereinfacht. Ihr Inhalt steht zusätzlich als Text daneben: Die Ergebniszeile nennt jedes betroffene CI beim Namen.',
    ],
  },
  hinweise: {
    title: 'Hinweise an uns',
    text: 'Ist Ihnen eine Barriere aufgefallen? Schreiben Sie uns:',
  },
} as const;
