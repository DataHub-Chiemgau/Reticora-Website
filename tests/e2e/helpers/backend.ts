import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Ordner, in den tests/server/start.sh Datenbank und Mail-Datei der Testinstanz legt (gleiche Berechnung wie dort). */
export const E2E_DIR = join(tmpdir(), 'reticora-e2e');

/** Anzahl der gespeicherten Anfragen mit dieser E-Mail-Adresse (liest die SQLite-Datei mit PHP/PDO, kein sqlite3-CLI nötig). */
export function leadCount(email: string): number {
  const out = execFileSync(
    'php',
    ['-r', '$p = new PDO("sqlite:" . $argv[1]); $s = $p->prepare("SELECT COUNT(*) FROM lead WHERE email = ?"); $s->execute([$argv[2]]); echo $s->fetchColumn();', '--', join(E2E_DIR, 'main.sqlite'), email],
    { encoding: 'utf8' },
  );
  return Number(out);
}

/** Anzahl der Mails (Vertrieb + Bestätigung), die an oder für diese Adresse in der Mail-Datei stehen. */
export function mailCount(email: string): number {
  const f = join(E2E_DIR, 'main-mails.jsonl');
  if (!existsSync(f)) return 0;
  return readFileSync(f, 'utf8').split('\n').filter((l) => l.includes(email)).length;
}

let n = 0;
export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${process.pid}-${n++}@example.com`;
