import type { ScreenshotId } from '../data/types';

/**
 * Typisiertes Inhaltsmodell für Seiten aus Abschnitten (Produktseiten, später weitere).
 * Texte stehen wörtlich in `src/content/<lang>/…`; die Ansicht (`src/views/ProductPage.astro`) setzt sie zusammen.
 *
 * `Rich` ist ein String mit einfacher Auszeichnung (siehe `src/content/rich.ts`):
 *   [C-26] oder [C-29, C-49]  → Beleg(e) hinter dem Satz, der Absatz bekommt einen `rt-para`-Rahmen
 *   `text`                    → <code>
 *   **text**                  → <b>
 */
export type Rich = string;

export type Action = 'trial' | 'demo' | 'contact';

/** Verweis auf eine andere Seite; `href` ist immer die deutsche Adresse aus `ROUTES` (die Ansicht lokalisiert sie). */
export interface LinkRef { label: string; href: string }

export interface ShotRef { id: ScreenshotId; caption: string; ratio?: '16x10' | '4x5' }

export interface Column { key: string; head: string; numeric?: boolean }

/** Fließtext, ein Absatz je Eintrag, auf Lesebreite. */
export interface ProseBlock { kind: 'prose'; paras: Rich[] }
/** Text und Screenshot-Platzhalter nebeneinander ab `lg`, darunter untereinander. */
export interface FigureBlock { kind: 'figure'; paras: Rich[]; shot: ShotRef }
/** Ein oder zwei Screenshot-Platzhalter ohne Text. */
export interface ShotsBlock { kind: 'shots'; shots: ShotRef[] }
/** Kennwerte (SpecList); Belege als [C-xx] im Wert. */
export interface SpecsBlock { kind: 'specs'; items: { term: string; value: Rich }[]; title?: string }
/** Echte Tabelle (DataTable); Zellen sind `Rich`. `caption` steht als Erläuterung über der Tabelle. */
export interface TableBlock {
  kind: 'table';
  label: string;
  columns: Column[];
  rows: Record<string, Rich>[];
  rowHeader: string;
  caption?: Rich;
  /** Steht unter der Tabelle, etwa ein Beleg für die ganze Tabelle: `[C-46]` */
  after?: Rich;
}
export interface StepsBlock { kind: 'steps'; steps: { title: string; text: string; claim?: `C-${string}` }[] }
/** Shell-Beispiel mit Kopierknopf (CodeSample). Zeilen mit `#` sind Kommentare, Zeichenketten in "…" werden hervorgehoben. */
export interface CodeBlock { kind: 'code'; title: string; code: string }
/** Netzschema mit Ausfallsimulation (TopologyStage). */
export interface TopologyBlock { kind: 'topology' }
/** Schemazeichnung „Verbindungsrichtung“ (ConnectionSchema) mit Unterschrift. */
export interface SchemaBlock { kind: 'schema'; caption: string }
export interface NoticeBlock { kind: 'notice'; lead: string; text: Rich; variant?: 'info' | 'signal' }
export interface LinkBlock { kind: 'link'; link: LinkRef }
/** Text neben einer Tabelle, Kennwerten oder einem Codebeispiel (ab `lg` nebeneinander). */
export interface SplitBlock { kind: 'split'; paras: Rich[]; side: SpecsBlock | TableBlock | CodeBlock }

export type Block =
  | ProseBlock | FigureBlock | ShotsBlock | SpecsBlock | TableBlock | StepsBlock | CodeBlock
  | TopologyBlock | SchemaBlock | NoticeBlock | LinkBlock | SplitBlock;

export interface PageSection {
  id: string;
  title: string;
  /** Vorspann unter der Überschrift */
  lead?: Rich;
  blocks: Block[];
}

export interface StripItem { label: string; value: string; claim?: `C-${string}` }

export interface PageHeroContent {
  title: string;
  lead: Rich;
  /** Reihenfolge der Knöpfe; der erste ist der Hauptknopf */
  actions: Action[];
  /** Betriebsleiste unter dem Kopf */
  strip?: StripItem[];
  /** Netzschema mit Ausfallsimulation im Kopf */
  topology?: boolean;
}

/** Eigener Abschluss statt des gemeinsamen Abschlussbands (`Cta`). */
export interface PageClosing { id: string; title: string; text: Rich; actions: Action[] }

export interface PageContent {
  meta: { title: string; description: string };
  hero: PageHeroContent;
  sections: PageSection[];
  closing?: PageClosing;
}

/** Was in der Übersetzung gleich bleiben muss: Beleg- und Screenshot-Nummern, Knöpfe, Blockarten, Varianten, Formate. */
type Fixed = `C-${string}` | `S-${string}` | Action | Block['kind'] | NoticeBlock['variant'] | ShotRef['ratio'];

/**
 * Typ einer Übersetzung: dieselbe Gestalt wie das deutsche Original, nur die Texte sind frei.
 * - Zeichenketten werden zu `string`, außer Belegen (`C-…`), Screenshots (`S-…`) und festen Werten (`Fixed`), die gleich bleiben.
 * - Zahlen und Wahrheitswerte bleiben, wie sie sind (bei `as const` also genau gleich).
 * - Tupel (`as const`-Listen) behalten ihre Länge, Objekte ihre Schlüssel; Funktionen ihre Parameter.
 * Englische Inhalte tippen sich als `Translation<typeof deutscherExport>`; so erzwingt die Typprüfung die Parität.
 */
export type Translation<T> =
  T extends Fixed ? T
  : T extends string ? string
  : T extends (...args: infer A) => infer R ? (...args: A) => Translation<R>
  : T extends readonly unknown[] ? { [K in keyof T]: Translation<T[K]> }
  : T extends object ? { [K in keyof T]: Translation<T[K]> }
  : T;
