import type { Rich } from '../types';
import type { preise as De } from '../de/preise';
import type { Translation } from '../types';
import { BETA, EXTRAS, FEATURES, PLANS } from '../../data/pricing';
import { eur, grouped, pct } from '../../lib/format';

/**
 * Text of the page “Pricing”, verbatim from docs/copy/en/preise-en.md.
 * Prices, limits and the plan matrix come only from src/data/pricing.ts; numbers in English format.
 */
const FROM = 'from ';
const perCi = eur(EXTRAS.perCiMonthly, 'en');
const perService = eur(EXTRAS.perMonitoringServiceMonthly, 'en');
const first = pct(BETA.firstSixMonths, 'en');
const next = pct(BETA.nextSixMonths, 'en');
const from = PLANS[0];

export const preise: Translation<typeof De> = {
  meta: {
    title: 'Plans and pricing – Reticora CMDB',
    description: `${from.name} from ${eur(from.monthly, 'en')} per month, plus Standard, Pro and Enterprise. Features, limits, additional charges and a 30-day trial. Prices excl. VAT, for businesses only.`,
  },
  hero: {
    title: 'Plans and pricing',
    lead: 'Every plan includes CMDB, discovery, topology, racks and API. You pay monthly or yearly in advance. Prices excl. VAT.',
  },
  pakete: {
    id: 'pakete',
    title: 'The plans',
    label: 'Plans, prices and limits',
    vat: 'excl. VAT',
    heads: {
      plan: 'Plan', monthly: 'per month', yearly: 'per year', beta: 'first beta year',
      cis: 'CIs', collectors: 'Collectors', users: 'Users', claims: 'Evidence', action: 'Description and action',
    },
    /** Button per plan: Essentials, Standard and Pro “Try for 30 days” (ui.actions.trial), Enterprise “Get in touch” with topic “Enterprise”. */
    contact: { label: 'Get in touch', topic: 'enterprise' },
    rows: PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      summary: p.summary.en,
      monthly: `${p.from ? FROM : ''}${eur(p.monthly, 'en')}`,
      yearly: p.yearly === null ? 'on request' : eur(p.yearly, 'en'),
      beta: p.betaYearly === null ? '–' : eur(p.betaYearly, 'en'),
      cis: `up to ${grouped(p.limits.cis, 'en')}`,
      collectors: p.limits.collectors === null ? 'unlimited' : grouped(p.limits.collectors, 'en'),
      users: p.limits.users === null ? 'unlimited' : grouped(p.limits.users, 'en'),
      enterprise: p.from,
      /** Evidence of the row (preise-en.md, table “Values for checking”): Enterprise additionally C-92. */
      claims: (p.from ? ['C-21', 'C-92'] : ['C-21']) as `C-${string}`[],
    })),
    beta: {
      lead: 'Beta discount:',
      text: `${first} in the first six months, ${next} in the following six months, then the full price. If you pay yearly, the price in the column “first beta year” applies in the first year. [C-21]` as Rich,
    },
  },
  funktionen: {
    id: 'funktionen',
    title: 'Features by plan',
    label: 'Features by plan compared',
    feature: 'Feature',
    legend: '✓ included · – not included · ∞ unlimited · Add-on: can be added to any plan, price on request',
    caption: 'Features by plan. Enterprise Shared and Enterprise Local differ in how they are operated. [C-21]' as Rich,
    /** Rows with numbers carry their evidence: document storage per plan. */
    rowClaims: { storage: 'C-60' } as Record<string, `C-${string}`>,
    /** Values such as “1 000 MiB” are language-neutral in FEATURES; English groups thousands with a comma (“1,000 MiB”). */
    rows: FEATURES.map((f) => ({
      id: f.id,
      label: f.label.en,
      plans: Object.fromEntries(
        Object.entries(f.plans).map(([k, v]) => [k, typeof v === 'string' ? v.replace(/(\d)\u00a0(?=\d{3}\b)/g, '$1,') : v]),
      ) as typeof f.plans,
    })),
  },
  zusatz: {
    id: 'zusatzkosten',
    title: 'Additional charges',
    specs: [
      { term: 'per CI above the plan limit', value: `${perCi} per month [C-94]` },
      { term: 'per monitoring service', value: `${perService} per month [C-94]` },
      { term: 'IGA and AI assistant add-ons', value: 'on request' },
    ] as { term: string; value: Rich }[],
    note: 'All amounts excl. VAT.',
  },
  test: {
    id: 'test',
    title: 'Try for 30 days',
    text: 'The trial covers the Standard plan for up to 100 CIs. You create an account, confirm your email address and set up an authenticator app at your first sign-in. After the trial your CMDB is kept for 30 days; if you do not choose a plan by then, it is deleted. [C-22]' as Rich,
  },
  fragen: {
    id: 'fragen',
    title: 'Questions about pricing and plans',
    items: [
      {
        q: 'What counts as a CI?',
        a: 'A CI is an entry in the CMDB: a device, a virtual machine, a service. The limit counts every CI of your organization that is not deleted, across all customers, whether discovery created it or a person. [C-86]',
      },
      {
        q: 'What happens above the limit?',
        a: `Each CI above your plan’s limit costs ${perCi} per month. If discovery finds a new device above the limit, Reticora does not discard it: it waits in the review inbox as an “Unlicensed CI” until it can be added. [C-94, C-87]`,
      },
      {
        q: 'What happens after the trial?',
        a: 'Your CMDB is kept for 30 days after the trial ends. If you choose a plan within that time, you keep working with all your data; otherwise it is deleted. [C-22]',
      },
      {
        q: 'What happens if I switch to a smaller plan?',
        a: 'You lose no data. CIs above the new plan’s limit are charged as additional CIs. Features the new plan does not include are locked; their data is kept. [C-22, C-94]',
      },
      {
        q: 'How does the beta discount work?',
        a: `In the first six months you pay ${first} less, in the following six months ${next} less, then the full price. If you pay yearly in advance, the price in the column “first beta year” applies in the first year. [C-21]`,
      },
      {
        q: 'What is the difference between Enterprise Shared and Enterprise Local?',
        a: 'Enterprise Shared runs in the cloud on separate infrastructure. Enterprise Local is hosted by you; the price includes all work for it. [C-92]',
      },
      { q: 'What do IGA and the AI assistant cost?', a: 'Both add-ons can be added to any plan. The price is available on request.' },
      { q: 'Can private individuals buy Reticora?', a: 'No. The offer is for businesses only. All prices are exclusive of VAT.' },
    ] as { q: string; a: Rich }[],
  },
};
