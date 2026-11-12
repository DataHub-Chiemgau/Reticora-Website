import type { UI as DeUI } from './de';

/** Gleiche Schlüssel wie de.ts; die Typprüfung erzwingt das. Adressen bleiben deutsche Pfade und gehen durch `localize`. */
export const UI: typeof DeUI = {
  nav: {
    label: 'Main navigation',
    menuLabel: 'Main navigation in the menu',
    items: [
      { key: 'product', label: 'Product', href: '/produkt/discovery/', match: '/produkt/' },
      { key: 'devices', label: 'Devices', href: '/geraete/', match: '/geraete/' },
      { key: 'solutions', label: 'Solutions', href: '/loesungen/msp/', match: '/loesungen/' },
      { key: 'security', label: 'Security', href: '/sicherheit/', match: '/sicherheit/' },
      { key: 'pricing', label: 'Pricing', href: '/preise/', match: '/preise/' },
    ],
  },
  actions: { trial: 'Try for 30 days', demo: 'Live demo', login: 'Sign in', contact: 'Contact' },
  lang: { label: 'Language', de: 'DE', en: 'EN', deName: 'Deutsch', enName: 'English', soon: 'English version coming soon' },
  footer: {
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Discovery', href: '/produkt/discovery/' },
          { label: 'Data quality', href: '/produkt/datenqualitaet/' },
          { label: 'Topology and impact', href: '/produkt/topologie-impact/' },
          { label: 'Administration', href: '/produkt/verwaltung/' },
          { label: 'Operations', href: '/produkt/betrieb/' },
          { label: 'Compliance', href: '/produkt/compliance/' },
          { label: 'API', href: '/produkt/api/' },
        ],
      },
      {
        title: 'Use cases',
        links: [
          { label: 'For network operators', href: '/loesungen/isp/' },
          { label: 'For MSPs', href: '/loesungen/msp/' },
          { label: 'Supported devices', href: '/geraete/' },
          { label: 'Pricing', href: '/preise/' },
        ],
      },
      {
        title: 'Trust',
        links: [
          { label: 'Security', href: '/sicherheit/' },
          { label: 'Subprocessors', href: '/subprozessoren/' },
          { label: 'Accessibility', href: '/barrierefreiheit/' },
        ],
      },
    ],
    contactTitle: 'Contact',
    contactHref: '/kontakt/',
    demoHref: '/demo/',
    legal: [
      { label: 'Legal notice', href: '/impressum/' },
      { label: 'Privacy', href: '/datenschutz/' },
      { label: 'Terms', href: '/agb/' },
    ],
    switch: 'Deutsch',
    switchSoon: 'Deutsch (version coming soon)',
  },
  b2b: 'Offer for businesses only.',
  b2bShort: 'Offer for businesses only',
  home: 'Home',
  copyFailed: 'Copy failed',
  scrollHint: 'Schematic scrolls sideways.',
  cta: { title: 'Try Reticora with your own network for 30 days.' },
  skip: 'Skip to content',
  menu: 'Menu',
  beleg: 'Evidence',
  copy: 'Copy',
  copied: 'Copied',
  placeholder: 'Screenshot placeholder',
  darkTheme: 'dark theme',
  figure: 'Fig.',
  asOf: 'As of',
  topo: {
    section: 'Outage simulation',
    title: 'Schematic of a power chain with outage simulation',
    desc: 'usv-01 powers pdu-a and pdu-b. srv-01 and srv-02 hang off both PDUs, sw-access-01 only off pdu-a, nas-01 only off pdu-b. vm-app-01 runs on srv-01, vm-db-01 on srv-02.',
    group: 'Simulate outage',
    legendActive: 'CI, status “Active”',
    legendFailed: 'failed',
    legendAffected: 'affected (shown in grey)',
    legendNote: 'Schematic, not a screenshot',
  },
};
