import { describe, expect, it } from 'vitest';
import { computeImpact, impactSentence } from '../../src/lib/impact';

const N = ['usv-01', 'pdu-a', 'pdu-b', 'sw-access-01', 'srv-01', 'srv-02', 'nas-01', 'vm-app-01', 'vm-db-01'];
const E = [
  { from: 'pdu-a', to: 'usv-01', rel: 'powered_by' },
  { from: 'pdu-b', to: 'usv-01', rel: 'powered_by' },
  { from: 'sw-access-01', to: 'pdu-a', rel: 'powered_by' },
  { from: 'srv-01', to: 'pdu-a', rel: 'powered_by' },
  { from: 'srv-02', to: 'pdu-a', rel: 'powered_by' },
  { from: 'srv-01', to: 'pdu-b', rel: 'powered_by' },
  { from: 'srv-02', to: 'pdu-b', rel: 'powered_by' },
  { from: 'nas-01', to: 'pdu-b', rel: 'powered_by' },
  { from: 'vm-app-01', to: 'srv-01', rel: 'hosted_on' },
  { from: 'vm-db-01', to: 'srv-02', rel: 'hosted_on' },
] as const;

describe('computeImpact (design-system §6.2)', () => {
  it('pdu-a', () => {
    expect(computeImpact(N, E, ['pdu-a'])).toEqual({ failed: ['pdu-a'], affected: ['sw-access-01'], guarded: ['srv-01', 'srv-02'] });
  });
  it('pdu-b', () => {
    expect(computeImpact(N, E, ['pdu-b'])).toEqual({ failed: ['pdu-b'], affected: ['nas-01'], guarded: ['srv-01', 'srv-02'] });
  });
  it('pdu-a und pdu-b', () => {
    const r = computeImpact(N, E, ['pdu-a', 'pdu-b']);
    expect(r.failed).toEqual(['pdu-a', 'pdu-b']);
    expect(r.affected).toEqual(['sw-access-01', 'srv-01', 'srv-02', 'nas-01', 'vm-app-01', 'vm-db-01']);
    expect(r.guarded).toEqual([]);
  });
  it('usv-01', () => {
    const r = computeImpact(N, E, ['usv-01']);
    expect(r.affected).toHaveLength(8);
    expect(r.affected).not.toContain('usv-01');
    expect(r.guarded).toEqual([]);
  });
  it('srv-01', () => {
    expect(computeImpact(N, E, ['srv-01'])).toEqual({ failed: ['srv-01'], affected: ['vm-app-01'], guarded: [] });
  });
  it('eine VM', () => {
    expect(computeImpact(N, E, ['vm-db-01'])).toEqual({ failed: ['vm-db-01'], affected: [], guarded: [] });
  });
  it('hosted_on: ein Versorger genügt', () => {
    const r = computeImpact(['a', 'b', 'c'], [{ from: 'a', to: 'b', rel: 'hosted_on' }, { from: 'a', to: 'c', rel: 'hosted_on' }], ['b']);
    expect(r.affected).toEqual(['a']);
  });
  it('unbekannter Knoten wird ignoriert', () => {
    expect(computeImpact(N, E, ['gibt-es-nicht'])).toEqual({ failed: [], affected: [], guarded: [] });
  });
  it('leere Auswahl', () => {
    expect(computeImpact(N, E, [])).toEqual({ failed: [], affected: [], guarded: [] });
  });
});

describe('impactSentence', () => {
  const s = (lang: 'de' | 'en', f: string[]) => impactSentence(lang, computeImpact(N, E, f));
  it('ein CI, eines betroffen', () => {
    expect(s('de', ['pdu-a'])).toEqual({
      main: 'Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt).',
      guarded: 'Durch Redundanz geschützt: srv-01, srv-02.',
    });
    expect(s('en', ['pdu-a'])).toEqual({
      main: 'If "pdu-a" fails, 1 more CI is affected (shown in grey).',
      guarded: 'Protected by redundancy: srv-01, srv-02.',
    });
  });
  it('ein CI, mehrere betroffen', () => {
    expect(s('de', ['usv-01'])).toEqual({ main: 'Fällt „usv-01“ aus, sind 8 weitere CIs betroffen (grau dargestellt).', guarded: null });
    expect(s('en', ['usv-01'])).toEqual({ main: 'If "usv-01" fails, 8 more CIs are affected (shown in grey).', guarded: null });
  });
  it('ein CI, keines betroffen', () => {
    expect(s('de', ['vm-db-01'])).toEqual({ main: 'Fällt „vm-db-01“ aus, ist kein weiteres CI betroffen.', guarded: null });
    expect(s('en', ['vm-db-01'])).toEqual({ main: 'If "vm-db-01" fails, no other CI is affected.', guarded: null });
  });
  it('mehrere CIs', () => {
    expect(s('de', ['pdu-a', 'pdu-b'])).toEqual({
      main: 'Fallen 2 CIs (pdu-a, pdu-b) gemeinsam aus, sind 6 weitere CIs betroffen (grau dargestellt).',
      guarded: null,
    });
    expect(s('en', ['pdu-a', 'pdu-b'])).toEqual({
      main: 'If 2 CIs (pdu-a, pdu-b) fail together, 6 more CIs are affected (shown in grey).',
      guarded: null,
    });
  });
  it('nichts gewählt', () => {
    expect(s('de', [])).toEqual({ main: 'Wählen Sie ein CI, um seinen Ausfall zu simulieren.', guarded: null });
    expect(s('en', [])).toEqual({ main: 'Choose a CI to simulate its outage.', guarded: null });
  });
});
