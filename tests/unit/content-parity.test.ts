import { describe, expect, test } from 'vitest';
import { content } from '../../src/content';
import { ROUTES } from '../../src/i18n/routes';
import { germanLeftovers } from '../german-leftovers';

/**
 * Englisch und Deutsch haben je Seite dieselbe Gestalt: Schlüssel, Abschnitte und Blockarten, Belege und Screenshots
 * in derselben Reihenfolge, Tabellen gleicher Form, dieselben Zahlen; nur die Texte unterscheiden sich.
 * Die Typprüfung (`Translation<…>` in src/content/types.ts) erzwingt einen Teil davon schon beim Bauen.
 */
const DE = content('de');
const EN = content('en');
type C = typeof DE;

/** Jede Seite mit Inhaltsdatei: deutsche Adresse aus ROUTES und Zugriff auf ihren Inhalt. Neue Seiten hier eintragen. */
const PAGES: { path: string; get: (c: C) => unknown }[] = [
  { path: '/', get: (c) => c.home },
  { path: '/produkt/discovery/', get: (c) => c.produkt.discovery },
  { path: '/produkt/datenqualitaet/', get: (c) => c.produkt.datenqualitaet },
  { path: '/produkt/topologie-impact/', get: (c) => c.produkt['topologie-impact'] },
  { path: '/produkt/verwaltung/', get: (c) => c.produkt.verwaltung },
  { path: '/produkt/betrieb/', get: (c) => c.produkt.betrieb },
  { path: '/produkt/compliance/', get: (c) => c.produkt.compliance },
  { path: '/produkt/api/', get: (c) => c.produkt.api },
  { path: '/geraete/', get: (c) => c.geraete },
  { path: '/loesungen/isp/', get: (c) => c.isp },
  { path: '/loesungen/msp/', get: (c) => c.msp },
  { path: '/sicherheit/', get: (c) => c.sicherheit },
  { path: '/preise/', get: (c) => c.preise },
  { path: '/demo/', get: (c) => c.demo },
  { path: '/kontakt/', get: (c) => c.kontakt },
  { path: '/barrierefreiheit/', get: (c) => c.barrierefreiheit },
];

/** Schlüssel, deren Werte keine Texte sind und in beiden Sprachen gleich bleiben. */
const FIXED_KEYS = new Set(['id', 'kind', 'href', 'key', 'rowHeader', 'claim', 'claims', 'actions', 'ratio', 'variant', 'sub', 'topic', 'numeric', 'match', 'groupId']);
/** Ein Wert, der nur eine Beleg- oder Screenshot-Nummer ist, bleibt gleich (etwa `rowClaims.storage`). Ein Text unter einem festen Schlüssel
 *  (die Spaltenüberschrift `heads.claims`) ist dagegen ein Text. */
const ID_ONLY = /^[CS]-\d+$/;

/** Texte, die auf Englisch gleich lauten dürfen (Eigennamen, Protokolle, Produktnamen, Kennwörter der App). Ergänzen, wenn nötig. */
const SAME_OK = new Set<string>([
  'Sweep', 'Poll', 'Hosting', 'EU', 'CIs', 'CI', 'API', 'REST', 'Webhooks', 'Export', 'Limit', 'Discovery', 'Compliance', 'Collector',
  'Monitoring', 'Tickets', 'Topology', 'Enterprise', 'Standard', 'Pro', 'Essentials', 'Storage', 'Review-Inbox', 'Scope', 'Scopes',
  'Redfish', 'SNMP', 'SSH', 'LLDP', 'WMI', 'NATS', 'HTTPS', 'OpenAPI', 'CSV', 'DATEV', 'GET /api/v1/cis', 'Synology · QNAP · TrueNAS',
  // Preise, Sicherheit, Lösungen: Paketnamen, Ports und Richtungen, Fachwörter der App
  'Enterprise Shared', 'Enterprise Local', 'Essentials, Standard, Pro', 'Cloud', 'Collectors', 'Add-on', 'Port', 'Updates', 'SLAs', 'Asset',
  'Dashboard.', 'Collector → Reticora', '443/TCP, HTTPS', 'ICMP, ARP, 22, 80, 443, 161/UDP, 623, 5985, 8006',
  // Startseite und Produktseiten: Geräte- und Protokollnamen
  'Racks', 'Ports 22, 80, 443, 623, 5985, 8006', 'WMI, IPMI', 'SSH, NAS',
  'Dell iDRAC · HPE iLO · Lenovo XCC · Supermicro BMC · VMware ESXi · Proxmox VE · Windows Server · Linux',
]);

/** Pfade (wie `fehler` sie nennt), deren Zahlen bewusst abweichen dürfen, etwa ein umgestelltes Datum. Mit Begründung ergänzen. */
const NUMBERS_EXEMPT = new Set<string>([]);

const claimsOf = (s: string) => s.match(/\bC-\d+\b/g) ?? [];
const shotsOf = (s: string) => s.match(/\bS-\d+\b/g) ?? [];
/** Zahlen (ohne Beleg- und Screenshot-Nummern) ohne Tausendertrenner, Dezimalkomma als Punkt, sortiert (Reihenfolge darf sich im Satz ändern). */
const numbersOf = (s: string) =>
  (s.replace(/\b[CS]-\d+\b/g, '').replace(/(\d)\u00a0(?=\d{3}(?!\d))/g, '$1').replace(/\u00a0/g, ' ').replace(/(\d)[.,](?=\d{3}(?!\d))/g, '$1').replace(/(\d),(\d)/g, '$1.$2').match(/\d+(?:\.\d+)?/g) ?? []).sort();
const lastKey = (path: string) => path.replace(/\[\d+\]$/, '').split('.').pop() ?? '';
const SAMPLE_ARGS = [20, 10, 5, 3];

