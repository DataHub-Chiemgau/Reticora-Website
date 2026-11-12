export const UI = {
  nav: {
    label: 'Hauptnavigation',
    items: [
      { key: 'product', label: 'Produkt', href: '/produkt/discovery/', match: '/produkt/' },
      { key: 'devices', label: 'Geräte', href: '/geraete/', match: '/geraete/' },
      { key: 'solutions', label: 'Lösungen', href: '/loesungen/msp/', match: '/loesungen/' },
      { key: 'security', label: 'Sicherheit', href: '/sicherheit/', match: '/sicherheit/' },
      { key: 'pricing', label: 'Preise', href: '/preise/', match: '/preise/' },
    ],
  },
  actions: { trial: '30 Tage testen', demo: 'Live-Demo', login: 'Anmelden', contact: 'Kontakt' },
  lang: { label: 'Sprache', de: 'DE', en: 'EN', deHref: '/', enHref: '/en/' },
  footer: {
    columns: [
      {
        title: 'Produkt',
        links: [
          { label: 'Discovery', href: '/produkt/discovery/' },
          { label: 'Datenqualität', href: '/produkt/datenqualitaet/' },
          { label: 'Topologie und Impact', href: '/produkt/topologie/' },
          { label: 'Verwaltung', href: '/produkt/verwaltung/' },
          { label: 'Betrieb', href: '/produkt/betrieb/' },
          { label: 'Compliance', href: '/produkt/compliance/' },
          { label: 'API', href: '/produkt/api/' },
        ],
      },
      {
        title: 'Einsatz',
        links: [
          { label: 'Für Netzbetreiber', href: '/loesungen/netzbetreiber/' },
          { label: 'Für MSPs', href: '/loesungen/msp/' },
          { label: 'Unterstützte Geräte', href: '/geraete/' },
          { label: 'Preise', href: '/preise/' },
        ],
      },
      {
        title: 'Vertrauen',
        links: [
          { label: 'Sicherheit', href: '/sicherheit/' },
          { label: 'Subprozessoren', href: '/sicherheit/subprozessoren/' },
          { label: 'Barrierefreiheit', href: '/barrierefreiheit/' },
        ],
      },
    ],
    contactTitle: 'Kontakt',
    contactHref: '/kontakt/',
    demoHref: '/demo/',
    legal: [
      { label: 'Impressum', href: '/impressum/' },
      { label: 'Datenschutz', href: '/datenschutz/' },
      { label: 'AGB', href: '/agb/' },
    ],
    english: 'English',
  },
  b2b: 'Angebot nur für Unternehmen.',
  skip: 'Zum Inhalt',
  menu: 'Menü',
  beleg: 'Beleg',
  copy: 'Kopieren',
  copied: 'Kopiert',
  placeholder: 'Platzhalter für Screenshot',
  darkTheme: 'dunkles Thema',
  figure: 'Abb.',
  asOf: 'Stand',
} as const;
