/** Zahlen- und Preisformat für die Ansichten. Deutsch: Punkt als Tausendertrenner, Komma als Dezimalzeichen. */
export const grouped = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Betrag in Euro mit geschütztem Leerzeichen vor dem Zeichen; ganze Beträge ohne Nachkommastellen. */
export const eur = (n: number): string => `${Number.isInteger(n) ? grouped(n) : n.toFixed(2).replace('.', ',')} €`;

/** Anteil als Prozentzahl (0,2 → „20 %“). */
export const pct = (share: number): string => `${Math.round(share * 100)} %`;
