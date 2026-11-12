import type { Plan } from './types';

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
      en: 'plus stock, stocktaking, labels, signatures, SLAs, DATEV export',
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

export const BETA: { firstSixMonths: 0.2; nextSixMonths: 0.1 } = { firstSixMonths: 0.2, nextSixMonths: 0.1 };
