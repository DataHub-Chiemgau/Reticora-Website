import type { Rich } from '../types';
import { BETA, EXTRAS, FEATURES, PLANS } from '../../data/pricing';
import { eur, grouped, pct } from '../../lib/format';

/**
 * Texte der Seite „Preise“, wörtlich aus docs/copy/preise-de.md.
 * Preise, Limits und die Paketmatrix stammen ausschließlich aus src/data/pricing.ts.
 */
const AB = 'ab ';
const perCi = eur(EXTRAS.perCiMonthly);
const perService = eur(EXTRAS.perMonitoringServiceMonthly);
const first = pct(BETA.firstSixMonths);
const next = pct(BETA.nextSixMonths);
const from = PLANS[0];

export const preise = {
  meta: {
    title: 'Preise und Pakete – Reticora CMDB',
    description: `${from.name} ab ${eur(from.monthly)} im Monat, dazu Standard, Pro und Enterprise. Funktionen, Limits, Zusatzkosten und 30 Tage Test. Preise zzgl. MwSt., nur für Unternehmen.`,
  },
  hero: {
    title: 'Pakete und Preise',
    lead: 'Alle Pakete enthalten CMDB, Discovery, Topologie, Racks und API. Sie zahlen monatlich oder jährlich im Voraus. Preise zzgl. MwSt.',
  },
  pakete: {
    id: 'pakete',
    title: 'Die Pakete',
    label: 'Pakete, Preise und Limits',
    vat: 'zzgl. MwSt.',
    heads: {
      plan: 'Paket', monthly: 'im Monat', yearly: 'im Jahr', beta: 'erstes Beta-Jahr',
      cis: 'CIs', collectors: 'Collectors', users: 'Nutzer', claims: 'Belege',
    },
    /** Knopf je Paket: Essentials, Standard und Pro „30 Tage testen“ (ui.actions.trial), Enterprise „Kontakt aufnehmen“ mit Anliegen „Enterprise“. */
    contact: { label: 'Kontakt aufnehmen', topic: 'enterprise' },
    rows: PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      summary: p.summary.de,
      monthly: `${p.from ? AB : ''}${eur(p.monthly)}`,
      yearly: p.yearly === null ? 'auf Anfrage' : eur(p.yearly),
      beta: p.betaYearly === null ? '–' : eur(p.betaYearly),
      cis: `bis ${grouped(p.limits.cis)}`,
      collectors: p.limits.collectors === null ? 'unbegrenzt' : grouped(p.limits.collectors),
      users: p.limits.users === null ? 'unbegrenzt' : grouped(p.limits.users),
      enterprise: p.from,
      /** Belege der Zeile (preise-de.md, Tabelle „Werte zur Kontrolle“): Enterprise zusätzlich C-92. */
      claims: (p.from ? ['C-21', 'C-92'] : ['C-21']) as `C-${string}`[],
    })),
    beta: {
      lead: 'Beta-Rabatt:',
      text: `${first} in den ersten sechs Monaten, ${next} in den folgenden sechs Monaten, danach der volle Preis. Bei jährlicher Zahlung gilt im ersten Jahr der Preis der Spalte „erstes Beta-Jahr“. [C-21]` as Rich,
    },
  },
  funktionen: {
    id: 'funktionen',
    title: 'Funktionen je Paket',
    label: 'Funktionen je Paket im Vergleich',
    feature: 'Funktion',
    legend: '✓ enthalten · – nicht enthalten · ∞ unbegrenzt · Add-on: zu jedem Paket zubuchbar, Preis auf Anfrage',
    caption: 'Funktionen je Paket. Enterprise Shared und Enterprise Local unterscheiden sich im Betrieb. [C-21]' as Rich,
    /** Zeilen mit Zahlen tragen ihren Beleg: Dokumentenspeicher je Paket. */
    rowClaims: { storage: 'C-60' } as Record<string, `C-${string}`>,
    rows: FEATURES.map((f) => ({ id: f.id, label: f.label.de, plans: f.plans })),
  },
  zusatz: {
    id: 'zusatzkosten',
    title: 'Zusatzkosten',
    specs: [
      { term: 'je CI über dem Limit des Pakets', value: `${perCi} im Monat [C-94]` },
      { term: 'je Monitoring-Service', value: `${perService} im Monat [C-94]` },
      { term: 'Add-ons IGA und KI-Assistent', value: 'auf Anfrage' },
    ] as { term: string; value: Rich }[],
    note: 'Alle Beträge zzgl. MwSt.',
  },
  test: {
    id: 'test',
    title: '30 Tage testen',
    text: 'Der Test umfasst den Standard-Umfang für bis zu 100 CIs. Sie legen ein Konto an, bestätigen Ihre E-Mail-Adresse und richten bei der ersten Anmeldung eine Authenticator-App ein. Nach dem Test bleibt Ihre CMDB 30 Tage erhalten; wählen Sie bis dahin kein Paket, wird sie gelöscht. [C-22]' as Rich,
  },
  fragen: {
    id: 'fragen',
    title: 'Fragen zu Preisen und Paketen',
    items: [
      {
        q: 'Was zählt als CI?',
        a: 'Ein CI ist ein Eintrag in der CMDB: ein Gerät, eine virtuelle Maschine, ein Service. Für das Limit zählen alle nicht gelöschten CIs Ihrer Organisation, über alle Kunden, gleich ob die Discovery sie angelegt hat oder ein Mensch. [C-86]',
      },
      {
        q: 'Was passiert über dem Limit?',
        a: `Jedes CI über dem Limit Ihres Pakets kostet ${perCi} im Monat. Findet die Discovery über dem Limit ein neues Gerät, verwirft Reticora es nicht: Es wartet in der Review-Inbox als „Nicht lizenziertes CI“, bis es übernommen werden kann. [C-94, C-87]`,
      },
      {
        q: 'Was passiert nach dem Test?',
        a: 'Ihre CMDB bleibt nach dem Ende des Tests 30 Tage erhalten. Wählen Sie in dieser Zeit ein Paket, arbeiten Sie mit allen Daten weiter; sonst wird sie gelöscht. [C-22]',
      },
      {
        q: 'Was passiert, wenn ich in ein kleineres Paket wechsle?',
        a: 'Sie verlieren keine Daten. CIs über dem Limit des neuen Pakets werden als zusätzliche CIs berechnet. Funktionen, die das neue Paket nicht enthält, werden gesperrt; ihre Daten bleiben erhalten. [C-22, C-94]',
      },
      {
        q: 'Wie funktioniert der Beta-Rabatt?',
        a: `In den ersten sechs Monaten zahlen Sie ${first} weniger, in den folgenden sechs Monaten ${next} weniger, danach den vollen Preis. Zahlen Sie jährlich im Voraus, gilt im ersten Jahr der Preis der Spalte „erstes Beta-Jahr“. [C-21]`,
      },
      {
        q: 'Was unterscheidet Enterprise Shared und Enterprise Local?',
        a: 'Enterprise Shared läuft in der Cloud auf getrennter Infrastruktur. Enterprise Local wird bei Ihnen gehostet; der Preis enthält alle Arbeiten dafür. [C-92]',
      },
      { q: 'Was kosten IGA und der KI-Assistent?', a: 'Beide Add-ons sind zu jedem Paket zubuchbar. Den Preis nennen wir auf Anfrage.' },
      { q: 'Können Privatpersonen Reticora buchen?', a: 'Nein. Das Angebot richtet sich nur an Unternehmen. Alle Preise verstehen sich zuzüglich Mehrwertsteuer.' },
    ] as { q: string; a: Rich }[],
  },
};
