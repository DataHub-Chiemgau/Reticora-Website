import { describe, expect, it } from 'vitest';
import { hasClaims, highlightShell, hyphenate, nbsp, parseRich, plainText } from '../../src/content/rich';

describe('parseRich', () => {
  it('trennt Belege vom Satz und setzt kein Leerzeichen davor', () => {
    expect(parseRich('Ein Satz. [C-26] Und weiter.')).toEqual([
      { t: 'text', v: 'Ein Satz.' },
      { t: 'claim', id: 'C-26' },
      { t: 'text', v: ' Und weiter.' },
    ]);
  });
  it('liest mehrere Belege in einer Klammer', () => {
    expect(parseRich('x [C-02, C-77]').filter((p) => p.t === 'claim')).toEqual([{ t: 'claim', id: 'C-02' }, { t: 'claim', id: 'C-77' }]);
  });
  it('erkennt Code und Fett', () => {
    expect(parseRich('`audit-verify` und **fett**')).toEqual([{ t: 'code', v: 'audit-verify' }, { t: 'text', v: ' und ' }, { t: 'bold', v: 'fett' }]);
  });
  it('hasClaims und plainText', () => {
    expect(hasClaims('a [C-01]')).toBe(true);
    expect(hasClaims('a `[C-01]x`')).toBe(false);
    expect(plainText('Schlüssel `X-API-Key` nutzen. [C-11]')).toBe('Schlüssel X-API-Key nutzen.');
  });
});

describe('nbsp', () => {
  it('bindet Einheiten an die Zahl', () => {
    expect(nbsp('alle 24 h, 15 min, 90 Tage, 1.000 MiB, 60 %')).toBe('alle 24 h, 15 min, 90 Tage, 1.000 MiB, 60 %');
  });
  it('bindet englische Einheiten an die Zahl', () => {
    expect(nbsp('every 24 h, 30 days, 12 months, 600 requests, 1 day')).toBe('every 24 h, 30 days, 12 months, 600 requests, 1 day');
    expect(nbsp('5 dayshift, 2 servers')).toBe('5 dayshift, 2 servers');
  });
  it('lässt Zahlen vor anderen Wörtern in Ruhe', () => {
    expect(nbsp('Rang 92 und Port 443 sowie 2 Server, 5 Sekunden')).toBe('Rang 92 und Port 443 sowie 2 Server, 5 Sekunden');
  });
});

describe('highlightShell', () => {
  it('färbt Kommentar und Zeichenketten, maskiert HTML', () => {
    expect(highlightShell('# a <b>\ncurl "x&y" \\\n  -H "k"')).toBe(
      '<span class="c"># a &lt;b&gt;</span>\ncurl <span class="k">"x&amp;y"</span> \\\n  -H <span class="k">"k"</span>',
    );
  });
});

describe('hyphenate', () => {
  it('setzt weiche Trennstriche in lange Wörter, der sichtbare Text bleibt gleich', () => {
    const out = hyphenate('Was Ihre Informationssicherheit wissen will.');
    expect(out).toContain('Informations\u00ADsicherheit');
    expect(out.replaceAll('\u00AD', '')).toBe('Was Ihre Informationssicherheit wissen will.');
    expect(hyphenate('Barrierefreiheit dieser Website')).toBe('Barriere\u00ADfrei\u00ADheit dieser Website');
  });
  it('lässt andere Wörter unberührt', () => {
    expect(hyphenate('Live-Demo')).toBe('Live-Demo');
  });
});
