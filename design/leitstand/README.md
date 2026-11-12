Reticora Leitstand ist das Design-System der Marketing-Website von Reticora CMDB. Die Website zeigt das Netz selbst: dunkel, mit einem Netzschema als Bühne, in den Farben und mit den Wörtern der App.

## Grundsatz

- Bauen Sie jede Seite aus den Bausteinen unter „Components“. Farben, Abstände, Radien und Schriften kommen nur aus den Tokens.
- Zeigen Sie, was die App tut, so wie die App es zeigt. Das Netzschema übernimmt Farben, Wortlaut und Rechenregeln der Topologie-Ansicht.
- Jede Aussage mit Zahl oder Sicherheitsbezug trägt einen `Beleg`. Was nicht belegt ist, steht nicht auf der Seite.
- Produktbilder sind Screenshots der App im dunklen Thema oder Schemazeichnungen, die als solche beschriftet sind. Bis die Screenshots vorliegen, steht ein `ScreenshotSlot`.

## Inhalt und Ton

- Sie-Form, wie in der App: „Bestätigen Sie, welche Netze durchsucht werden sollen.“
- Verben im Aktiv, Angaben mit Einheit: „Der Collector fragt alle 15 Minuten ab.“ Nie „in Echtzeit“, „nahtlos“, „führend“.
- Wörter der App: Kunde, Standort, CI, Review, Collector, Scope, Ausfallsimulation. Anlegen heißt „anlegen“, nicht „erstellen“.
- Knöpfe sagen, was geschieht: „30 Tage testen“, „Live-Demo“, „Absenden“.
- Überschriften im Satzbau eines normalen Satzes, ohne Versalien, ohne Ausrufezeichen. Versalien stehen nur in der Betriebsleiste.
- Keine Emojis, keine Zitate von Kunden, keine Kennzahlen ohne Nachweis, keine Logos von Geräteherstellern.
- Englische Seiten folgen der englischen Oberfläche der App: „Customers“, „Sites“, „Simulate outage“, „Protected by redundancy“.

## Farbe

- Seitengrund ist `canvas`, Flächen darauf sind `panel`, aufgeklappte Ebenen `raised`. Tiefe entsteht über diese drei Helligkeiten und eine Haarlinie in `line`, nie über Schatten oder Verläufe.
- Text steht in `fg`, Vorspann und Beschreibungen in `fg-muted`, Hinweise ab 13 px in `fg-subtle`. `fg-subtle` ist nie Fließtext.
- `accent` ist das Petrol der App: Bildmarke, Hauptknopf, Werte, Fokusring. Links im Fließtext stehen in `accent-strong`. Auf einer Füllung in `accent` steht `accent-fg`.
- `signal` (Bernstein) heißt „braucht Aufmerksamkeit“ und steht immer mit einem Wort. `danger` ist Fehlertext in Formularen, `success` die Bestätigung.
- `graph-active` und `graph-failed` gehören allein dem Netzschema. Sie sind Flächenfarben, nie Textfarben.
- Bedienelemente haben einen Umriss in `control`; `line` und `line-strong` reichen dafür nicht.
- Kontrast: `fg` und `fg-muted` erreichen im Leitstand mindestens 7:1 auf `canvas`, `panel` und `raised`; `fg-subtle` und `accent` mindestens 4,5:1.

## Schrift

- Archivo für Überschriften und Text, JetBrains Mono für Daten. Beide liegen als Dateien auf dem eigenen Webspace.
- Überschriften (`display-xl` bis `heading-m`) laufen mit 112 % Breite und Gewicht 600, `heading-s` mit 106 %. Fließtext läuft mit 100 % Breite und Gewicht 400.
- `display-xl` nur für den Titel der Startseite, `display-l` für Seitentitel, `heading-l` für Abschnitte. Je Seite genau eine `h1`.
- Fließtext in `body`, höchstens `measure` (68 Zeichen) breit. Vorspann in `lead` und `fg-muted`.
- Alles, was man abliest oder abtippt, steht in `data`: Gerätenamen, Adressen, Intervalle, Preise, Beziehungstypen. Beschriftungen dazu in `data-label`.
- Zahl und Einheit trennt ein geschütztes Leerzeichen: „15 min“, „24 h“, „49 €“.

