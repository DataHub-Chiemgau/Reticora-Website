import { expect, test, vi } from 'vitest';
import { CLAIMS } from '../../src/data/claims';
import { belegText } from '../../src/components/beleg-text';
import devPages from '../../src/integrations/dev-pages';

test('der Beleg gibt für keinen Claim den internen Vermerk aus', () => {
  const withNote = CLAIMS.filter((c) => c.note);
  expect(withNote.length).toBeGreaterThan(0);
  for (const c of CLAIMS)
    for (const lang of ['de', 'en'] as const) {
      const t = belegText(c.id, lang);
      expect(t.title).toBe(c.title[lang]);
      expect(t.evidence).toBe(c.evidence[lang]);
      if (c.note) expect(`${t.title} ${t.evidence}`).not.toContain(c.note);
    }
});

test('Entwicklungsseiten werden bei RETICORA_RELEASE=1 nicht eingehängt', () => {
  const run = () => {
    const injectRoute = vi.fn();
    (devPages().hooks['astro:config:setup'] as any)({ injectRoute });
    return injectRoute;
  };
  vi.stubEnv('RETICORA_RELEASE', '1');
  expect(run()).not.toHaveBeenCalled();
  vi.stubEnv('RETICORA_RELEASE', '');
  expect(run()).toHaveBeenCalledWith({ pattern: '/dev/bausteine', entrypoint: './src/dev/bausteine.astro' });
  vi.unstubAllEnvs();
});
