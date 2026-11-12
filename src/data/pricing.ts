import type { Lang, Plan } from './types';

/** Nettopreise in EUR. Einzige Stelle für Preise und Limits. */
export const PLANS: readonly Plan[] = [
  {
    id: 'essentials', name: 'Essentials', monthly: 49, from: false, yearly: 490, betaYearly: 441,
    limits: { cis: 500, collectors: 2, users: 5 },
    summary: {
      de: 'CMDB, Discovery, Topologie, Racks, API, Assets, Tickets',
      en: 'CMDB, discovery, topology, racks, API, assets, tickets',
    },
  },
  {
    id: 'standard', name: 'Standard', monthly: 119, from: false, yearly: 1190, betaYearly: 1071,
    limits: { cis: 2500, collectors: 5, users: 25 },
    summary: {
      de: 'dazu Lager, Inventur, Etiketten, Unterschrift, SLAs, DATEV-Export',
      en: 'plus stock, stocktakes, labels, signatures, SLAs, DATEV export',
    },
  },
  {
    id: 'pro', name: 'Pro', monthly: 299, from: false, yearly: 2990, betaYearly: 2691,
    limits: { cis: 10000, collectors: 20, users: 100 },
    summary: {
      de: 'dazu Monitoring, Workflows, Formulare, Bestellungen',
      en: 'plus monitoring, workflows, forms, purchase orders',
    },
  },
  {
    id: 'enterprise-shared', name: 'Enterprise Shared', monthly: 999, from: true, yearly: null, betaYearly: null,
    limits: { cis: 50000, collectors: null, users: null },
    summary: {
      de: 'dazu Compliance und Endpoint-Agent, in der Cloud auf getrennter Infrastruktur',
      en: 'plus compliance and endpoint agent, in the cloud on separate infrastructure',
    },
  },
  {
    id: 'enterprise-local', name: 'Enterprise Local', monthly: 1999, from: true, yearly: null, betaYearly: null,
    limits: { cis: 50000, collectors: null, users: null },
    summary: {
      de: 'bei Ihnen gehostet, inklusive aller Arbeiten',
      en: 'hosted by you, all work included',
    },
  },
];

export const EXTRAS: { perCiMonthly: 0.05; perMonitoringServiceMonthly: 0.03 } = {
  perCiMonthly: 0.05,
  perMonitoringServiceMonthly: 0.03,
};

/**
 * Funktionen je Paket (`content-plan.md` §6.2). Quelle: Produkt-Repository
 * `backend/internal/entitlement/entitlement.go` (`planFeatures`, `storageDefaultMB`,
 * `Addons`). Wo Code und README §14 abweichen, gilt der Code (F-23).
 * Werte: `true` enthalten, `false` nicht enthalten, Text = Angabe statt Häkchen
 * (sprachneutral: Zahl mit Einheit, „∞“ für unbegrenzt, „Add-on“ für zubuchbar).
 */
export const FEATURES: { id: string; label: Record<Lang, string>; plans: Record<Plan['id'], boolean | string> }[] = [
  {
    id: 'cmdb', label: { de: 'CMDB, Discovery und Reviews', en: 'CMDB, discovery and reviews' },
    plans: { essentials: true, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'topology', label: { de: 'Topologie, Ausfallsimulation und Racks', en: 'Topology, outage simulation and racks' },
    plans: { essentials: true, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'api', label: { de: 'API, Webhooks, CSV-Export und Import', en: 'API, webhooks, CSV export and import' },
    plans: { essentials: true, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'datev', label: { de: 'DATEV-Export', en: 'DATEV export' },
    plans: { essentials: false, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'assets', label: { de: 'Assets, Zuweisungen, Verträge und Dokumente', en: 'Assets, assignments, contracts and documents' },
    plans: { essentials: true, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'storage', label: { de: 'Dokumentenspeicher', en: 'Document storage' },
    plans: {
      essentials: '1 000 MiB', standard: '10 000 MiB', pro: '50 000 MiB',
      'enterprise-shared': '∞', 'enterprise-local': '∞',
    },
  },
  {
    id: 'tickets', label: { de: 'Tickets', en: 'Tickets' },
    plans: { essentials: true, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'sla', label: { de: 'SLAs und Geschäftskalender', en: 'SLAs and business calendars' },
    plans: { essentials: false, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'stock', label: { de: 'Lagerbestand, Inventur, Etiketten und Unterschrift', en: 'Stock, stocktakes, labels and signatures' },
    plans: { essentials: false, standard: true, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'orders', label: { de: 'Bestellungen', en: 'Purchase orders' },
    plans: { essentials: false, standard: false, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'operations', label: { de: 'Monitoring, Workflows und Formulare', en: 'Monitoring, workflows and forms' },
    plans: { essentials: false, standard: false, pro: true, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'compliance', label: { de: 'Compliance, Befunde und Endpoint-Agent', en: 'Compliance, findings and endpoint agent' },
    plans: { essentials: false, standard: false, pro: false, 'enterprise-shared': true, 'enterprise-local': true },
  },
  {
    id: 'addons', label: { de: 'IGA und KI-Assistent', en: 'IGA and AI assistant' },
    plans: { essentials: 'Add-on', standard: 'Add-on', pro: 'Add-on', 'enterprise-shared': 'Add-on', 'enterprise-local': 'Add-on' },
  },
];

export const BETA:{ firstSixMonths: 0.2; nextSixMonths: 0.1 } = { firstSixMonths: 0.2, nextSixMonths: 0.1 };
