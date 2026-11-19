#!/usr/bin/env node
// Baut das Release-Paket aus einem fertigen dist/ und backend/ (Spec §11, Ä-16, docs/deploy.md).
//
// Aufbau:
//   <out>/reticora-<sha>/
//     www/        Inhalt von dist/ plus api/lead.php (+ api/.htaccess) aus backend/public
//     reticora/   backend src/, bin/, sql/, templates/, vendor/ (composer --no-dev), config.example.php, je Ordner .htaccess (alles verboten)
//     remote.sh   Befehle auf dem Host (scripts/deploy/remote.sh)
//     MANIFEST.txt
//   <out>/reticora-<sha>.tar.gz
//
// lead.php braucht keine Änderung: Es sucht vendor/ unter ../../reticora (neben www/) oder in RETICORA_HOME.
// Das Paket ohne Release-Build (dist/.release fehlt) wird verweigert; --allow-dev gilt nur für Tests.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

export const DENY_ALL = `# Kein Webzugriff auf dieses Verzeichnis.
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Deny from all
</IfModule>
`;

function parseArgs(argv) {
  const o = { allowDev: false, out: join(REPO, 'release'), dist: join(REPO, 'dist'), backend: join(REPO, 'backend'), sha: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--allow-dev') o.allowDev = true;
    else if (['--out', '--dist', '--backend', '--sha'].includes(a)) {
      const v = argv[++i];
      if (!v) fail(`${a} braucht einen Wert`);
      o[a.slice(2)] = a === '--sha' ? v : resolve(v);
    } else fail(`Unbekannte Option ${a}`);
  }
  return o;
}