/** Alle Abweichungen der Gestalt zwischen `de` und `en`; leer, wenn sie übereinstimmen. */
function fehler(de: unknown, en: unknown, path = ''): string[] {
  if (typeof de !== typeof en) return [`${path}: Typ ${typeof de} ≠ ${typeof en}`];
  if (typeof de === 'function') {
    const f = de as (...a: unknown[]) => unknown;
    const g = en as (...a: unknown[]) => unknown;
    if (f.length !== g.length) return [`${path}: ${f.length} ≠ ${g.length} Parameter`];
    const args = SAMPLE_ARGS.slice(0, f.length);
    return fehler(f(...args), g(...args), `${path}(${args.join(', ')})`);
  }
  if (Array.isArray(de)) {
    if (!Array.isArray(en)) return [`${path}: Liste ≠ ${typeof en}`];
    if (de.length !== en.length) return [`${path}: ${de.length} ≠ ${en.length} Einträge`];
    return de.flatMap((v, i) => fehler(v, en[i], `${path}[${i}]`));
  }
  if (de && typeof de === 'object') {
    const kd = Object.keys(de);
    const ke = Object.keys(en as object);
    if (kd.join('|') !== ke.join('|')) return [`${path}: Schlüssel ${kd.join(',')} ≠ ${ke.join(',')}`];
    return kd.flatMap((k) => fehler((de as Record<string, unknown>)[k], (en as Record<string, unknown>)[k], `${path}.${k}`));
  }
  if (typeof de !== 'string') return de === en ? [] : [`${path}: ${String(de)} ≠ ${String(en)}`];
  const d = de;
  const e = en as string;
  const key = lastKey(path);
  const out: string[] = [];
  // In Tabellenzeilen sind die Schlüssel Spaltennamen (etwa `key` für „Schlüssel“): dort ist ein Wert, der nicht wie eine Kennung aussieht, Text.
  const inRow = /\.rows\[\d+\]\.[^.[]+$/.test(path) && !/^[a-z0-9_-]+$/.test(d);
  if (ID_ONLY.test(d) || (FIXED_KEYS.has(key) && !inRow && !(key === 'claims' && /\s|[a-z]{3}/.test(d))))
    return d === e ? [] : [`${path}: fester Wert „${d}“ ≠ „${e}“`];
  if (e.trim() === '') out.push(`${path}: leer`);
  if (claimsOf(d).join() !== claimsOf(e).join()) out.push(`${path}: Belege ${claimsOf(d).join()} ≠ ${claimsOf(e).join()}`);
  if (shotsOf(d).join() !== shotsOf(e).join()) out.push(`${path}: Screenshots ${shotsOf(d).join()} ≠ ${shotsOf(e).join()}`);
  if (!NUMBERS_EXEMPT.has(path) && numbersOf(d).join() !== numbersOf(e).join()) out.push(`${path}: Zahlen ${numbersOf(d).join()} ≠ ${numbersOf(e).join()}`);
  const codeOnly = (key === 'code' || key === 'codeTitle') && !/^\s*#/m.test(d);
  // Was nach Code (`…`) und Belegen keine Buchstaben mehr hat, ist kein Text (etwa `pdu-a` oder ein bloßes [C-46]).
  const letters = /\p{L}/u.test(d.replace(/`[^`]*`/g, '').replace(/\[C-\d+(?:,\s*C-\d+)*\]/g, ''));
  if (d === e && letters && !SAME_OK.has(d) && !codeOnly) out.push(`${path}: nicht übersetzt „${d}“`);
  const german = key === 'code' || codeOnly ? [] : germanLeftovers(e);
  if (german.length) out.push(`${path}: deutsch im englischen Text: ${german.join('; ')}`);
  return out;
}

describe('Inhaltsparität de/en', () => {
  test('jede Seite aus content() steht in PAGES', () => {
    const listed = new Set(PAGES.map((p) => p.get(DE)));
    const all = Object.entries(DE).flatMap(([k, v]) => (k === 'produkt' ? Object.values(v) : [v]));
    expect(all.filter((v) => !listed.has(v)).length).toBe(0);
    for (const p of PAGES) expect(ROUTES.some((r) => r.de === p.path), p.path).toBe(true);
  });

  test('die Prüfung erkennt Abweichungen (Selbsttest)', () => {
    expect(fehler({ a: 'Text [C-01]', b: ['x'] }, { a: 'Text [C-02]', b: ['y', 'z'] })).toHaveLength(2);
    expect(fehler({ t: 'alle 24 h' }, { t: 'every 12 h' })).toEqual(['.t: Zahlen 24 ≠ 12']);
    expect(fehler({ t: 'Preis 1.190 €' }, { t: 'Price €1,190' })).toEqual([]);
    expect(fehler({ t: 'Gleich' }, { t: 'Gleich' })[0]).toMatch(/nicht übersetzt/);
    expect(fehler({ t: 'Der Collector' }, { t: 'Der Collector reads' }).join()).toMatch(/deutsch/);
    expect(fehler({ id: 'abc' }, { id: 'abd' })[0]).toMatch(/fester Wert/);
  });

  for (const p of PAGES) {
    const route = ROUTES.find((r) => r.de === p.path)!;
    const de = p.get(DE);
    const en = p.get(EN);
    const translated = en !== de;
    test.runIf(route.enStatus === 'gebaut')(`${route.en}: gebaut, also übersetzt`, () => {
      expect(translated).toBe(true);
    });
    test.runIf(translated)(`${route.en}: gleiche Gestalt wie ${p.path}, Texte englisch`, () => {
      expect(fehler(de, en)).toEqual([]);
    });
  }
});
