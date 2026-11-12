import type { Lang } from '../data/types';
import { UI as DE } from './de';
import { UI as EN } from './en';

export type { Lang };
export type UiStrings = typeof DE;

/** Alle Oberflächentexte einer Sprache; de.ts und en.ts haben dieselben Schlüssel. */
export function ui(lang: Lang): UiStrings {
  return lang === 'en' ? EN : DE;
}
export { counterpart, localize, dePath, isBuilt, routeOf, langOf, ROUTES } from './routes';