function fail(msg) {
  console.error(`package: ${msg}`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

/** Dateien, die nie ins Paket gehören (Name oder Pfadteil). `config.example.php` im Ordner reticora/ ist die einzige Ausnahme für *example*. */
export function excluded(rel) {
  const parts = rel.split(sep);
  const name = parts[parts.length - 1];
  if (name.endsWith('.map')) return true;
  if (name === 'config.php') return true;
  if (/^phpunit(\.|$)/i.test(name) || name === '.phpunit.result.cache') return true;
  if (/(^|\.)examples?(\.|$)/i.test(name)) return true;
  if (parts.some((p) => p === '.superpowers' || p === '.git' || p === '.github' || p === 'node_modules')) return true;
  return false;
}

/** Dateien eines Pakets, die zur Laufzeit oder für die Lizenz gebraucht werden; alles andere (Doku, Tests, CI, Git) fällt weg. */
const KEEP_IN_PACKAGE = /^(LICEN[CS]E|COPYING|NOTICE|COMMITMENT|VERSION)(\.[a-z]+)?$|^composer\.json$|^language$/i;

/**
 * Räumt vendor/ auf (S-12): je Paket (vendor/<Anbieter>/<Name>) nur die Autoload-Pfade aus seiner composer.json und die Dateien
 * aus KEEP_IN_PACKAGE; vendor/composer bleibt (Autoloader). Danach keine Punktdateien und keine leeren Ordner.
 */
export function stripVendor(vendor) {
  for (const owner of readdirSync(vendor, { withFileTypes: true })) {
    if (!owner.isDirectory() || owner.name === 'composer' || owner.name === 'bin') continue;
    for (const pkg of readdirSync(join(vendor, owner.name), { withFileTypes: true })) {
      if (!pkg.isDirectory()) continue;
      const dir = join(vendor, owner.name, pkg.name);
      let autoload = {};
      try { autoload = JSON.parse(readFileSync(join(dir, 'composer.json'), 'utf8')).autoload ?? {}; } catch { autoload = {}; }
      const keep = new Set(
        [...Object.values(autoload['psr-4'] ?? {}), ...Object.values(autoload['psr-0'] ?? {}), autoload.classmap ?? [], autoload.files ?? []]
          .flat()
          .map((p) => String(p).replace(/^\.\//, '').split('/')[0])
          .filter(Boolean),
      );
      for (const e of readdirSync(dir)) {
        if (!keep.has(e) && !KEEP_IN_PACKAGE.test(e)) rmSync(join(dir, e), { recursive: true, force: true });
      }
    }
  }
  // Ballast innerhalb der behaltenen Ordner: Beispiele, Tests, Source-Maps, Punktdateien.
  for (const p of walk(vendor)) {
    const rel = relative(vendor, p);
    if (excluded(rel) || /[\\/](tests?|Tests?)[\\/]/.test(rel) || rel.split(sep).some((x) => x.startsWith('.'))) rmSync(p, { force: true });
  }
  const dirs = (d) => readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => [...dirs(join(d, e.name)), join(d, e.name)]);
  for (const d of dirs(vendor)) {
    if (/^(examples?|tests?)$/i.test(basename(d)) || basename(d).startsWith('.')) rmSync(d, { recursive: true, force: true });
  }
  for (const d of dirs(vendor)) {
    if (existsSync(d) && readdirSync(d).length === 0) rmSync(d, { recursive: true, force: true });
  }
}

function copyTree(src, dst, { dropDirs = [] } = {}) {
  cpSync(src, dst, {
    recursive: true,
    dereference: false,
    filter: (s) => {
      const rel = relative(src, s);
      if (rel === '') return true;
      if (dropDirs.some((d) => rel.split(sep).includes(d))) return false;
      return !excluded(rel);
    },
  });
}

function gitInfo(override) {
  const run = (...a) => {
    try { return execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
  };
  const sha = override || process.env.GITHUB_SHA || run('rev-parse', 'HEAD') || 'unknown';
  const dirty = !override && !process.env.GITHUB_SHA && run('status', '--porcelain') !== '';
  return { sha, dirty };
}

/** Prüft das fertige Paket; wirft bei jeder Abweichung vom festen Aufbau. */
export function verifyLayout(root) {
  const problems = [];
  const www = join(root, 'www');
  const app = join(root, 'reticora');
  for (const p of walk(root)) {
    const rel = relative(root, p);
    const name = basename(p);
    if (name.endsWith('.map')) problems.push(`Source-Map im Paket: ${rel}`);
    if (name === 'config.php') problems.push(`config.php im Paket: ${rel}`);
    if (/(^|\.)examples?(\.|$)/i.test(name) && rel !== join('reticora', 'config.example.php')) problems.push(`Beispieldatei im Paket: ${rel}`);
    if (/^phpunit/i.test(name)) problems.push(`PHPUnit-Datei im Paket: ${rel}`);
    if (rel.startsWith('www' + sep) && /\.(php\d?|phtml|phar)$/i.test(name) && rel !== join('www', 'api', 'lead.php')) problems.push(`PHP im Webroot: ${rel}`);
    if (rel.startsWith('www' + sep) && name === '.release') problems.push(`Release-Marke im Webroot: ${rel}`);
  }
  if (!existsSync(join(www, 'api', 'lead.php'))) problems.push('www/api/lead.php fehlt');
  if (!existsSync(join(www, 'index.html'))) problems.push('www/index.html fehlt');
  for (const d of ['src', 'bin', 'sql', 'templates', 'vendor']) {
    if (!existsSync(join(app, d))) problems.push(`reticora/${d} fehlt`);
  }
  for (const d of [app, ...readdirSync(app, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(app, e.name))]) {
    const f = join(d, '.htaccess');
    if (!existsSync(f) || readFileSync(f, 'utf8') !== DENY_ALL) problems.push(`${relative(root, d)}/.htaccess (alles verboten) fehlt`);
  }
  if (existsSync(join(app, 'vendor', 'phpunit'))) problems.push('vendor/phpunit: Entwicklungsabhängigkeiten im Paket');
  const dirsOf = (d) => readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => [join(d, e.name), ...dirsOf(join(d, e.name))]);
  for (const d of dirsOf(root)) {
    const rel = relative(root, d);
    // .well-known (security.txt) im Webroot ist gewollt; sonst kein Punktordner, nirgends .git
    if (basename(d) === '.git' || (basename(d).startsWith('.') && !rel.startsWith('www' + sep))) problems.push(`Ordner mit führendem Punkt im Paket: ${rel}`);
  }
  if (!existsSync(join(app, 'vendor', 'autoload.php'))) problems.push('vendor/autoload.php fehlt');
  if (problems.length) throw new Error(problems.join('\n'));
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function buildPackage(opts) {
  const { dist, backend, out, allowDev } = opts;
  if (!existsSync(join(dist, 'index.html'))) fail(`${dist}/index.html fehlt: zuerst "npm run build:release" ausführen`);
  const marker = join(dist, '.release');
  const isRelease = existsSync(marker) && /^RETICORA_RELEASE=1$/m.test(readFileSync(marker, 'utf8'));
  if (!isRelease && !allowDev) {
    fail('dist/ stammt nicht aus "npm run build:release" (dist/.release fehlt). Kein Paket ohne bestandene Release-Prüfung.');
  }
  for (const f of ['contact.de.html', 'form-texts.json']) {
    if (!existsSync(join(backend, 'templates', f))) fail(`backend/templates/${f} fehlt: Vorlagen entstehen beim Build`);
  }

  const { sha, dirty } = gitInfo(opts.sha);
  const name = `reticora-${sha.slice(0, 12)}`;
  const root = join(out, name);
  rmSync(root, { recursive: true, force: true });
  rmSync(`${root}.tar.gz`, { force: true });
  mkdirSync(root, { recursive: true });

  // www/: dist/ ohne Release-Marke, Source-Maps und PHP, plus die dünne Eintrittsdatei des Backends.
  const www = join(root, 'www');
  copyTree(dist, www);
  rmSync(join(www, '.release'), { force: true });
  const strayPhp = walk(www).filter((p) => /\.(php\d?|phtml|phar)$/i.test(p));
  if (strayPhp.length) fail(`PHP in dist/: ${strayPhp.map((p) => relative(www, p)).join(', ')}`);
  mkdirSync(join(www, 'api'), { recursive: true });
  cpSync(join(backend, 'public', 'lead.php'), join(www, 'api', 'lead.php'));
  if (existsSync(join(backend, 'public', '.htaccess'))) cpSync(join(backend, 'public', '.htaccess'), join(www, 'api', '.htaccess'));

  // reticora/: Code, Vorlagen, Abhängigkeiten.
  const app = join(root, 'reticora');
  mkdirSync(app, { recursive: true });
  for (const d of ['src', 'bin', 'sql']) copyTree(join(backend, d), join(app, d));
  copyTree(join(backend, 'templates'), join(app, 'templates'));
  cpSync(join(backend, 'config.example.php'), join(app, 'config.example.php'));
  cpSync(join(backend, 'composer.json'), join(app, 'composer.json'));
  cpSync(join(backend, 'composer.lock'), join(app, 'composer.lock'));
  // S-12: Archive statt Git-Quellstand, keine Composer-Plugins; danach nur Laufzeitdateien behalten (stripVendor).
  execFileSync(process.env.COMPOSER_BIN || 'composer', ['install', '--no-dev', '--prefer-dist', '--no-plugins', '--optimize-autoloader', '--no-interaction', '--no-progress', '--no-scripts', `--working-dir=${app}`], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  stripVendor(join(app, 'vendor'));
  writeFileSync(join(app, '.htaccess'), DENY_ALL);
  for (const e of readdirSync(app, { withFileTypes: true })) {
    if (e.isDirectory()) writeFileSync(join(app, e.name, '.htaccess'), DENY_ALL);
  }

  cpSync(join(HERE, 'remote.sh'), join(root, 'remote.sh'));
  verifyLayout(root);

  // MANIFEST.txt: Kopf, dann "---", dann "<sha256>  <Pfad>" (sha256sum -c-tauglich, von remote.sh verify gelesen).
  const built = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000) : new Date();
  const files = walk(root).map((p) => relative(root, p).split(sep).join('/')).sort();
  const lines = [
    `git: ${sha}${dirty ? ' (Arbeitsverzeichnis mit lokalen Änderungen)' : ''}`,
    `built: ${built.toISOString()}`,
    `build: ${isRelease ? 'release' : 'dev (--allow-dev, nicht für den Betrieb)'}`,
    `files: ${files.length}`,
    '---',
    ...files.map((f) => `${sha256(join(root, f))}  ${f}`),
  ];
  writeFileSync(join(root, 'MANIFEST.txt'), lines.join('\n') + '\n');

  execFileSync('tar', ['--sort=name', '--owner=0', '--group=0', '--numeric-owner', '-czf', `${root}.tar.gz`, '-C', out, name]);
  if (!statSync(`${root}.tar.gz`).size || lstatSync(root).isSymbolicLink()) fail('Tarball leer');
  return { root, tarball: `${root}.tar.gz`, sha, files: files.length, release: isRelease };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = buildPackage(parseArgs(process.argv.slice(2)));
  console.log(`Paket: ${r.root}\nTarball: ${r.tarball}\nGit: ${r.sha}\nDateien: ${r.files}\nBuild: ${r.release ? 'release' : 'dev'}`);
}
