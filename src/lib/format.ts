import type { Lang } from '../data/types';

/** Zahlen- und Preisformat für die Ansichten.
 *  Deutsch: Punkt als Tausendertrenner, Komma als Dezimalzeichen, „49 €“, „20 %“ (je mit geschütztem Leerzeichen).
 *  Englisch: Komma als Tausendertrenner, Punkt als Dezimalzeichen, „€49“, „20%“ (ohne Leerzeichen).
 *  Ohne `lang` gilt Deutsch (bisherige Aufrufe bleiben unverändert). */
const SEP: Record<Lang, { thousands: string; decimal: string }> = {
  de: { thousands: '.', decimal: ',' },
  en: { thousands: ',', decimal: '.' },
};

/** Ganze Zahl mit Tausendertrenner (1190 → „1.190“ / „1,190“). */
export const grouped = (n: number, lang: Lang = 'de'): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, SEP[lang].thousands);

/** Zahl mit Tausendertrenner; Nachkommastellen nur, wenn die Zahl welche hat (dann genau zwei). */
const amount = (n: number, lang: Lang): string => {
  if (Number.isInteger(n)) return grouped(n, lang);
  const [int, dec] = n.toFixed(2).split('.');
  return `${grouped(Number(int), lang)}${SEP[lang].decimal}${dec}`;
};

/** Betrag in Euro; ganze Beträge ohne Nachkommastellen. de: „1.190 €“ (geschütztes Leerzeichen), en: „€1,190“. */
export const eur = (n: number, lang: Lang = 'de'): string => (lang === 'en' ? `€${amount(n, lang)}` : `${amount(n, lang)}\u00a0€`);

/** Anteil als Prozentzahl (0,2 → de „20 %“ mit geschütztem Leerzeichen, en „20%“). */
export const pct = (share: number, lang: Lang = 'de'): string => `${Math.round(share * 100)}${lang === 'en' ? '' : '\u00a0'}%`;
