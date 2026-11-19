import { describe, expect, it } from 'vitest';
import { DEVICES } from '../../src/data/devices';

describe('devices', () => {
  it('keine Dubletten aus Hersteller und Familie', () => {
    const keys = DEVICES.map((d) => `${d.vendor}|${d.family}`.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('jede Kategorie außer „other“ ist belegt', () => {
    for (const cat of ['network', 'server', 'storage', 'power'] as const)
      expect(DEVICES.filter((d) => d.category === cat).length).toBeGreaterThan(0);
  });
  it('jeder Eintrag hat Hersteller, Familie und mindestens ein bekanntes Protokoll', () => {
    for (const d of DEVICES) {
      expect(d.vendor.trim()).not.toBe('');
      expect(d.family.trim()).not.toBe('');
      expect(d.protocols.length).toBeGreaterThanOrEqual(1);
      expect(new Set(d.protocols).size).toBe(d.protocols.length);
      for (const p of d.protocols) expect(['SNMP', 'SSH', 'Redfish', 'WMI']).toContain(p);
    }
  });
  it('enthält die Familien der Geräteliste der Startseite', () => {
    const has = (vendor: string, family: string) => DEVICES.some((d) => d.vendor === vendor && d.family === family);
    for (const [v, f] of [['Cisco', 'Catalyst 9200/9300'], ['MikroTik', 'RouterOS'], ['Dell', 'PowerEdge (iDRAC)'], ['Synology', 'DSM'], ['Raritan', 'PX PDU']])
      expect(has(v, f)).toBe(true);
  });
});
