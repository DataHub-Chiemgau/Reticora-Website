import type { Action, LinkRef, Rich, ShotRef } from './types';

/** Inhaltsmodell der Lösungsseiten (ISP, MSP): Situationen mit Text, Kennzeile der Funktionen und optionaler Abbildung. */
export interface Situation {
  id: string;
  title: string;
  text: Rich[];
  /** Kennzeile „Funktionen“ */
  features: string[];
  shot?: ShotRef;
  link?: LinkRef;
}

export interface SolutionContent {
  meta: { title: string; description: string };
  hero: { title: string; lead: Rich; actions: Action[]; topic?: string };
  situations: Situation[];
  closing: { id: string; title: string; text: Rich; actions: Action[]; topic?: string };
}
