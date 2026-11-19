/**
 * scripts/deploy/remote.sh gegen ein nachgestelltes Hosting-Konto (eigenes HOME im Temp-Ordner), und die Workflow-Regeln
 * der Sicherheitsprüfung: S-02 (nur main), S-03 (nie in das laufende Release laden), S-09 (bcrypt), S-10 (Actions per SHA,
 * kein Token im Checkout, Dependabot), S-13 (nur Release-Builds).
 */
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

const repo = process.cwd();
const script = join(repo, 'scripts/deploy/remote.sh');
const tmp = mkdtempSync(join(tmpdir(), 'reticora-remote-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

/** Release-Ordner wie aus package.mjs: www/, reticora/, remote.sh, MANIFEST.txt mit Prüfsummen. */
function makeRelease(dir: string, sha: string, build: 'release' | 'dev' = 'release', marker = 'v1') {
  rmSync(dir, { recursive: true, force: true });
  for (const [p, c] of [['www/index.html', `<!doctype html><title>${marker}</title>`], ['www/.htaccess', '# Seite\n'], ['www/api/.htaccess', 'Require all granted\n'], ['www/api/lead.php', '<?php // lead'], ['reticora/src/App.php', '<?php'], ['remote.sh', '#!/bin/sh']] as const) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), c);
  }
  const files = walk(dir).map((f) => relative(dir, f)).sort();
  const lines = [`git: ${sha}`, 'built: 2026-11-18T00:00:00.000Z', `build: ${build}`, `files: ${files.length}`, '---',
    ...files.map((f) => `${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}  ${f}`)];
  writeFileSync(join(dir, 'MANIFEST.txt'), lines.join('\n') + '\n');
}

let home = '';
const run = (args: string[], input = '') =>
  spawnSync('bash', [script, ...args], { env: { PATH: process.env.PATH, HOME: home, RETICORA_SWITCH: 'symlink' }, input, encoding: 'utf8' });
const releases = () => join(home, 'releases');
const A = 'aaaaaaaaaaaa', B = 'bbbbbbbbbbbb';

