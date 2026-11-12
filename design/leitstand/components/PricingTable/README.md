# PricingTable

Die Preistabelle stellt alle Pakete in Zeilen untereinander, mit Monatspreis, Jahrespreis und dem Preis im ersten Beta-Jahr.

**Sie liefern:** nichts von Hand. Alle Werte kommen aus `src/data/pricing.ts`, der einzigen Stelle, an der Preise stehen.

- Zeilen statt Karten: Die Pakete werden verglichen, nicht einzeln beworben. Kein Paket ist als „beliebt“ oder „empfohlen“ markiert.
- Die Stufen heißen „Paket“, wie in der App; englisch „plan“.
- Unter der Tabelle stehen immer drei Dinge: die Bedingungen des Beta-Rabatts als Hinweisband, der Satz „Angebot nur für Unternehmen. Alle Preise zzgl. USt.“ und die Zusatzkosten.
- Beta-Preise stehen in `accent-strong`, nie durchgestrichen neben dem Normalpreis.
- „ab“ und „auf Anfrage“ stehen ausgeschrieben; die Enterprise-Zeilen führen zum Kontaktformular.
- Die Funktionen je Paket stehen in einer zweiten `DataTable` darunter, nicht in dieser Tabelle.
- Zusatzkosten im Monat: 0,05 € je zusätzlichem CI, 0,03 € je Monitoring-Service.
- Englische Fassung: gleiche Zahlen, Schreibweise „€49“, Dezimalpunkt.
