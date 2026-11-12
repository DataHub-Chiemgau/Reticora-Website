import type { Screenshot, ScreenshotId } from './types';

const s = (id: ScreenshotId, de: string, en: string, width = 1440, height = 900): Screenshot => ({
  id, motif: { de, en }, width, height,
});

export const SCREENSHOTS: readonly Screenshot[] = [
  s('S-01', 'CI-Liste mit Filter', 'CI list with filter'),
  s('S-02', 'CI-Detail mit Herkunft eines Feldes', 'CI detail with provenance of a field'),
  s('S-03', 'Review-Inbox mit Vergleichsansicht', 'Review inbox with comparison view'),
  s('S-04', 'Topologie', 'Topology'),
  s('S-05', 'Rack, Vorderseite', 'Rack, front view', 720, 900),
  s('S-06', 'Ausfallsimulation', 'Outage simulation'),
  s('S-07', 'Discovery: Scopes und Collector-Status', 'Discovery: scopes and collector status'),
  s('S-08', 'Erste Schritte', 'Getting started'),
  s('S-09', 'Asset mit Zuweisung', 'Asset with assignment'),
  s('S-10', 'Inventur', 'Stocktake'),
  s('S-11', 'Ticket mit SLA', 'Ticket with SLA'),
  s('S-12', 'Monitoring: Metriken und Alarmregeln', 'Monitoring: metrics and alert rules'),
  s('S-13', 'Compliance: Regeln, Score und Abweichungen', 'Compliance: rules, score and deviations'),
  s('S-14', 'Audit-Protokoll', 'Audit log'),
  s('S-15', 'Webhooks: Abonnements, Zustellverlauf und Dead-Letter-Queue', 'Webhooks: subscriptions, delivery history and dead-letter queue'),
  s('S-16', 'Dashboard', 'Dashboard'),
  s('S-17', 'Berechtigungen', 'Permissions'),
  s('S-18', 'Arbeitsbereich Organisation → Kunde → Standort', 'Scope Organization → Customer → Site'),
];

export function screenshot(id: ScreenshotId): Screenshot {
  const found = SCREENSHOTS.find((x) => x.id === id);
  if (!found) throw new Error(`Unbekannter Screenshot: ${id}`);
  return found;
}
