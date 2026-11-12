import type { PageContent, Translation } from '../../types';
import { FEATURES, PLANS } from '../../../data/pricing';

/** Document storage per plan from the plan matrix (src/data/pricing.ts), in English format: “1,000 MiB”, “unlimited”. */
const storage = FEATURES.find((f) => f.id === 'storage')!.plans;
const storageText = (v: boolean | string): string => (typeof v !== 'string' || v === '∞' ? 'unlimited' : v.replace(/(\d)[  ](?=\d{3}\b)/, '$1,'));
const planName = (id: (typeof PLANS)[number]['id']) => PLANS.find((p) => p.id === id)!.name;
const STORAGE_ROWS = [
  { plan: planName('essentials'), size: storageText(storage.essentials) + ' [C-60]' },
  { plan: planName('standard'), size: storageText(storage.standard) + ' [C-60]' },
  { plan: planName('pro'), size: storageText(storage.pro) + ' [C-60]' },
  { plan: 'Enterprise', size: storageText(storage['enterprise-shared']) + ' [C-60]' },
];

/** Verbatim from docs/copy/en/produkt-verwaltung-en.md. */
export const verwaltung: Translation<PageContent> = {
  meta: {
    title: 'Administration – assets, stock, stocktakes, contracts',
    description:
      'Assets with assignment and signature, stock down to the bin, stocktakes by barcode, contracts and documents – on the same inventory as your CMDB.',
  },
  hero: {
    title: 'Commercial data on the same device as the technical data.',
    lead:
      'Discovery knows what runs in the network. Administration knows what it cost, who has it and where the spare is. In Reticora that is one inventory, not two lists.',
    actions: ['demo', 'trial'],
  },
  sections: [
    {
      id: 'asset-und-ci',
      title: 'Asset and CI: separate and linked',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'The CI describes what a device does in the network. The asset describes the physical item: serial number, location, lifecycle, purchase data. The two are separate and can be linked. What the asset holds, the CI only displays. If discovery reports a different serial number than the asset, you get a review instead of a silent change. [C-56, C-35, C-49]',
          ],
          shot: { id: 'S-09', caption: 'Asset with assignment.' },
        },
      ],
    },
    {
      id: 'zuweisung',
      title: 'Assignment, reservation, disposal',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'You assign an asset to a person or a team and have the handover signed (Standard and above). You reserve devices in advance and, at the end, document disposal according to DIN 66399, the German standard for destroying data media. [C-61, C-35]',
          ],
        },
      ],
    },
    {
      id: 'lager',
      title: 'Stock down to the bin',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Stock is organized into warehouse, zone, shelf and bin. For consumables such as patch cables or transceivers, Reticora keeps the stock level per bin and warns at the minimum stock level. Every movement – receipt, transfer, assignment, return, repair, disposal – is recorded in a history that cannot be changed afterwards. [C-57, C-36] Internal purchase orders are approved by a second person (Pro and above). [C-58]',
          ],
        },
      ],
    },
    {
      id: 'inventur',
      title: 'Stocktakes with barcodes',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'You print labels with barcodes, start a stocktake and record the stock by scanning. Reticora shows the differences from the expected count; once completed, the stocktake is locked (Standard and above). [C-59, C-36]',
          ],
          shot: { id: 'S-10', caption: 'Stocktake.' },
        },
      ],
    },
    {
      id: 'vertraege',
      title: 'Contracts and documents',
      blocks: [
        {
          kind: 'split',
          paras: [
            'Suppliers and contracts are linked to the inventory; Reticora warns before a contract expires. [C-61] Documents – delivery notes, warranties, handover records – have versions and can be linked to CIs, assets, assignments, tickets, locations, stocktakes and disposals. Every new version is scanned for malware before its first download; until then the download is blocked. [C-60]',
          ],
          side: {
            kind: 'table',
            label: 'Document storage per plan',
            rowHeader: 'plan',
            columns: [
              { key: 'plan', head: 'Plan' },
              { key: 'size', head: 'Document storage', numeric: true },
            ],
            rows: STORAGE_ROWS,
          },
        },
      ],
    },
    {
      id: 'export',
      title: 'Export for accounting',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'For accounting, Reticora exports in DATEV format (Standard and above), the format used by German accounting software. The CSV export contains only the fields the person exporting is allowed to see. [C-11, C-74]',
          ],
        },
      ],
    },
  ],
};
