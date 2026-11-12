import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ui } from '../../src/i18n';
import { SITE } from '../../src/data/site';
import { formTexts, markerProblems, markers } from '../../scripts/lib/lead-templates.mjs';
import { contactUri, securityTxt } from '../../scripts/lib/security-txt.mjs';
import { checkSecurityContact } from '../../scripts/lib/release-checks.mjs';

describe('Vorlage der Kontaktseite (Ä-08)', () => {
  test('Fehlertexte für PHP stammen aus ui(lang).form, je Code ein Text', () => {
    for (const lang of ['de', 'en'] as const) {
      const F = ui(lang).form;
      const t = formTexts(F);
      expect(t.titlePrefix).toBe(F.titlePrefix);
      expect(t.titlePrefix.length).toBeGreaterThan(3);
      expect(t.summaryOne).toBe(F.summaryOne);
      expect(t.summaryMany).toBe(F.summaryMany);
      expect(t.generic).toBe(F.generic);
      expect(t.errors['name.required']).toBe(F.errors.name.required);
      expect(t.errors['topic.required']).toBe(F.errors.topic.required);
      expect(t.errors['message.invalid']).toBe(F.errors.message.invalid);
    }
  });

  test('jeder Fehlercode des Backends hat einen Text in beiden Sprachen (außer lang.invalid, das die allgemeine Zeile nutzt)', () => {
    const php = readFileSync(join(process.cwd(), 'backend/src/Validator.php'), 'utf8');
    const list = /ERROR_CODES = \[([\s\S]*?)\];/.exec(php)![1];
    const codes = [...list.matchAll(/'([a-z_.]+)'/g)].map((m) => m[1]).filter((c) => c !== 'lang.invalid');
    expect(codes.length).toBeGreaterThan(10);
    for (const lang of ['de', 'en'] as const) {
      const t = formTexts(ui(lang).form);
      for (const c of codes) expect(t.errors[c], `${lang} ${c}`).toBeTruthy();
    }
  });

  test('alle Marken enthalten ein Anführungszeichen (maskierte Eingaben können keine Marke bilden)', () => {
    for (const m of markers()) expect(m).toContain('"');
  });

  test('fehlende oder doppelte Marken werden gemeldet', () => {
    const ok = `<form data-lead>${markers().join('')}</form>`;
    expect(markerProblems(ok)).toEqual([]);
    expect(markerProblems(ok.replace(' data-rt-field="email">', ''))).toHaveLength(1);
    expect(markerProblems(ok + ' data-rt="summary" hidden>')).toHaveLength(1);
    expect(markerProblems(markers().join(''))).toEqual(['Formular mit data-lead fehlt']);
  });

  test('PHP kennt dieselben Marken', () => {
    const php = readFileSync(join(process.cwd(), 'backend/src/ContactPage.php'), 'utf8');
    for (const m of [' data-rt-field="%s">', ' data-rt-field="message"></textarea>', ' data-rt-option="%s">', ' data-rt-error="%s" hidden></p>', ' data-rt="title">', ' data-rt="summary" hidden>', ' data-rt="summary-title"></p>', ' data-rt="summary-items"></ul>'])
      expect(php).toContain(`'${m}'`);
  });

  const built = join(process.cwd(), 'backend/templates/contact.de.html');
  test.skipIf(!existsSync(built))('die gebaute deutsche Vorlage hat jede Marke genau einmal', () => {
    expect(markerProblems(readFileSync(built, 'utf8'))).toEqual([]);
    const texts = JSON.parse(readFileSync(join(process.cwd(), 'backend/templates/form-texts.json'), 'utf8'));
    expect(texts.de).toEqual(formTexts(ui('de').form));
    expect(texts.en).toEqual(formTexts(ui('en').form));
  });
});

describe('security.txt (Ä-13)', () => {
  test('Felder nach RFC 9116, Ablauf nach 180 Tagen', () => {
    const txt = securityTxt('security@example.com', new Date('2026-11-12T10:20:30.456Z'), 'https://www.reticora.de');
    expect(txt).toBe(
      'Contact: mailto:security@example.com\nExpires: 2027-05-11T10:20:30Z\nPreferred-Languages: de, en\nCanonical: https://www.reticora.de/.well-known/security.txt\n',
    );
  });

  test('Contact: mailto und https bleiben, Unsinn bricht ab', () => {
    expect(contactUri('mailto:a@example.com')).toBe('mailto:a@example.com');
    expect(contactUri('https://example.com/security')).toBe('https://example.com/security');
    expect(() => contactUri('kein kontakt')).toThrow();
    expect(() => contactUri('a@example.com\nExpires: 2099-01-01T00:00:00Z')).toThrow();
    expect(() => contactUri('http://example.com')).toThrow();
  });

  test('Release-Prüfung meldet die fehlende Meldeadresse', () => {
    expect(checkSecurityContact({ securityContact: null })).toEqual(['Anbieter: Meldeadresse für Sicherheitslücken fehlt']);
    expect(checkSecurityContact({ securityContact: '  ' })).toEqual(['Anbieter: Meldeadresse für Sicherheitslücken fehlt']);
    expect(checkSecurityContact({ securityContact: 'kein kontakt' })).toEqual(['Anbieter: Meldeadresse für Sicherheitslücken ist ungültig']);
    expect(checkSecurityContact({ securityContact: 'security@example.com' })).toEqual([]);
  });

  test('SITE.securityContact ist nicht erfunden: null, solange der Anbieter keine Adresse nennt', () => {
    expect(SITE.securityContact).toBeNull();
  });

  const dist = join(process.cwd(), 'dist');
  test.skipIf(!existsSync(dist))('ohne Meldeadresse entsteht keine Datei im Build', () => {
    expect(existsSync(join(dist, '.well-known/security.txt'))).toBe(SITE.securityContact !== null);
  });
});
