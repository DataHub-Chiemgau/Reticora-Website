import { describe, expect, it } from 'vitest';
import { PLANS, EXTRAS, BETA } from '../../src/data/pricing';
import { CLAIMS, claim } from '../../src/data/claims';
import { SCREENSHOTS, screenshot } from '../../src/data/screenshots';
import { LINKS } from '../../src/data/links';
import { SITE } from '../../src/data/site';
import { TOPO_NODES, TOPO_EDGES, TOPO_INITIAL_FAILED } from '../../src/data/topology';

describe('pricing', () => {
  it('betaYearly ist 90 % des Jahrespreises', () => {
    for (const p of PLANS) if (p.yearly !== null) expect(p.betaYearly).toBe(Math.round(p.yearly * 0.9));
  });
  it('Preise', () => {
    expect(PLANS.map((p) => [p.id, p.monthly, p.yearly, p.from])).toEqual([
      ['essentials', 49, 490, false],
      ['standard', 119, 1190, false],
      ['pro', 299, 2990, false],
      ['enterprise-shared', 999, null, true],
      ['enterprise-local', 1999, null, true],
    ]);
    expect(PLANS.map((p) => p.name)).toEqual(['Essentials', 'Standard', 'Pro', 'Enterprise Shared', 'Enterprise Local']);
  });
  it('Limits', () => {
    expect(PLANS.map((p) => [p.limits.cis, p.limits.collectors, p.limits.users])).toEqual([
      [500, 2, 5], [2500, 5, 25], [10000, 20, 100], [50000, null, null], [50000, null, null],
    ]);
  });
  it('Zusatzkosten und Beta', () => {
    expect(EXTRAS).toEqual({ perCiMonthly: 0.05, perMonitoringServiceMonthly: 0.03 });
    expect(BETA).toEqual({ firstSixMonths: 0.2, nextSixMonths: 0.1 });
  });
  it('Kurzbeschreibungen in beiden Sprachen', () => {
    for (const p of PLANS) { expect(p.summary.de).not.toBe(''); expect(p.summary.en).not.toBe(''); }
  });
});

describe('claims', () => {
  it('eindeutig, vollständig, offen', () => {
    const ids = CLAIMS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(Array.from({ length: 38 }, (_, i) => `C-${String(i + 1).padStart(2, '0')}`));
    for (const c of CLAIMS) {
      expect(c.title.de).not.toBe(''); expect(c.evidence.de).not.toBe('');
      expect(c.title.en).not.toBe(''); expect(c.evidence.en).not.toBe('');
      expect(c.status).toBe('offen');
      expect(c.asOf).toBe('2026-11');
      expect(c.evidence.de).not.toMatch(/README|\.md|\.go|docs\/|backend\/|frontend\/|§/);
      for (const t of [c.title.de, c.title.en, c.evidence.de, c.evidence.en])
        expect(t).not.toMatch(/Nur mit Nachweis|Freigabe|noch zu|Auftraggeber|Betreiber|Launch|F-\d\d|to be confirmed|approval/i);
    }
  });
  it('C-16 erfindet keine Zusage', () => {
    expect(claim('C-16').evidence.de).not.toMatch(/vorgesehen|durchgeführt/);
  });
  it('claim() wirft bei unbekannter ID', () => {
    expect(claim('C-01').id).toBe('C-01');
    expect(() => claim('C-99')).toThrow();
  });
});

describe('screenshots', () => {
  it('S-01 bis S-18 lückenlos', () => {
    expect(SCREENSHOTS.map((s) => s.id)).toEqual(Array.from({ length: 18 }, (_, i) => `S-${String(i + 1).padStart(2, '0')}`));
    expect(screenshot('S-05')).toMatchObject({ width: 720, height: 900 });
    expect(screenshot('S-01')).toMatchObject({ width: 1440, height: 900 });
    expect(() => screenshot('S-99')).toThrow();
  });
});

describe('links, site, topology', () => {
  it('Links beginnen mit https://', () => {
    for (const [k, v] of Object.entries(LINKS)) if (k !== 'demoUser' && k !== 'demoPassword') expect(v.startsWith('https://')).toBe(true);
  });
  it('Site', () => {
    expect(SITE.email).toBeNull(); expect(SITE.phone).toBeNull();
    expect(SITE.city).toContain('Trostberg');
  });
  it('Topologie ist konsistent', () => {
    const ids = new Set(TOPO_NODES.map((n) => n.id));
    expect(TOPO_NODES).toHaveLength(9);
    for (const e of TOPO_EDGES) { expect(ids.has(e.from)).toBe(true); expect(ids.has(e.to)).toBe(true); }
    expect(TOPO_EDGES).toHaveLength(10);
    expect(TOPO_INITIAL_FAILED).toEqual(['pdu-a']);
  });
});