describe('remote.sh gegen ein nachgestelltes HOME', () => {
  beforeEach(() => {
    home = mkdtempSync(join(tmp, 'home-'));
    mkdirSync(join(home, 'reticora-config'), { recursive: true });
    writeFileSync(join(home, 'reticora-config/config.php'), '<?php return [];');
  });

  test('S-13: verify, activate und rollback nehmen nur Release-Builds (build: release in MANIFEST.txt)', () => {
    makeRelease(join(releases(), A), A, 'dev');
    let r = run(['verify', A, 'release']);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('kein Release-Build');
    r = run(['activate', A]);
    expect(r.status).toBe(1);
    expect(existsSync(join(home, 'live'))).toBe(false);
    makeRelease(join(releases(), A), A, 'release');
    r = run(['verify', A]);
    expect(r.status, r.stderr).toBe(0);
    // rollback auf ein Entwicklungs-Release: verweigert
    makeRelease(join(releases(), B), B, 'release');
    expect(run(['activate', A]).status).toBe(0);
    expect(run(['activate', B]).status).toBe(0);
    makeRelease(join(releases(), A), A, 'dev');
    r = run(['rollback']);
    expect(r.status).toBe(1);
    expect(readlinkSync(join(home, 'live'))).toBe(join(releases(), B));
  });

  describe('Vorschau mit Entwicklungs-Build (build: dev)', () => {
    const previewCfg = () => join(home, 'reticora-config/config.preview.php');
    const htpasswd = 'vorschau:$2y$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

    test('dev-Paket: installieren und Vorschau ok, activate und rollback verweigert, Betriebsstand unberührt', () => {
      writeFileSync(previewCfg(), '<?php return [];');
      makeRelease(join(releases(), `.incoming-${A}-5-1`), A, 'dev');
      let r = run(['install', A, `.incoming-${A}-5-1`]);
      expect(r.status, r.stderr).toBe(0);
      expect(run(['verify', A]).status).toBe(0);
      r = run(['preview', A], htpasswd);
      expect(r.status, r.stderr).toBe(0);
      expect(readFileSync(join(home, 'preview/www/index.html'), 'utf8')).toContain('v1');
      // Vorschau-Konfiguration, nie die des Betriebs
      expect(readlinkSync(join(home, 'preview/reticora/config.php'))).toBe(previewCfg());
      // Indexierung und Zugangsschutz
      const ht = readFileSync(join(home, 'preview/www/.htaccess'), 'utf8');
      expect(ht).toContain('Header always set X-Robots-Tag "noindex, nofollow"');
      expect(ht).toContain('Require valid-user');
      // Betrieb: verweigert
      r = run(['activate', A]);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('kein Release-Build');
      expect(existsSync(join(home, 'live'))).toBe(false);
      expect(existsSync(join(releases(), '.current'))).toBe(false);
      // auch wenn ein Release läuft: rollback auf ein später durch dev ersetztes Release geht nicht
      makeRelease(join(releases(), B), B, 'release');
      expect(run(['activate', B]).status).toBe(0);
      expect(run(['activate', A]).status).toBe(1);
      expect(readlinkSync(join(home, 'live'))).toBe(join(releases(), B));
      expect(run(['preview', A, 'release'], htpasswd).status).toBe(1);
    });

    test('dev-Vorschau ohne Vorschau-Konfiguration scheitert, statt die Betriebs-Konfiguration zu nehmen', () => {
      makeRelease(join(releases(), A), A, 'dev');
      const r = run(['preview', A], htpasswd);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('config.preview.php');
      expect(existsSync(join(home, 'preview/reticora/config.php'))).toBe(false);
    });

    test('Release-Build in der Vorschau: Vorschau-Konfiguration, falls vorhanden, sonst die gemeinsame; Betrieb nimmt nur config.php', () => {
      makeRelease(join(releases(), A), A, 'release');
      expect(run(['preview', A, 'release'], htpasswd).status).toBe(0);
      expect(readlinkSync(join(home, 'preview/reticora/config.php'))).toBe(join(home, 'reticora-config/config.php'));
      writeFileSync(previewCfg(), '<?php return [];');
      expect(run(['preview', A, 'release'], htpasswd).status).toBe(0);
      expect(readlinkSync(join(home, 'preview/reticora/config.php'))).toBe(previewCfg());
      expect(run(['activate', A]).status).toBe(0);
      expect(readlinkSync(join(releases(), A, 'reticora/config.php'))).toBe(join(home, 'reticora-config/config.php'));
    });

    test('exists mit `release` ignoriert ein dev-Release; install ersetzt es durch den Release-Build gleicher Kennung', () => {
      makeRelease(join(releases(), A), A, 'dev', 'dev-stand');
      expect(run(['exists', A]).stdout.trim()).toBe('vorhanden');
      expect(run(['exists', A, 'release']).stdout.trim()).toBe('fehlt');
      makeRelease(join(releases(), `.incoming-${A}-6-1`), A, 'release', 'rel-stand');
      const r = run(['install', A, `.incoming-${A}-6-1`, 'release']);
      expect(r.status, r.stderr).toBe(0);
      expect(r.stdout).toContain('ersetzt');
      expect(readFileSync(join(releases(), A, 'www/index.html'), 'utf8')).toContain('rel-stand');
      expect(run(['exists', A, 'release']).stdout.trim()).toBe('vorhanden');
      expect(run(['verify', A, 'release']).status).toBe(0);
      // ein Release-Build wird von einem dev-Upload nie überschrieben
      makeRelease(join(releases(), `.incoming-${A}-7-1`), A, 'dev', 'dev-stand');
      expect(run(['install', A, `.incoming-${A}-7-1`]).stdout).toContain('verworfen');
      expect(readFileSync(join(releases(), A, 'www/index.html'), 'utf8')).toContain('rel-stand');
    });

    test('unbekanntes Schlusswort wird abgelehnt', () => {
      expect(run(['exists', A, 'dev']).status).toBe(1);
    });
  });

  test('verify prüft, dass MANIFEST.txt zum Release-Ordner gehört', () => {
    makeRelease(join(releases(), A), B, 'release');
    const r = run(['verify', A]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('gehört nicht');
  });

  test('S-03: install legt einen hochgeladenen Ordner atomar als Release an; derselbe Stand ein zweites Mal ändert das laufende Release nicht', () => {
    expect(run(['exists', A]).stdout.trim()).toBe('fehlt');
    makeRelease(join(releases(), `.incoming-${A}-1-1`), A);
    let r = run(['install', A, `.incoming-${A}-1-1`]);
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(join(releases(), `.incoming-${A}-1-1`))).toBe(false);
    expect(existsSync(join(releases(), A, 'MANIFEST.txt'))).toBe(true);
    expect(run(['exists', A]).stdout.trim()).toBe('vorhanden');
    expect(run(['activate', A]).status).toBe(0);
    const cfgLink = join(releases(), A, 'reticora/config.php');
    expect(lstatSync(cfgLink).isSymbolicLink()).toBe(true);

    // Zweiter Lauf desselben Stands (früher: rsync --delete in das laufende Release löschte den Symlink auf config.php)
    makeRelease(join(releases(), `.incoming-${A}-2-1`), A, 'release', 'v2');
    r = run(['install', A, `.incoming-${A}-2-1`]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('schon vorhanden');
    expect(lstatSync(cfgLink).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(home, 'live/www/index.html'), 'utf8')).toContain('v1');
    expect(existsSync(join(releases(), `.incoming-${A}-2-1`))).toBe(false);
  });

  test('install verweigert mit `release` Entwicklungs-Builds, immer fremde Ordnernamen und kaputte Prüfsummen', () => {
    makeRelease(join(releases(), `.incoming-${A}-3-1`), A, 'dev');
    expect(run(['install', A, `.incoming-${A}-3-1`, 'release']).status).toBe(1);
    expect(existsSync(join(releases(), A))).toBe(false);
    for (const bad of ['../x', A, `.incoming-${B}-3-1`, '.incoming-zz-1-1', '']) expect(run(['install', A, bad]).status, bad).toBe(1);
    makeRelease(join(releases(), `.incoming-${A}-4-1`), A);
    writeFileSync(join(releases(), `.incoming-${A}-4-1`, 'www/index.html'), 'verändert');
    const r = run(['install', A, `.incoming-${A}-4-1`]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Prüfsummen');
    expect(existsSync(join(releases(), A))).toBe(false);
  });

  test('prune räumt liegengebliebene Upload-Ordner auf', () => {
    makeRelease(join(releases(), A), A);
    expect(run(['activate', A]).status).toBe(0);
    makeRelease(join(releases(), `.incoming-${B}-9-1`), B);
    const r = run(['prune', '2']);
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(join(releases(), `.incoming-${B}-9-1`))).toBe(false);
    expect(existsSync(join(releases(), A))).toBe(true);
  });
});

