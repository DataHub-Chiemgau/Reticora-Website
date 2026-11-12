# StatusStrip

Die Betriebsleiste nennt drei bis fünf feste Betriebswerte des Produkts in einer Zeile, wie die Anzeige an einem Messgerät.

**Sie liefern:** Paare aus Bezeichnung und Wert mit Einheit. Jeder Wert steht im Claim-Register.

- Einsatz: unter dem Seitenanfang der Startseite und der Produktseiten, höchstens einmal je Seite.
- Bezeichnung in `data-label` und Versalien (die einzige Stelle mit Versalien), Wert in `data` und `fg`.
- Nur Werte, die das Produkt fest zusagt: Intervalle, Puffer, Verbindungsrichtung, Hosting-Region. Keine Kundenzahlen, keine Verfügbarkeit ohne Vertrag, keine Zähler, die sich bewegen.
- Unter 768 px bricht die Leiste in mehrere Zeilen um; die Trennlinien bleiben.
