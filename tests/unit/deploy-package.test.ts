import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync, spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import releaseMarker from '../../src/integrations/release-marker';
import { writeReleaseMarker } from '../../scripts/lib/release-marker.mjs';

// Das Release-Paket aus einem normalen Build (--allow-dev). Der Build selbst läuft hier nicht; ohne dist/ werden die Tests übersprungen.
const repo = process.cwd();
const dist = join(repo, 'dist');
const hasDist = existsSync(join(dist, 'index.html')) && existsSync(join(repo, 'backend/templates/contact.de.html'));
const hasComposer = spawnSync('composer', ['--version']).status === 0;
const hasPhp = spawnSync('php', ['--version']).status === 0;
if (!hasDist) console.warn('dist/ oder backend/templates fehlt: bitte zuerst "npm run build" ausführen; Paket-Tests werden übersprungen.');

const pkgScript = join(repo, 'scripts/deploy/package.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'reticora-pkg-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const run = (args: string[]) => spawnSync('node', [pkgScript, ...args], { cwd: repo, encoding: 'utf8' });

describe.skipIf(!hasDist || !hasComposer)('Release-Paket', () => {
  const out = join(tmp, 'out');
  let root = '';
  let files: string[] = [];
  beforeAll(() => {
    const r = run(['--allow-dev', '--out', out, '--sha', 'abcdef1234567890']);
    expect(r.status, r.stderr).toBe(0);
    root = join(out, 'reticora-abcdef123456');
    files = walk(root).map((p) => relative(root, p).split(sep).join('/'));
  }, 180_000);

  test('fester Aufbau: www/, reticora/, remote.sh, MANIFEST.txt und ein Tarball', () => {
    expect(readdirSync(root).sort()).toEqual(['MANIFEST.txt', 'remote.sh', 'reticora', 'www']);
    for (const d of ['src', 'bin', 'sql', 'templates', 'vendor']) expect(statSync(join(root, 'reticora', d)).isDirectory(), d).toBe(true);
    expect(existsSync(join(root, 'www/index.html'))).toBe(true);
    expect(existsSync(join(root, 'www/.htaccess'))).toBe(true);
    expect(existsSync(join(out, 'reticora-abcdef123456.tar.gz'))).toBe(true);
    const listing = execFileSync('tar', ['-tzf', join(out, 'reticora-abcdef123456.tar.gz')], { encoding: 'utf8' });
    expect(listing).toContain('reticora-abcdef123456/www/api/lead.php');
    expect(listing).toContain('reticora-abcdef123456/MANIFEST.txt');
  });

  test('www/ enthält als PHP nur api/lead.php, mit unverändertem Inhalt aus backend/public', () => {
    const php = files.filter((f) => f.startsWith('www/') && /\.(php\d?|phtml|phar)$/i.test(f));
    expect(php).toEqual(['www/api/lead.php']);
    expect(readFileSync(join(root, 'www/api/lead.php'), 'utf8')).toBe(readFileSync(join(repo, 'backend/public/lead.php'), 'utf8'));
    expect(readFileSync(join(root, 'www/api/.htaccess'), 'utf8')).toBe(readFileSync(join(repo, 'backend/public/.htaccess'), 'utf8'));
  });

  test('ausgeschlossen: Tests, PHPUnit, Source-Maps, config.php, Beispiele (außer reticora/config.example.php), .superpowers, Entwicklungsabhängigkeiten', () => {
    expect(files.filter((f) => f.endsWith('.map'))).toEqual([]);
    expect(files.filter((f) => f.split('/').pop() === 'config.php')).toEqual([]);
    expect(files.filter((f) => /example/i.test(f))).toEqual(['reticora/config.example.php']);
    expect(files.filter((f) => /phpunit/i.test(f))).toEqual([]);
    expect(files.filter((f) => f.split('/').some((p) => p === 'tests' || p === 'Tests' || p === '.superpowers' || p === 'node_modules'))).toEqual([]);
    expect(existsSync(join(root, 'reticora/vendor/phpunit'))).toBe(false);
    expect(existsSync(join(root, 'reticora/vendor/phpmailer/phpmailer'))).toBe(true);
    expect(files).toContain('reticora/templates/contact.de.html');
    expect(files).toContain('reticora/templates/form-texts.json');
  });

  test('reticora/ und jeder Unterordner haben eine .htaccess, die alles verbietet', () => {
    const dirs = ['reticora', ...readdirSync(join(root, 'reticora'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `reticora/${e.name}`)];
    expect(dirs.length).toBeGreaterThanOrEqual(6);
    for (const d of dirs) {
      const f = join(root, d, '.htaccess');
      expect(existsSync(f), d).toBe(true);
      const t = readFileSync(f, 'utf8');
      expect(t, d).toMatch(/Require all denied/);
      expect(t, d).toMatch(/Deny from all/);
      expect(t, d).not.toMatch(/granted|Allow from/i);
    }
  });

  test('MANIFEST.txt: Git-Stand, Zeit, jede Datei außer sich selbst mit passender SHA-256', () => {
    const lines = readFileSync(join(root, 'MANIFEST.txt'), 'utf8').trimEnd().split('\n');
    expect(lines[0]).toMatch(/^git: abcdef1234567890/);
    expect(lines[1]).toMatch(/^built: \d{4}-\d{2}-\d{2}T/);
    expect(lines[2]).toBe('build: dev');
    const sep = lines.indexOf('---');
    expect(sep).toBeGreaterThan(2);
    const entries = lines.slice(sep + 1).map((l) => /^([0-9a-f]{64}) {2}(.+)$/.exec(l)!);
    expect(entries.every(Boolean)).toBe(true);
    const listed = entries.map((m) => m[2]).sort();
    expect(listed).toEqual(files.filter((f) => f !== 'MANIFEST.txt').sort());
    for (const [, hash, path] of entries) {
      expect(createHash('sha256').update(readFileSync(join(root, path))).digest('hex'), path).toBe(hash);
    }
    expect(lines[3]).toBe(`files: ${entries.length}`);
  });

  test('S-12: vendor/ enthält nur Laufzeitdateien: kein .git, keine Punktdateien, keine Entwicklerdateien, keine leeren Ordner', () => {
    const dirs = (d: string): string[] => readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => [join(d, e.name), ...dirs(join(d, e.name))]);
    const allDirs = dirs(root).map((p) => relative(root, p).split(sep).join('/'));
    expect(allDirs.filter((d) => d.split('/').some((p) => p.startsWith('.')))).toEqual([]);
    expect(allDirs.filter((d) => readdirSync(join(root, d)).length === 0)).toEqual([]);
    expect(files.filter((f) => f.startsWith('reticora/vendor/') && f.split('/').some((p) => p.startsWith('.') && p !== '.htaccess'))).toEqual([]);
    expect(files.filter((f) => f.startsWith('reticora/vendor/') && f.split('/').slice(2, -1).length > 0 && f.endsWith('/.htaccess'))).toEqual([]);
    const mailer = files.filter((f) => f.startsWith('reticora/vendor/phpmailer/phpmailer/')).map((f) => f.slice('reticora/vendor/phpmailer/phpmailer/'.length));
    expect(mailer.filter((f) => !/^(src\/|language\/|LICENSE$|COMMITMENT$|VERSION$|composer\.json$)/.test(f))).toEqual([]);
    expect(mailer).toContain('src/PHPMailer.php');
    expect(mailer).toContain('LICENSE');
    const src = readFileSync(join(repo, 'scripts/deploy/package.mjs'), 'utf8');
    expect(src).toMatch(/'--prefer-dist'/);
    expect(src).toMatch(/'--no-plugins'/);
  });

  test('Release-Marke und Quellen gelangen nicht ins Paket', () => {
    expect(files.filter((f) => f.endsWith('.release'))).toEqual([]);
    expect(files.filter((f) => f.startsWith('www/') && /(^|\/)(src|backend|\.git|\.superpowers)\//.test(f))).toEqual([]);
  });

  test.skipIf(!hasPhp)('lead.php findet vendor/ aus www/api/ ohne Änderung (../../reticora) und antwortet auf GET mit 405', async () => {
    const cfg = join(tmp, 'config.test.php');
    writeFileSync(cfg, `<?php return ['site_url'=>'https://www.example.test','contact_email'=>'k@example.test','retention_days'=>90,'db'=>['dsn'=>'sqlite::memory:'],'mail'=>['transport'=>'smtp']];`);
    const port = 18000 + Math.floor(Math.random() * 2000);
    const srv: ChildProcess = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', join(root, 'www')], { env: { ...process.env, RETICORA_CONFIG: cfg }, stdio: 'ignore' });
    try {
      let res: Response | undefined;
      for (let i = 0; i < 50 && !res; i++) {
        try { res = await fetch(`http://127.0.0.1:${port}/api/lead.php`); } catch { await new Promise((r) => setTimeout(r, 100)); }
      }
      expect(res?.status).toBe(405);
      expect(res?.headers.get('allow')).toBe('POST');
    } finally {
      srv.kill();
    }
  });
});

describe('Freigabesperre', () => {
  const fakeDist = (marker: boolean) => {
    const d = mkdtempSync(join(tmp, 'dist-'));
    writeFileSync(join(d, 'index.html'), '<!doctype html><title>x</title>');
    writeFileSync(join(d, '.htaccess'), '# test\n');
    if (marker) writeFileSync(join(d, '.release'), 'RETICORA_RELEASE=1\n');
    return d;
  };

  test('ein Entwicklungs-Build (ohne dist/.release) wird ohne --allow-dev verweigert und schreibt nichts', () => {
    const out = join(tmp, 'refused');
    const r = run(['--dist', fakeDist(false), '--out', out]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('build:release');
    expect(existsSync(out)).toBe(false);
  });

  test('die echte dist/ aus "npm run build" trägt keine Marke und wird verweigert', () => {
    if (!hasDist) return;
    expect(existsSync(join(dist, '.release'))).toBe(false);
    const r = run(['--out', join(tmp, 'refused2')]);
    expect(r.status).toBe(1);
  });

  test.skipIf(!hasDist || !hasComposer)('mit Marke (Release-Build) wird ohne --allow-dev gepackt; die Marke bleibt außerhalb von www/', () => {
    const out = join(tmp, 'rel');
    const r = run(['--dist', fakeDist(true), '--out', out, '--sha', '1234567890abcdef']);
    expect(r.status, r.stderr).toBe(0);
    const root = join(out, 'reticora-1234567890ab');
    expect(existsSync(join(root, 'www/.release'))).toBe(false);
    expect(readFileSync(join(root, 'MANIFEST.txt'), 'utf8')).toMatch(/^build: release$/m);
  }, 180_000);

  test('PHP in dist/ lässt das Paket scheitern', () => {
    const d = fakeDist(true);
    writeFileSync(join(d, 'evil.php'), '<?php');
    const r = run(['--dist', d, '--out', join(tmp, 'php')]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('evil.php');
  });

  test('Marke: nur mit RETICORA_RELEASE=1 geschrieben, vom Build immer gelöscht; check-release schreibt sie erst nach bestandener Prüfung', () => {
    const d = mkdtempSync(join(tmp, 'hook-'));
    expect(writeReleaseMarker(d, {})).toBe(false);
    expect(existsSync(join(d, '.release'))).toBe(false);
    expect(writeReleaseMarker(d, { RETICORA_RELEASE: '1' })).toBe(true);
    expect(readFileSync(join(d, '.release'), 'utf8')).toBe('RETICORA_RELEASE=1\n');
    const hook = releaseMarker().hooks['astro:build:done'] as unknown as (a: { dir: URL }) => void;
    hook({ dir: pathToFileURL(d + '/') });
    expect(existsSync(join(d, '.release'))).toBe(false);
    const src = readFileSync(join(repo, 'scripts/check-release.mjs'), 'utf8');
    const exit = src.indexOf('process.exit(1)');
    const write = src.indexOf('writeReleaseMarker(dist)');
    expect(exit).toBeGreaterThan(0);
    expect(write).toBeGreaterThan(exit); // die Marke steht hinter dem Abbruch bei Mängeln
  });

  test('dist/.release ist nicht abrufbar: public/.htaccess sperrt Dateien mit führendem Punkt, .well-known bleibt frei', () => {
    const ht = readFileSync(join(repo, 'public/.htaccess'), 'utf8');
    const rule = /^RewriteRule (\(\^\|\/\)\\\.\(\?!well-known\(\/\|\$\)\)) - \[F,L\]$/m.exec(ht);
    expect(rule, 'Sperrregel für Punktdateien fehlt in public/.htaccess').not.toBeNull();
    const re = new RegExp(rule![1]);
    for (const blocked of ['.release', '.env', 'a/.git/config', 'api/.htaccess']) expect(re.test(blocked), blocked).toBe(true);
    for (const open of ['.well-known/security.txt', 'index.html', 'a/b.release']) expect(re.test(open), open).toBe(false);
    // Die Marke liegt zusätzlich nie in www/ (siehe oben); die Regel ist die zweite Sicherung.
  });
});

describe('remote.sh', () => {
  const script = join(repo, 'scripts/deploy/remote.sh');
  const text = readFileSync(script, 'utf8');
  test('strikt, ohne Berührung von config.php, Datenbank oder StrictHostKeyChecking no', () => {
    expect(text).toMatch(/^set -euo pipefail$/m);
    expect(text).not.toMatch(/mysql|mariadb|DROP |rm -rf \/|StrictHostKeyChecking\s+no/i);
    expect(text).not.toMatch(/\brm\b[^\n]*config\.php/);
    const wf = readFileSync(join(repo, '.github/workflows/deploy.yml'), 'utf8');
    expect(wf).not.toMatch(/StrictHostKeyChecking[ =]+no/i);
  });
  test('Bash-Syntax', () => {
    expect(spawnSync('bash', ['-n', script]).status).toBe(0);
    for (const f of ['smoke.sh', 'ssh-setup.sh']) expect(spawnSync('bash', ['-n', join(repo, 'scripts/deploy', f)]).status, f).toBe(0);
  });
});
