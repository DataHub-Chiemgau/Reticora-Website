# ScreenshotSlot

Der Abbildungsrahmen hält die Fläche für einen Screenshot der App frei und zeigt, solange das Bild fehlt, dessen Nummer, Motiv und Zielmaß.

**Sie liefern:** die Nummer aus dem Screenshot-Manifest (`S-01` bis `S-18`), das Seitenverhältnis und die Bildunterschrift. Das Motiv und das Zielmaß kommen aus dem Manifest.

- Der Rahmen hat das endgültige Seitenverhältnis. Beim Austausch gegen das Bild verschiebt sich nichts.
- Mit Bild bleiben Rahmen, Radius `radius-lg` und Bildunterschrift; die Eckmarken und die Beschriftung entfallen.
- Screenshots entstehen im dunklen Thema der App, in der Demo-Organisation, 1440 × 900 px in doppelter Auflösung. Nie aus Kundendaten.
- Jede Abbildung hat eine Unterschrift mit Nummer („Abb. 2“) und einem Satz, der sagt, was zu sehen ist.
- Kein Geräterahmen, kein Browserfenster, keine Schrägstellung, kein Schatten.
- Vor dem Go-live meldet ein Test jeden Rahmen ohne Bild.