## Layout und Abstände

- Bänder laufen über die volle Breite und sind durch eine Haarlinie getrennt. Der Inhalt sitzt in `container` (1200 px) mit `gutter` am Rand.
- Senkrechter Innenabstand eines Bands: `space-30` ab 1024 px, `space-24` ab 768 px, `space-16` darunter.
- Ein Abschnitt besteht aus Titel, Vorspann, dann Inhalt. Zwischen Titel und Inhalt liegt `space-8`.
- Text und Abbildung stehen ab `bp-lg` nebeneinander, mit `space-16` dazwischen; darunter untereinander, Text zuerst.
- Vergleiche stehen in einer `DataTable`, Abläufe in `Steps`, Werte in einer `SpecList`. Drei gleiche Karten nebeneinander gibt es nicht.
- Die Seite scrollt nie waagerecht. Tabellen, Code und das Netzschema scrollen in ihrem eigenen Rahmen.

## Formen, Linien, Tiefe

- Radien: `radius-sm` für Marken und Kennzeichen, `radius-md` für Knöpfe und Felder, `radius-lg` für Abbildungen, Tabellen und Code.
- Alle Linien sind `hairline` stark. Keine Schatten, kein Leuchten, kein Glas-Effekt, keine Verläufe.
- Rahmen sagen „eigene Fläche“. Setzen Sie sie nur um Abbildungen, Tabellen, Code, Felder und Hinweise, nicht um Textabschnitte.

## Bildsprache

- Die Bühne ist das `TopologyStage`: Punkte nach Status, ausgefallen rot und größer, betroffen grau, Kanten in einer Farbe mit dem Beziehungstyp. Kein Gerätesymbol, kein Pfeil, keine gestrichelte Linie.
- Screenshots: dunkles Thema der App, Demo-Organisation, 1440 × 900 px in doppelter Auflösung, deutsche bzw. englische Oberfläche passend zur Seite. Kein Geräterahmen, keine Schrägstellung.
- Jede Abbildung hat eine Nummer und eine Unterschrift. Eine Schemazeichnung nennt sich so.
- Keine Stockfotos, keine Illustrationen von Menschen, keine nachgebauten Oberflächen.

## Zustände und Bewegung

- Fokus: 2 px Umriss in `accent` mit 2 px Abstand, auf jedem Bedienelement.
- Hover hellt die Fläche auf `raised` auf oder verstärkt den Umriss. Aktiv verschiebt den Knopf um 1 px.
- Bewegung antwortet auf eine Handlung und dauert höchstens 150 ms. Nichts blendet beim Scrollen ein. Mit `prefers-reduced-motion` entfällt jede Bewegung.
- Jedes Bedienelement ist mindestens `target-min` (44 px) hoch.

## Zwei Themen

- **Leitstand** ist das Thema aller Marketingseiten. Es folgt nicht der Systemeinstellung und hat keinen Umschalter.
- **Dokument** ist das helle Thema für Impressum, Datenschutz, AGB, Subprozessoren und für jede Druckansicht. Es nutzt dieselben Tokens mit den hellen Werten der App.
- Bausteine kennen kein Thema. Sie lesen nur Tokens und sehen in beiden richtig aus.

## Ikonografie

- Das einzige Zeichen der Website ist die Bildmarke, das Fadenkreuz der App. Es steht in `accent` neben dem Wort „Reticora“.
- Weitere Symbole gibt es zum Start nicht. Braucht ein Baustein später eines, kommt es aus Lucide, dem Symbolsatz der App, mit Strichstärke 1,75.
- Im Netzschema ist das Fadenkreuz die Fokusmarke um einen Punkt. In der App bedeutet es „Fokussieren“.