describe('Workflows', () => {
  const wf = (name: string) => readFileSync(join(repo, '.github/workflows', name), 'utf8');
  const all = readdirSync(join(repo, '.github/workflows')).filter((f) => f.endsWith('.yml'));
  /** Rumpf eines Jobs (bis zum nächsten Job auf derselben Einrückung). */
  const job = (text: string, name: string) => {
    const m = new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z][\\w-]*:\\n|(?![\\s\\S]))`, 'm').exec(text);
    return m ? m[1] : '';
  };

  test('S-02: preview, production und rollback laufen nur vom Hauptzweig', () => {
    const d = wf('deploy.yml');
    for (const j of ['preview', 'production', 'rollback']) {
      const body = job(d, j);
      expect(body, j).not.toBe('');
      expect(/^    if: .*github\.ref == 'refs\/heads\/main'/m.test(body), `${j}: if mit refs/heads/main`).toBe(true);
    }
  });

  test('S-03: kein Upload in das Release-Verzeichnis selbst; Upload in einen neuen Ordner, dann install; config.php ausgenommen', () => {
    const d = job(wf('deploy.yml'), 'preview');
    expect(d).not.toMatch(/rsync[^\n]*"hetzner:releases\/\$\{rel\}\/"/);
    expect(d).toMatch(/rsync[^\n]*--exclude=\/reticora\/config\.php/);
    expect(d).toMatch(/\.incoming-/);
    expect(d).toMatch(/remote\.sh install|-- install /);
    expect(d).toMatch(/-- exists /);
  });

  test('Vorschau ohne Release-Sperre, Betrieb nur mit Release-Build', () => {
    const d = wf('deploy.yml');
    const build = job(d, 'build');
    expect(build).toMatch(/inputs\.target == 'preview'[\s\S]*npm run build\n/);
    expect(build).toMatch(/--allow-dev/);
    expect(build).toMatch(/inputs\.target == 'production'[\s\S]*npm run build:release/);
    // --allow-dev nur im Zweig für die Vorschau
    const allowDevLines = build.split('\n').filter((l) => /^\s+run: .*--allow-dev/.test(l));
    expect(allowDevLines.length).toBe(1);
    const prod = job(d, 'production');
    expect(prod).toMatch(/build: release/);
    expect(prod).not.toMatch(/--allow-dev/);
    expect(prod).toMatch(/remote\.sh activate/);
    expect(job(d, 'rollback')).not.toMatch(/config\.preview/);
    // Betriebslauf verlangt überall `release` auf dem Host
    expect(job(d, 'preview')).toMatch(/REQ=/);
  });

  test('Vorschau-Konfiguration: Secrets nur als env, per STDIN auf den Host, Modus 600, Betrieb liest sie nie', () => {
    const d = wf('deploy.yml');
    const pv = job(d, 'preview');
    expect(pv).toMatch(/preview-config\.mjs/);
    expect(pv).toMatch(/umask 077/);
    expect(pv).toMatch(/chmod 600/);
    expect(pv).toMatch(/bin\/migrate\.php reticora-config\/config\.preview\.php/);
    // kein Secret in einer Befehlszeile: `secrets.` kommt nur in env-Zuweisungen vor
    for (const l of d.split('\n').filter((x) => x.includes('secrets.') && !x.trim().startsWith('#'))) expect(l, l).toMatch(/^\s+[A-Z_]+: \$\{\{ secrets\.[A-Z_]+ \}\}$/);
    expect(pv.indexOf('preview-config.mjs')).toBeLessThan(pv.indexOf('Rauchtest der Vorschau'));
    expect(pv.indexOf('preview-config.mjs')).toBeLessThan(pv.indexOf('remote.sh preview'));
    for (const j of ['production', 'rollback']) expect(job(d, j), j).not.toMatch(/config\.preview|PREVIEW_DB/);
    const remote = readFileSync(join(repo, 'scripts/deploy/remote.sh'), 'utf8');
    expect(remote).toMatch(/CONFIG_FILE="\$\{RETICORA_CONFIG_FILE:-\$HOME\/reticora-config\/config\.php\}"/);
    expect(remote.slice(remote.indexOf('switch_live()'), remote.indexOf('cmd_exists()'))).not.toMatch(/PREVIEW_CONFIG_FILE/);
  });

  test('S-09: Vorschau-Passwort als bcrypt, nicht APR1-MD5', () => {
    const d = wf('deploy.yml');
    expect(d).not.toMatch(/passwd -apr1/);
    expect(d).toMatch(/htpasswd -n[a-zA-Z]*B/);
  });

  test('S-10: jede Action per Commit-SHA mit Versionskommentar; checkout ohne gespeichertes Token', () => {
    for (const f of all) {
      const text = wf(f);
      for (const m of text.matchAll(/^\s*-?\s*uses:\s*(\S+)(.*)$/gm)) {
        expect(m[1], `${f}: ${m[0].trim()}`).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
        expect(m[2], `${f}: ${m[0].trim()} ohne Versionskommentar`).toMatch(/^\s+# v\d/);
      }
      const checkouts = [...text.matchAll(/uses: actions\/checkout@[0-9a-f]{40}[^\n]*\n((?:\s+(?!- )[^\n]*\n)*)/g)];
      for (const c of checkouts) expect(c[1], `${f}: checkout`).toMatch(/persist-credentials: false/);
    }
    const dep = readFileSync(join(repo, '.github/dependabot.yml'), 'utf8');
    for (const eco of ['npm', 'composer', 'github-actions']) expect(dep).toMatch(new RegExp(`package-ecosystem: "?${eco}"?`));
    expect(dep).toMatch(/directory: "?\/backend"?/);
    expect((dep.match(/interval: "?weekly"?/g) ?? []).length).toBe(3);
  });
});
