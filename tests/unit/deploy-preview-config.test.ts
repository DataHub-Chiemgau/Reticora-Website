/**
 * scripts/deploy/preview-config.mjs: Konfiguration der Vorschau aus Umgebungsvariablen. Werte mit Sonderzeichen müssen als
 * PHP-Zeichenketten unverändert ankommen; bei fehlenden Werten Exit 1, ohne einen Wert auszugeben.
 */
import { afterAll, describe, expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = join(process.cwd(), 'scripts/deploy/preview-config.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'reticora-pcfg-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
const hasPhp = spawnSync('php', ['-v']).status === 0;

const base: Record<string, string> = {
  PREVIEW_DB_DSN: 'mysql:host=db.example.test;dbname=vorschau;charset=utf8mb4',
  PREVIEW_DB_USER: 'vorschau_user',
  PREVIEW_DB_PASSWORD: 'dbpass',
  PREVIEW_SMTP_HOST: 'smtp.example.test',
  PREVIEW_SMTP_PORT: '587',
  PREVIEW_SMTP_USER: 'versand@example.test',
  PREVIEW_SMTP_PASSWORD: 'smtppass',
  PREVIEW_MAIL_FROM: 'versand@example.test',
  PREVIEW_MAIL_TO: 'vertrieb@example.test',
  PREVIEW_URL: 'https://vorschau.example.test/',
};
const gen = (over: Record<string, string | undefined> = {}) => {
  const env: Record<string, string> = { PATH: process.env.PATH ?? '' };
  for (const [k, val] of Object.entries({ ...base, ...over })) if (val !== undefined) env[k] = val;
  return spawnSync('node', [script], { env, encoding: 'utf8' });
};
/** Lädt die erzeugte Datei mit PHP und liefert das Array als JSON. */
function load(php: string): Record<string, any> {
  const f = join(tmp, `c-${Math.random().toString(36).slice(2)}.php`);
  writeFileSync(f, php);
  const lint = spawnSync('php', ['-l', f], { encoding: 'utf8' });
  expect(lint.status, lint.stdout + lint.stderr).toBe(0);
  const r = spawnSync('php', ['-r', 'echo json_encode(require $argv[1], JSON_UNESCAPED_UNICODE);', f], { encoding: 'utf8' });
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(r.stdout);
}

describe.skipIf(!hasPhp)('preview-config.mjs', () => {
  test('gültige Eingabe: php -l ok, feste Werte und Zuordnung stimmen', () => {
    const r = gen();
    expect(r.status, r.stderr).toBe(0);
    const c = load(r.stdout);
    expect(c.site_url).toBe('https://vorschau.example.test');
    expect(c.contact_email).toBe('vertrieb@example.test');
    expect(c.retention_days).toBe(30);
    expect(c.db).toEqual({ dsn: base.PREVIEW_DB_DSN, user: 'vorschau_user', pass: 'dbpass' });
    expect(c.mail).toMatchObject({
      transport: 'smtp', host: 'smtp.example.test', port: 587, encryption: 'starttls', user: 'versand@example.test', pass: 'smtppass',
      helo_name: 'vorschau.example.test', from_address: 'versand@example.test', to_address: 'vertrieb@example.test', allow_insecure: false,
    });
  });

  test('Port 465 ergibt implizites TLS (ssl)', () => {
    expect(load(gen({ PREVIEW_SMTP_PORT: '465' }).stdout).mail).toMatchObject({ port: 465, encryption: 'ssl' });
  });

  test('Passwörter mit Anführungszeichen, Gegenschrägstrich, $ und Co. kommen unverändert an', () => {
    const nasty = [
      "pa'ss\"wort\\ende",
      '$HOME${x}`id`$(id)',
      "'; system('id'); //",
      '\\\\\\\'\\',
      '?>' + "<?php echo 1; ?>",
      'Ä ö ü ß € 日本語 \u{1F512}',
      'mit Leerzeichen am Rand  ',
      '\nzeile2\ttab\r\n',
      '#=%&;|<>!{}[]~^*()',
      "\\'",
      '$',
    ];
    for (const pw of nasty) {
      const r = gen({ PREVIEW_DB_PASSWORD: pw, PREVIEW_SMTP_PASSWORD: pw + 'x', PREVIEW_DB_USER: pw, PREVIEW_DB_DSN: 'mysql:host=h;dbname=d;x=' + pw });
      expect(r.status, JSON.stringify(pw) + r.stderr).toBe(0);
      const c = load(r.stdout);
      expect(c.db.pass, JSON.stringify(pw)).toBe(pw);
      expect(c.db.user).toBe(pw);
      expect(c.db.dsn).toBe('mysql:host=h;dbname=d;x=' + pw);
      expect(c.mail.pass).toBe(pw + 'x');
    }
  });

  test('jede fehlende oder leere Variable: Exit 1, nennt den Namen, gibt keinen Wert aus', () => {
    for (const name of Object.keys(base)) {
      for (const val of [undefined, '', '   ']) {
        const r = gen({ [name]: val });
        expect(r.status, `${name}=${JSON.stringify(val)}`).toBe(1);
        expect(r.stdout).toBe('');
        expect(r.stderr).toContain(name);
        for (const secret of ['dbpass', 'smtppass', 'vorschau_user', 'versand@example.test', 'mysql:host']) expect(r.stderr).not.toContain(secret);
      }
    }
  });

  test('ungültiger Port oder ungültige Adresse: Exit 1 ohne Ausgabe der Werte', () => {
    for (const over of [{ PREVIEW_SMTP_PORT: '25' }, { PREVIEW_SMTP_PORT: 'abc' }, { PREVIEW_SMTP_PORT: '587.5' }, { PREVIEW_URL: 'vorschau.example.test' }, { PREVIEW_URL: 'http://vorschau.example.test' }]) {
      const r = gen(over);
      expect(r.status, JSON.stringify(over)).toBe(1);
      expect(r.stdout).toBe('');
      expect(r.stderr).not.toContain('dbpass');
    }
  });

  // Braucht das installierte Backend (`composer install` in backend/); die CI installiert es vor den Unit-Tests.
  test.skipIf(!existsSync('backend/vendor/autoload.php'))('die Ausgabe nimmt das Backend an (Config::fromArray), und die Platzhalter-Sperre greift nicht', () => {
    const f = join(tmp, 'backend-check.php');
    writeFileSync(f, gen().stdout);
    const code = `require 'backend/vendor/autoload.php'; $c = Reticora\\Lead\\Config::load($argv[1]); echo $c->retentionDays();`;
    const r = spawnSync('php', ['-r', code, f], { encoding: 'utf8', cwd: process.cwd() });
    expect(r.stderr).toBe('');
    expect(r.stdout).toBe('30');
  });
});
