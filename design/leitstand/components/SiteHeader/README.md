# SiteHeader

Die Kopfzeile trägt Marke, fünf Navigationspunkte, die Sprachwahl und die drei Handlungen „Anmelden“, „Live-Demo“ und „30 Tage testen“.

**Sie liefern:** die aktuelle Seite (`aria-current="page"`), die Sprache und die Ziel-URLs aus der zentralen Link-Datei.

- Reihenfolge der Navigation: Produkt, Geräte, Lösungen, Sicherheit, Preise. „Kontakt“ steht in der Fußzeile.
- Ab 1120 px (`bp-nav`) steht die Navigation in der Kopfzeile, darunter im Menü. Das Menü ist ein `details`-Element und funktioniert ohne JavaScript.
- Die Kopfzeile ist nicht fixiert und hat keinen eigenen Hintergrundwechsel beim Scrollen.
- Sprachwahl als zwei Kürzel in `data-label`; die aktive Sprache ist kein Link.
- „Anmelden“ führt zu `https://www.reticora.cloud/login`, „Live-Demo“ zu `https://www.demo.reticora.cloud`, „30 Tage testen“ zu `https://www.reticora.cloud/onboarding`.
- Die Bildmarke steht in `accent`, das Wort „Reticora“ in `fg`, Gewicht 600. Nie „Reticora CMDB“ in der Kopfzeile.
