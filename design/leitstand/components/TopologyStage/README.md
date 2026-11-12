# TopologyStage

Das Netzschema zeigt an einer kleinen Stromkette, was die Ausfallsimulation der App berechnet: Der Besucher lässt ein CI ausfallen und sieht, was betroffen ist und was die zweite Versorgung schützt.

**Sie liefern:** Knoten (Name, Position), Beziehungen (abhängiges CI, versorgendes CI, Beziehungstyp) und die Texte der Ergebniszeile in der Sprache der Seite.

Bildsprache, übernommen aus der Topologie-Ansicht der App:

- Knoten sind gefüllte Punkte mit dem Namen des CI in `data`. Die Farbe steht für den Status, nicht für den Gerätetyp: aktiv ist `graph-active`.
- Ein ausgefallenes CI ist `graph-failed` und 1,4-mal so groß. Das ist das einzige Rot auf der Bühne.
- Betroffene CIs werden grau (`line-strong`), ihre Kanten blasser (`line`), deren Beschriftung entfällt. Die App nennt das „grau dargestellt“.
- Ein redundant versorgtes CI bekommt kein Zeichen. Es bleibt grün und steht in der Ergebniszeile unter „Durch Redundanz geschützt“.
- Kanten sind gerade, dünn, in einer Farbe, ohne Pfeil und ohne Strichelung. Die Beschriftung ist der Beziehungstyp (`powered_by`, `hosted_on`).
- Bernstein kommt nicht vor: In der App bedeutet es „Single Point of Failure eines Services“.

Rechenregeln, übernommen aus der App:

- `powered_by` und `member_of_cluster` sind redundant: Ein CI fällt erst aus, wenn alle seine Versorger dieses Typs ausgefallen sind.
- `hosted_on`, `runs_on`, `depends_on`: Ein ausgefallener Versorger genügt.
- `connected_to` löst nie einen sicheren Ausfall aus und wird im Schema nicht gezeichnet.
- Mehrere CIs können gemeinsam ausfallen. Ausgefallene CIs zählen nicht zu den betroffenen.

Bedienung:

- Die Knöpfe unter dem Schema sind die eigentliche Bedienung, per Tastatur und Screenreader erreichbar, mindestens `target-min` hoch. Die App löst den Ausfall ebenfalls aus der Knotenliste aus. Ein Klick auf einen Punkt tut dasselbe.
- Die Ergebniszeile ist eine Live-Region und folgt dem Wortlaut der App: „Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt).“
- Das Fadenkreuz erscheint nur als Fokusmarke um den Punkt, dessen Knopf den Fokus hat. In der App bedeutet das Fadenkreuz „Fokussieren“, nicht „ausfallen lassen“.
- Ohne JavaScript steht das Schema im Ausgangszustand mit der passenden Ergebniszeile; die Knöpfe entfallen.
- Keine Bewegung außer dem Farbwechsel (150 ms); mit `prefers-reduced-motion` entfällt auch der.
- Die Zeile „Schemazeichnung, kein Screenshot“ bleibt stehen. Die App ordnet Knoten im Kreis an; die geordnete Zeichnung ist eine Vereinfachung.
- Budget der Insel: 8 KB JavaScript, kein Framework.
