import { describe, expect, it } from 'vitest';
import { FEATURES, PLANS, EXTRAS } from '../../src/data/pricing';

const ids = PLANS.map((p) => p.id);
const row = (id: string) => {
  const f = FEATURES.find((x) => x.id === id);
  if (!f) throw new Error(`Zeile fehlt: ${id}`);
  return ids.map((p) => f.plans[p]);
};

describe('Paketmatrix (FEATURES)', () => {
  it('eindeutige Zeilen, Beschriftung in beiden Sprachen, Wert für jedes Paket', () => {
    const fids = FEATURES.map((f) => f.id);
    expect(new Set(fids).size).toBe(fids.length);
    for (const f of FEATURES) {
      expect(f.label.de.trim()).not.toBe('');
      expect(f.label.en.trim()).not.toBe('');
      expect(Object.keys(f.plans).sort()).toEqual([...ids].sort());
    }
  });
  it('Pakete sind aufsteigend: was ein Paket hat, hat auch jedes größere', () => {
    for (const f of FEATURES) {
      const v = ids.map((p) => f.plans[p]);
      for (let i = 1; i < v.length; i++) if (v[i - 1] !== false) expect(v[i]).not.toBe(false);
    }
  });
  it('Zuordnung nach dem Code des Produkts', () => {
    expect(row('cmdb')).toEqual([true, true, true, true, true]);
    expect(row('datev')).toEqual([false, true, true, true, true]);
    expect(row('sla')).toEqual([false, true, true, true, true]);
    expect(row('stock')).toEqual([false, true, true, true, true]);
    expect(row('orders')).toEqual([false, false, true, true, true]);
    expect(row('operations')).toEqual([false, false, true, true, true]);
    expect(row('compliance')).toEqual([false, false, false, true, true]);
    expect(row('storage')).toEqual(['1 000 MiB', '10 000 MiB', '50 000 MiB', '∞', '∞']);
    expect(row('addons')).toEqual(Array(5).fill('Add-on'));
  });
  it('Zusatzkosten bleiben unverändert', () => {
    expect(EXTRAS).toEqual({ perCiMonthly: 0.05, perMonitoringServiceMonthly: 0.03 });
  });
});
