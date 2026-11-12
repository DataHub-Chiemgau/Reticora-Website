/** Auszeichnung für Texte im Inhaltsmodell (`Rich`, siehe types.ts): [C-xx]-Belege, `code`, **fett**. */
export type RichPart =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'bold'; v: string }
  | { t: 'claim'; id: `C-${string}` };

const TOKEN = /(\[C-\d+(?:,\s*C-\d+)*\]|`[^`]+`|\*\*[^*]+\*\*)/;

/** Geschütztes Leerzeichen zwischen Zahl und Einheit. */
const UNIT_DE = 'Tage|Tagen|Tag|Stunden|Minuten|Sekunden|Monate|Monaten|Jahre|Jahren|Anfragen|Einträge|Einträgen|Knoten';
const UNIT_EN = 'days|day|hours|hour|minutes|minute|seconds|second|months|month|years|year|requests|entries|entry|nodes';
const UNIT = `(?:h|min|ms|s|${UNIT_DE}|${UNIT_EN}|IDs|MiB|%|€)`;
const NUM_UNIT = new RegExp(`(\\d) (?=${UNIT}(?![\\p{L}\\d]))`, 'gu');
export const nbsp = (s: string): string => s.replace(NUM_UNIT, '$1 ');

/** Trennstellen für lange Wörter in Überschriften (U+00AD, weicher Trennstrich): sichtbar nur, wo die Zeile sonst bräche.
 *  Der Text bleibt gleich; `hyphens: auto` ist aus, damit Wörter nicht an beliebiger Stelle getrennt werden. */
const SHY = '\u00AD';
const HYPHEN_WORDS = ['Informations|sicherheit', 'Barriere|frei|heit', 'Sub|prozessoren', 'Kauf|männische', 'Netz|betreiber', 'Ab|hängig|keiten', 'Ausfall|folgen'];
const HYPHENATED = new Map(HYPHEN_WORDS.map((w) => [w.replaceAll('|', ''), w.replaceAll('|', SHY)]));
export const hyphenate = (s: string): string => s.replace(/\p{L}+/gu, (w) => HYPHENATED.get(w) ?? w);

export function parseRich(input: string): RichPart[] {
  const parts: RichPart[] = [];
  for (const piece of input.split(TOKEN)) {
    if (!piece) continue;
    if (piece.startsWith('[C-')) {
      for (const id of piece.slice(1, -1).split(',')) parts.push({ t: 'claim', id: id.trim() as `C-${string}` });
    } else if (piece.startsWith('`')) {
      parts.push({ t: 'code', v: piece.slice(1, -1) });
    } else if (piece.startsWith('**')) {
      parts.push({ t: 'bold', v: nbsp(piece.slice(2, -2)) });
    } else {
      parts.push({ t: 'text', v: nbsp(piece) });
    }
  }
  // Leerzeichen vor einer Belegmarke entfallen (die Ansicht setzt es selbst).
  return parts.map((p, i) => (p.t === 'text' && parts[i + 1]?.t === 'claim' ? { t: 'text', v: p.v.replace(/\s+$/, '') } : p));
}

export const hasClaims = (input: string): boolean => parseRich(input).some((p) => p.t === 'claim');

/** Ohne Auszeichnung: Belege entfernt, Code/Fett als Klartext (für Titel und Tests). */
export function plainText(input: string): string {
  return parseRich(input).filter((p) => p.t !== 'claim').map((p) => (p as { v: string }).v).join('').replace(/\s+/g, ' ').trim();
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML für ein Shell-Beispiel: `#`-Zeilen als Kommentar (`c`), "…" als Zeichenkette (`k`). Alles andere bleibt Text. */
export function highlightShell(code: string): string {
  return code
    .split('\n')
    .map((line) =>
      line.trimStart().startsWith('#')
        ? `<span class="c">${esc(line)}</span>`
        : esc(line).replace(/&quot;/g, '"').replace(/"[^"]*"/g, (m) => `<span class="k">${m}</span>`),
    )
    .join('\n');
}
