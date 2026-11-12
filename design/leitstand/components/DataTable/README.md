# DataTable

Die Tabelle zeigt Werte, die man zeilenweise vergleicht: Quellränge, Geräteklassen, Limits je Tarif.

**Sie liefern:** Spaltenköpfe, Zeilen mit einer Zeilenüberschrift (`th scope="row"`) und eine Bezeichnung für den Bereich (`aria-label`).

- Spaltenköpfe in `data-label`, ohne Versalien. Zahlen rechtsbündig in Mono.
- Die Tabelle liegt auf `panel` mit Rahmen in `line` und Radius `radius-lg`. Keine Zebrastreifen.
- Auf schmalen Bildschirmen scrollt die Tabelle waagerecht in ihrem Rahmen; der Rahmen ist fokussierbar. Die Seite selbst scrollt nie waagerecht.
- „Enthalten“ und „nicht enthalten“ stehen als Wort („ja“, „–“), nicht als Farbe oder Haken allein.
- Drei gleiche Karten nebeneinander sind kein Ersatz für eine Tabelle.
