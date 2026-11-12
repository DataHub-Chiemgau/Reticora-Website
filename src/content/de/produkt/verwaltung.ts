import type { PageContent } from '../../types';
import { FEATURES, PLANS } from '../../../data/pricing';

/** Dokumentenspeicher je Paket aus der Paketmatrix (src/data/pricing.ts), deutsch gesetzt: „1.000 MiB“, „unbegrenzt“. */
const storage = FEATURES.find((f) => f.id === 'storage')!.plans;
const storageText = (v: boolean | string): string => (typeof v !== 'string' || v === '∞' ? 'unbegrenzt' : v.replace(/(\d)[\u00a0 ](?=\d{3}\b)/, '$1.'));
const planName = (id: (typeof PLANS)[number]['id']) => PLANS.find((p) => p.id === id)!.name;
const STORAGE_ROWS = [
  { plan: planName('essentials'), size: storageText(storage.essentials) + ' [C-60]' },
  { plan: planName('standard'), size: storageText(storage.standard) + ' [C-60]' },
  { plan: planName('pro'), size: storageText(storage.pro) + ' [C-60]' },
  { plan: 'Enterprise', size: storageText(storage['enterprise-shared']) + ' [C-60]' },
];

/** Wörtlich aus docs/copy/produkt-verwaltung-de.md. */
export const VERWALTUNG: PageContent = {
  meta: {
    title: 'Verwaltung – Assets, Lager, Inventur, Verträge',
    description:
      'Assets mit Zuweisung und Unterschrift, Lager bis zum Fach, Inventur per Barcode, Verträge und Dokumente – auf demselben Bestand wie Ihre CMDB.',
  },
  hero: {
    title: 'Kaufmännische Daten am selben Gerät wie die technischen.',
    lead:
      'Die Discovery weiß, was im Netz läuft. Die Verwaltung weiß, was es gekostet hat, wer es hat und wo der Ersatz liegt. In Reticora ist das ein Bestand, nicht zwei Listen.',
    actions: ['demo', 'trial'],
  },
  sections: [
    {
      id: 'asset-und-ci',
      title: 'Asset und CI: getrennt und verknüpft',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Das CI beschreibt, was ein Gerät im Netz tut. Das Asset beschreibt das physische Stück: Seriennummer, Standort, Lebenszyklus, Kaufdaten. Beide sind getrennt und lassen sich verknüpfen. Was das Asset führt, zeigt das CI nur an. Meldet die Discovery eine andere Seriennummer als das Asset, entsteht ein Review statt einer stillen Änderung. [C-56, C-35, C-49]',
          ],
          shot: { id: 'S-09', caption: 'Asset mit Zuweisung.' },
        },
      ],
    },
    {
      id: 'zuweisung',
      title: 'Zuweisung, Reservierung, Entsorgung',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Sie weisen ein Asset einer Person oder einem Team zu und lassen die Übergabe unterschreiben (ab Standard). Sie reservieren Geräte vorab und dokumentieren am Ende die Entsorgung nach DIN 66399. [C-61, C-35]',
          ],
        },
      ],
    },
    {
      id: 'lager',
      title: 'Lager bis zum Fach',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Lager gliedern sich in Lager, Zone, Regal und Fach. Für Mengenartikel wie Patchkabel oder Transceiver führt Reticora den Bestand je Fach und warnt am Mindestbestand. Jede Bewegung – Eingang, Umlagerung, Zuweisung, Rückgabe, Reparatur, Entsorgung – steht in einer Historie, die sich nicht nachträglich ändern lässt. [C-57, C-36] Interne Bestellungen genehmigt eine zweite Person (ab Pro). [C-58]',
          ],
        },
      ],
    },
    {
      id: 'inventur',
      title: 'Inventur mit Barcode',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Sie drucken Etiketten mit Barcode, starten eine Inventur und erfassen den Bestand per Scan. Reticora zeigt die Differenzen zum Soll; mit dem Abschluss ist die Inventur festgeschrieben (ab Standard). [C-59, C-36]',
          ],
          shot: { id: 'S-10', caption: 'Inventur.' },
        },
      ],
    },
    {
      id: 'vertraege',
      title: 'Verträge und Dokumente',
      blocks: [
        {
          kind: 'split',
          paras: [
            'Lieferanten und Verträge hängen am Bestand; vor dem Ablauf eines Vertrags warnt Reticora. [C-61] Dokumente – Lieferscheine, Garantien, Übergabeprotokolle – haben Versionen und lassen sich mit CIs, Assets, Zuweisungen, Tickets, Standorten, Inventuren und Entsorgungen verknüpfen. Jede neue Version wird vor dem ersten Download auf Schadsoftware geprüft; bis dahin ist der Download gesperrt. [C-60]',
          ],
          side: {
            kind: 'table',
            label: 'Dokumentenspeicher je Paket',
            rowHeader: 'plan',
            columns: [
              { key: 'plan', head: 'Paket' },
              { key: 'size', head: 'Dokumentenspeicher', numeric: true },
            ],
            rows: STORAGE_ROWS,
          },
        },
      ],
    },
    {
      id: 'export',
      title: 'Export für die Buchhaltung',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Für die Buchhaltung exportiert Reticora im DATEV-Format (ab Standard). Der CSV-Export enthält nur die Felder, die die exportierende Person sehen darf. [C-11, C-74]',
          ],
        },
      ],
    },
  ],
};
