# Prüfprotokoll Barrierefreiheit – Website Reticora

| | |
|---|---|
| Stand | 2026-11-18 (Phase 7, Task 4) |
| Gegenstand | die gebaute statische Website (`dist/`) beider Sprachen hinter dem Apache-Testserver (`tests/server/start.sh`), dazu die vom PHP-Backend ausgelieferte Fehlerseite des Formulars (422) |
| Maßstab | WCAG 2.2, Stufen A und AA, Kriterium für Kriterium |
| Nicht Gegenstand | die Anwendung Reticora (`reticora.cloud`), die Demo-Instanz, Inhalte, die der Anbieter noch liefert (Rechtstexte, Screenshots) |
| Automatisierte Prüfung | `tests/e2e/a11y-audit.spec.ts` (neu), dazu die vorhandenen Tests in `tests/e2e/` (axe-core je Seite in `pages.spec.ts`, Tastatur und Zustände in `components.spec.ts`, `topology.spec.ts`, `contact.spec.ts`, `geraete.spec.ts`, `preise.spec.ts`, `demo.spec.ts`, `shell.spec.ts`, `layout.spec.ts`) |
| Barrierefreiheitsbaum | `docs/qa/a11y-snapshots/<seite>.yml`, je Seitentyp, eingecheckt; der Test „Baum …“ schlägt fehl, sobald sich der Baum ändert |

Dieses Protokoll beschreibt, was geprüft wurde, wie und mit welchem Ergebnis. Es ist **keine Konformitätserklärung** nach WCAG, EN 301 549 oder BFSG und ersetzt nicht die Prüfung mit echten Screenreadern und Menschen mit Behinderungen (Abschnitt 6).

## 1. Zusammenfassung

- Geprüft wurden 55 Erfolgskriterien der WCAG 2.2 (A und AA; 4.1.1 ist in WCAG 2.2 entfallen) auf acht Seitentypen in beiden Sprachen, dazu drei Zustände (Gerätefilter gesetzt, Formularfehler mit JavaScript, Fehlerseite des Servers).
- Ergebnis nach Behebung: **41 bestanden**, **0 Mangel offen**, **0 nicht prüfbar**, **14 nicht anwendbar** (41 + 14 = 55). Bei **6** der bestandenen Kriterien (1.3.1, 2.4.1, 3.1.2, 3.3.1, 4.1.2, 4.1.3) ist der Teil, der von der Ausgabe eines echten Screenreaders abhängt, hier nicht prüfbar; er steht in der Tabelle als „bestanden; SR-Teil Phase 8“ und in der Anleitung in Abschnitt 7.
- **Vier Mängel** wurden gefunden und behoben, jeweils mit zuerst fehlschlagendem Test (Abschnitt 4).
- Kleinster gemessener Textkontrast: 5,86 : 1 im Thema Leitstand (Beschriftung der Kanten im Netzschema, `fg-subtle` auf `panel`), 4,99 : 1 im Thema Dokument (Fußzeile, `fg-subtle` auf `canvas`). Beide liegen über 4,5 : 1 und entsprechen den Werten in `docs/design-system.md` §3.1.
- Die Tokens blieben unverändert; kein Kontrastmangel zwang zu einer neuen Farbe.
- Die Aussagen der Seite `/barrierefreiheit/` (`src/content/de/barrierefreiheit.ts`) widersprechen dem Ergebnis nicht. Die Aussage, Screenreader läsen die Ergebniszeile der Ausfallsimulation vor, ist technisch umgesetzt (`role="status"`, im Chromium-Baum als `status`, `live=polite` geprüft), mit einem echten Screenreader aber erst in Phase 8 bestätigt.

## 2. Vorgehen

### 2.1 Seitentypen

| Schlüssel (Tests, Schnappschüsse) | Adresse | Thema | Besonderheit |
|---|---|---|---|
| `home-de`, `home-en` | `/`, `/en/` | Leitstand | Insel Ausfallsimulation, Kopierknopf, Betriebsleiste |
| `produkt-topologie-impact-de`, `product-topology-impact-en` | `/produkt/topologie-impact/` | Leitstand | Produktnavigation, gestapelte Tabelle, zweites Netzschema |
| `geraete-de`, `geraete-de-gefiltert`, `devices-en` | `/geraete/` | Leitstand | Filterinsel, Sprungmarken (ohne JavaScript), Scrollrahmen |
| `preise-de`, `pricing-en` | `/preise/` | Leitstand | gestapelte Pakettabelle, Matrix mit klebender Spalte, Fragen, Belege, Druck |
| `demo-de`, `demo-en` | `/demo/` | Leitstand | drei Kopierknöpfe |
| `kontakt-de`, `kontakt-de-fehler`, `kontakt-de-422`, `contact-en` | `/kontakt/` | Leitstand | Formular; Fehler mit JavaScript; Fehlerseite des Servers (422) |
| `impressum-de`, `legal-notice-en`, `barrierefreiheit-de` | `/impressum/`, `/barrierefreiheit/` | Dokument | helles Thema, Tabelle der Kontraste |
| `404-de`, `404-en` | `/gibt-es-nicht/`, `/en/does-not-exist/` | Leitstand | Antwort 404 des Servers mit eigener Seite je Sprache |

Die übrigen Seiten (weitere Produktseiten, Lösungen, Sicherheit, Datenschutz, AGB, Subprozessoren, Danke-Seiten) bestehen aus denselben Bausteinen; für sie gelten die seitenübergreifenden Tests in `pages.spec.ts` (axe-core, 320 px ohne waagerechtes Scrollen, `lang`, Titel) und die Probe „Links im Fließtext“ über alle Routen (Abschnitt 4, M-4).

### 2.2 Werkzeuge und Methoden

Alle Messungen laufen als Skript in der Seite (`window.a11y` in `a11y-audit.spec.ts`, per `addInitScript` eingesetzt; die CSP der Website bleibt aktiv). Verwendet werden nur Schnittstellen, die Chromium, Firefox und WebKit kennen; was nur Chromium emulieren kann, ist in den anderen Browsern übersprungen und hier benannt.

| Prüfung | Methode |
|---|---|
| Tastaturweg | Tab vom Seitenanfang bis die Folge die Seite verlässt (höchstens 400 Schritte, sonst „Falle“). Jeder Halt wird mit der Liste aller sichtbaren Bedienelemente verglichen (nichts fehlt, nichts Unerwartetes außer scrollbaren Rahmen). Lesereihenfolge: kein Sprung nach oben, außer in eine Spalte rechts daneben, und kein Sprung nach links in derselben Zeile. Rückwärts mit Umschalt+Tab muss genau die Umkehrung herauskommen. Bei 1280 px und bei 390 px mit geöffnetem Menü. |
| Fokus sichtbar | je Halt: `outline-style` nicht `none`, Breite ≥ 2 px, Kontrast der Umrissfarbe gegen den Hintergrund daneben ≥ 3 : 1 (bei negativem Abstand auch gegen die eigene Fläche). In beiden Themen, weil die Rechtsseiten im Thema Dokument stehen. |
| Fokus nicht verdeckt (2.4.11) | je Halt: sichtbare Fläche nach Abschneiden durch Viewport und alle scrollenden Vorfahren; auf neun Punkten dieser Fläche `elementFromPoint`. Verdeckt heißt: Fläche 0 oder an keinem Punkt das Element selbst oben. Vorwärts und rückwärts (die Matrix der Preise hat eine klebende erste Spalte). |
| 400 % Zoom | eigener Browserkontext mit Viewport 320 × 225 CSS-px und `deviceScaleFactor` 4. Das entspricht 1280 × 900 Gerätepixeln bei 400 %: Der Browser rechnet mit demselben CSS-Viewport, Medienabfragen und Umbrüche greifen wie beim echten Zoom. CSS `zoom` am Wurzelelement wurde verworfen, weil Medienabfragen dann weiter 1280 px sähen und Firefox `zoom` erst seit Version 126 und mit abweichender Rechnung kennt. |
| Umbruch (1.4.10) | Seite ohne waagerechtes Scrollen; jeder seitlich scrollende Rahmen gehört zu den erlaubten (`.rt-table-wrap`, `.rt-topo-frame`, `.rt-schema-frame`, `pre`) und ist per Tastatur erreichbar; kein Text ragt aus seinem Kasten. |
| Textabstände (1.4.12) | Stylesheet nach dem Prüfverfahren der WCAG (`* { line-height: 1.5; letter-spacing: .12em; word-spacing: .16em }`, `p { margin-bottom: 2em }`, alle `!important`) als konstruiertes Stylesheet eingesetzt. Danach: Text, dessen Zeilenkasten über sein Element hinausragt (bei `overflow: hidden/clip` abgeschnitten, sonst überlappend; erfasst auch feste Höhen), um mehr als 1,5 px plus die halbe Differenz aus Schrift- und Zeilenhöhe. Zuvor dieselbe Messung ohne geänderte Abstände als Nullprobe. Bei 1280 und 320 px. |
| Zielgröße (2.5.8) | jedes Ziel (`a`, `button`, `summary`, Felder, Punkte im Netzschema) ≥ 24 × 24 px, sonst Abstandsausnahme (Kreis mit 24 px Durchmesser um die Mitte schneidet kein anderes Ziel und keinen anderen solchen Kreis) oder Link im Fließtext. |
| Bewegung | alle Elemente und `::before`, `::after`, `::marker`: `transition-duration`, `animation-name/-duration`, `scroll-behavior`. Mit `prefers-reduced-motion: reduce` muss alles 0 sein, sonst höchstens 150 ms (`design-system.md` §8). |
| Erzwungene Farben | nur Chromium (`emulateMedia({ forcedColors: 'active' })`): Knöpfe, Felder, Menüknopf und fokussierbare Rahmen haben einen Rand (oder der umgebende Kasten), jeder Tab-Halt einen Umriss. |
| Kontrast (1.4.3) | jeder sichtbare Textknoten: Textfarbe (bei SVG `fill`) mit Deckkraft aller Vorfahren, Hintergrund aus den Hintergrundfarben der Vorfahren zusammengesetzt, Verhältnis nach WCAG 2. Große Schrift ab 24 px oder ab 18,66 px fett. Belege werden vorher aufgeklappt. Texte auf Hintergrundbildern würden gezählt und ließen den Test scheitern (es gibt keine). Dazu der Druck (helles Thema auf jeder Seite). |
| Barrierefreiheitsbaum | `locator('body').ariaSnapshot()` in Chromium bei 1280 × 900. Das ist Playwrights Berechnung nach WAI-ARIA und HTML-AAM, nicht der Baum des Browsers; deshalb zusätzlich der echte Chromium-Baum über CDP (`Accessibility.getFullAXTree`) für gestapelte Tabellen, Belege, Umschaltknöpfe und Live-Regionen. |
| Gegenprobe | ein eigener Test baut auf einer Seite absichtlich Mängel ein (verdeckender Balken, entfernter Umriss, Kasten mit fester Höhe, 12-px-Knöpfe, 1-s-Übergang, blasser Text, vertauschte Reihenfolge) und verlangt, dass jede Messung sie meldet. Sonst bewiese ein grüner Lauf nichts. |

Lokal stand nur Chromium zur Verfügung. Firefox und WebKit laufen in der CI (`playwright.config.ts`, Projekte nur mit `CI`); dort erscheinen die neuen Tests zum ersten Mal.

## 3. Ergebnis je Erfolgskriterium

Ergebnis: **bestanden**, **Mangel** (offen), **nicht prüfbar** (mit Grund), **n. a.** (nicht anwendbar). „Behoben“ verweist auf Abschnitt 4. Testnamen sind die Titel in `tests/e2e/a11y-audit.spec.ts`, sonst mit Datei.

| Nr. | Kriterium (Stufe) | anwendbar | Vorgehen und Beleg | Ergebnis |
|---|---|---|---|---|
| 1.1.1 | Nicht-Text-Inhalt (A) | ja | Netzschemata sind `svg role="img"` mit `title` und `desc` (Baum: `img "Schema einer Stromkette …"`); Häkchen der Matrix `aria-hidden` mit Wort (`enthalten`); Bildmarke im Link „Reticora“; Lampen und Punkte sind Zierde. Screenshots sind noch Platzhalter mit Text (Nummer, Motiv, Maß). axe-core je Seite (`pages.spec.ts` „axe ohne Befunde“), Baum gelesen. | bestanden |
| 1.2.1 | Nur Audio / nur Video (A) | nein | kein Audio, kein Video | n. a. |
| 1.2.2 | Untertitel (A) | nein | kein Video | n. a. |
| 1.2.3 | Audiodeskription oder Alternative (A) | nein | kein Video | n. a. |
| 1.2.4 | Untertitel live (AA) | nein | kein Live-Medium | n. a. |
| 1.2.5 | Audiodeskription (AA) | nein | kein Video | n. a. |
| 1.3.1 | Info und Beziehungen (A) | ja | „Struktur …“ (eine `main`, ein Kopf, ein Fuß, benannte und unterschiedliche Navigationen, benannte Bereiche, keine übersprungene Überschriftenebene, Tabellen mit Köpfen und Namen, keine doppelten IDs, keine Zelle nur mit Strich); „Chromium-Baum (CDP)“: gestapelte Tabellen bleiben bei 390 px Tabellen mit Spaltenköpfen; Formular: `label`, `aria-describedby` für Hinweis und Fehler (`contact.spec.ts`). Baum aller Seitentypen gelesen (Abschnitt 5). **Behoben: M-3.** Ob WebKit gestapelte Tabellen als Tabelle meldet, prüft Phase 8 (VoiceOver). | bestanden; SR-Teil Phase 8 |
| 1.3.2 | Bedeutungstragende Reihenfolge (A) | ja | DOM-Reihenfolge gleich Lesereihenfolge: „Tab erreicht jedes Bedienelement in Lesereihenfolge …“; Bild-Text-Wechsel (`sol-flip`) vertauscht nur die Anordnung zweier unabhängiger Blöcke; Baum in Lesereihenfolge gelesen | bestanden |
| 1.3.3 | Sensorische Eigenschaften (A) | ja | Texte gelesen: keine Anweisung nach Form, Lage oder Farbe; „grau dargestellt“ steht immer mit der Nennung der CIs | bestanden |
| 1.3.4 | Ausrichtung (AA) | ja | „Ausrichtung (1.3.4) …“: keine `orientation`-Abfrage und keine Sperre in CSS und Skripten; 390 × 844 und 844 × 390 ohne waagerechtes Scrollen | bestanden |
| 1.3.5 | Zweck von Eingaben (AA) | ja | `autocomplete="name"`, `"email"`, `"organization"`; Anliegen und Nachricht ohne passenden Wert (`off`) – `Contact.astro`, Baum `kontakt-de.yml` | bestanden |
| 1.4.1 | Farbe (A) | ja | „Links im Fließtext …“ (unterstrichen); Zustände mit Wort (Netzschema: Ergebniszeile; Matrix: „enthalten“); Fehlerfelder mit Text und `aria-invalid`. **Behoben: M-4.** | bestanden |
| 1.4.2 | Audio-Steuerung (A) | nein | kein Audio | n. a. |
| 1.4.3 | Kontrast (AA) | ja | „Kontrast … jeder Text gegen seinen berechneten Hintergrund“ je Seitentyp in beiden Themen, „Kontrast im Druck …“; axe-core `color-contrast`. Kleinste Werte in Abschnitt 5.3. | bestanden |
| 1.4.4 | Text vergrößern (AA) | ja | durch den 400-%-Test abgedeckt („1280 px bei 400 % Zoom …“): kein Verlust, Menü bedienbar; Schriftgrößen in `rem`/`px` werden vom Browserzoom skaliert | bestanden |
| 1.4.5 | Bilder von Text (AA) | ja | Schrift in den Schemata ist SVG-Text, keine Rastergrafik mit Text | bestanden |
| 1.4.10 | Umbruch (AA) | ja | „320 CSS-px: …“ und „1280 px bei 400 % Zoom …“ je Seitentyp; Scrollrahmen nur für Tabellen, Schemata und Code, alle fokussierbar; `pages.spec.ts` für alle Seiten bei 320 px auch ohne Webfonts | bestanden |
| 1.4.11 | Kontrast von Nicht-Text (AA) | ja | Fokusumriss ≥ 3 : 1 in jedem Tab-Halt; „Kontrast der Bedienelemente (1.4.11) …“ (Felder, Knöpfe mit Rand, Filter- und Ausfallknöpfe, Menüknopf, beide Themen); Punkte im Schema laut `design-system.md` §3.1 (`graph-active` 5,3, `graph-failed` 3,6 auf `panel`); betroffene Knoten bewusst blass, Aussage steht in der Ergebniszeile | bestanden |
| 1.4.12 | Textabstände (AA) | ja | „Textabstände … bei 1280 px“ und „… bei 320 px“ je Seitentyp. **Behoben: M-1.** | bestanden |
| 1.4.13 | Inhalt bei Hover oder Fokus (AA) | ja | kein eigener Inhalt bei Hover oder Fokus; Belege öffnen erst auf Aktivierung (`details`); einzige `title`-Hinweise sind die des Browsers (ausgenommen) | bestanden |
| 2.1.1 | Tastatur (A) | ja | „Tab erreicht jedes Bedienelement …“ je Seitentyp und Zustand; Bedienung per Enter/Leertaste in `components.spec.ts` (Menü, Beleg), `topology.spec.ts` (Ausfallknöpfe), `geraete.spec.ts` (Filter), `contact.spec.ts` (Formular bis zur Danke-Seite) | bestanden |
| 2.1.2 | Keine Tastaturfalle (A) | ja | Tab-Folge verlässt jede Seite nach endlich vielen Schritten; Umschalt+Tab ergibt den Rückweg | bestanden |
| 2.1.4 | Tastaturkürzel (A) | nein | keine Kürzel aus einzelnen Zeichen | n. a. |
| 2.2.1 | Zeitbegrenzung anpassbar (A) | nein | keine Zeitbegrenzung; die Rückmeldung „Kopiert“ verschwindet nach 2 s, ist aber eine Statusmeldung ohne Handlungsbedarf | n. a. |
| 2.2.2 | Pausieren, Stoppen, Ausblenden (A) | nein | nichts bewegt, blinkt oder aktualisiert sich von selbst („Bewegung …“: höchstens 150 ms als Antwort auf eine Handlung) | n. a. |
| 2.3.1 | Drei Blitze (A) | nein | keine Blitze, keine Animation | n. a. |
| 2.4.1 | Bereiche überspringen (A) | ja | „Sprunglink …“: erster Halt, beim Fokus sichtbar und unverdeckt, führt zu `#inhalt`, nächster Tab ist das erste Bedienelement ab dem Hauptbereich (Chromium, Firefox); Landmarken. In WebKit nur bis zum Sprung geprüft (Phase 8). | bestanden; SR-Teil Phase 8 |
| 2.4.2 | Seite mit Titel (A) | ja | `pages.spec.ts` (Titel je Seite); Fehlerseite des Servers mit „Fehler: “ vor dem Titel (`contact.spec.ts`); 404 mit eigenem Titel | bestanden |
| 2.4.3 | Fokus-Reihenfolge (A) | ja | Lesereihenfolge geprüft (siehe 2.2); kein positives `tabindex`; nach Formularfehler Fokus auf der Zusammenfassung, nach Serverfehler auf der Meldung (`contact.spec.ts`, „Kontaktformular … Status …“) | bestanden |
| 2.4.4 | Linkzweck im Kontext (A) | ja | „Namen …“: kein Link ohne Namen, gleicher Name nur bei gleichem Ziel (je Seitentyp und Zustand); Knöpfe „30 Tage testen“ je Paket mit eigenem Namen („30 Tage testen: Essentials“) | bestanden |
| 2.4.5 | Mehrere Wege (AA) | ja | Hauptnavigation, Fußzeile mit allen Bereichen, Produktnavigation, Linkliste der 404-Seite, Sitemap | bestanden |
| 2.4.6 | Überschriften und Beschriftungen (AA) | ja | Baum gelesen: Überschriften beschreiben ihren Abschnitt, Felder ihren Inhalt mit „(Pflicht)“, Bereiche ihre Tabelle | bestanden |
| 2.4.7 | Fokus sichtbar (AA) | ja | jeder Tab-Halt mit Umriss ≥ 2 px und ≥ 3 : 1, beide Themen, 1280 und 390 px; im Modus erzwungene Farben ebenfalls | bestanden |
| 2.4.11 | Fokus nicht verdeckt (AA) | ja | Kopfzeile ist nicht fixiert (`design-system.md` §5); vorwärts und rückwärts bei 1280 und 390 px nie verdeckt; im Menü bei 400 % jedes Ziel unverdeckt; klebende Spalte der Matrix verdeckt kein fokussiertes Element (Rahmen scrollt das Ziel an den rechten Rand) | bestanden |
| 2.5.1 | Zeigergesten (A) | nein | keine Mehrpunkt- oder Pfadgesten; Scrollrahmen scrollen auch mit Tastatur und Scrollbalken | n. a. |
| 2.5.2 | Zeigerabbruch (A) | ja | alle Handlungen über `click` (Auslösung beim Loslassen), keine `mousedown`/`pointerdown`-Handler (`src/islands/*.ts` gelesen) | bestanden |
| 2.5.3 | Beschriftung im Namen (A) | ja | „Namen …“: jeder sichtbare Text steckt im zugänglichen Namen (z. B. „Kopieren“ in „Adresse kopieren“, „EN“ in „EN – English“) | bestanden |
| 2.5.4 | Bewegungsauslösung (A) | nein | keine Bedienung über Gerätebewegung | n. a. |
| 2.5.7 | Ziehbewegungen (AA) | ja | keine Funktion verlangt Ziehen; Scrollrahmen sind auch per Tastatur und Scrollbalken bedienbar | bestanden |
| 2.5.8 | Zielgröße Minimum (AA) | ja | „Zielgröße … (1280 px)“ und „(390 px)“ je Seitentyp, mit geöffnetem Menü; Bausteine ≥ 44 px (`components.spec.ts`), Beleg-Marke ≥ 24 px | bestanden |
| 3.1.1 | Sprache der Seite (A) | ja | `pages.spec.ts` (`lang` passend je Seite); 404 und 422 je Sprache | bestanden |
| 3.1.2 | Sprache von Teilen (AA) | ja | „Sprache …“: Sprachumschalter in Kopf, Menü und Fuß tragen `lang` und `hreflang` der anderen Sprache; keine Inhaltslinks in die andere Sprache ohne `lang`; nur gültige Werte. Englische Fachbegriffe im deutschen Text (Collector, Review-Inbox, Discovery, `powered_by`) sind Lehnwörter oder Bezeichner der App und brauchen kein `lang`. | bestanden; SR-Teil Phase 8 |
| 3.2.1 | Bei Fokus (A) | ja | Tab-Folge ohne Kontextwechsel (kein Halt löst Navigation oder Öffnen aus) | bestanden |
| 3.2.2 | Bei Eingabe (A) | ja | die Auswahl „Anliegen“ sendet nicht; der Filter wirkt erst auf Aktivierung eines Knopfs; Fokus bleibt auf dem Knopf („Gerätefilter …“) | bestanden |
| 3.2.3 | Einheitliche Navigation (AA) | ja | „Einheitliche Navigation und Hilfe …“: Kopf, Menü und Fuß auf jeder Seite einer Sprache mit denselben Zielen in derselben Reihenfolge | bestanden |
| 3.2.4 | Einheitliche Erkennung (AA) | ja | gleiche Funktion, gleicher Name (z. B. „Beleg“, „Kopieren“, „30 Tage testen“) über alle Seiten im Baum | bestanden |
| 3.2.6 | Einheitliche Hilfe (A) | ja | Kontakt, Live-Demo und Anmelden stehen auf jeder Seite in derselben Spalte der Fußzeile (Test wie 3.2.3) | bestanden |
| 3.3.1 | Fehlererkennung (A) | ja | Fehler als Text am Feld und in der Zusammenfassung, `aria-invalid`, mit und ohne JavaScript (`contact.spec.ts`, „Kontaktformular: Fehler mit JavaScript als role=alert …“, Schnappschüsse `kontakt-de-fehler.yml`, `kontakt-de-422.yml`) | bestanden; SR-Teil Phase 8 |
| 3.3.2 | Beschriftungen oder Anweisungen (A) | ja | sichtbare Beschriftungen mit „(Pflicht)“, Satz zu Pflichtfeldern über dem Formular, Hinweise („An diese Adresse antworten wir.“, „Höchstens 4.000 Zeichen.“) per `aria-describedby` | bestanden |
| 3.3.3 | Fehlerempfehlung (AA) | ja | Fehlertexte nennen die Abhilfe („… zum Beispiel name@example.com.“) | bestanden |
| 3.3.4 | Fehlervermeidung (AA) | nein | das Formular löst keine rechtliche, finanzielle oder Datenänderung aus (Anfrage, kein Vertrag) | n. a. |
| 3.3.7 | Redundante Eingabe (A) | ja | einstufiges Formular; bei der Fehlerseite des Servers bleiben alle Eingaben erhalten (`contact.spec.ts` „Eingabefehler: 422 …“) | bestanden |
| 3.3.8 | Barrierefreie Authentifizierung (AA) | nein | die Website hat keine Anmeldung; „Anmelden“ führt in die App (nicht Gegenstand) | n. a. |
| 4.1.2 | Name, Rolle, Wert (A) | ja | Baum und CDP: Umschaltknöpfe mit `pressed`, Belege als aufklappbare `summary` mit `expanded`, Filter mit `aria-pressed`, Felder mit Namen und `invalid`; „Namen …“ (kein Knopf ohne Namen, keine doppelten Knopfnamen) | bestanden; SR-Teil Phase 8 |
| 4.1.3 | Statusmeldungen (AA) | ja | „Statusmeldungen (4.1.3)“: Ergebniszeile der Simulation (`status`), Anzahl im Gerätefilter (`aria-live="polite"`), Kopieren (`status`), Senden des Formulars (`status`), Fehler (`alert` mit Fokus). **Behoben: M-2.** | bestanden; SR-Teil Phase 8 |

Gezählt: bestanden 41 (davon 6 mit SR-Teil in Phase 8: 1.3.1, 2.4.1, 3.1.2, 3.3.1, 4.1.2, 4.1.3), nicht anwendbar 14 (1.2.1–1.2.5, 1.4.2, 2.1.4, 2.2.1, 2.2.2, 2.3.1, 2.5.1, 2.5.4, 3.3.4, 3.3.8), Mangel offen 0, nicht prüfbar 0.

## 4. Gefundene und behobene Mängel

Jeder Mangel wurde zuerst durch einen fehlschlagenden Test in `tests/e2e/a11y-audit.spec.ts` gezeigt, dann behoben; der Test bleibt als Schutz.

| Nr. | Kriterium | Befund | Behebung | Test |
|---|---|---|---|---|
| M-1 | 1.4.12 mit 1.4.10 | Mit den Textabständen der WCAG passten bei 320 px lange Wörter in Abschnittstiteln nicht mehr in die Zeile und ragten bis 35 px über den Rand; die Seite scrollte waagerecht (Startseite „zusammenhängt“, Topologie „Ausfallsimulation“, Barrierefreiheit „Einschränkungen“). | `overflow-wrap: break-word` am `body` (`src/styles/base.css`): ein Wort, das nicht passt, bricht um; solange jedes Wort passt, ändert sich nichts. | „Textabstände … bei 320 px“ |
| M-2 | 4.1.3 | Beim Absenden des Kontaktformulars stand „Wird gesendet …“ nur im deaktivierten Knopf; Screenreader erfuhren davon nichts, der Fokus ging verloren. | Statuszeile `role="status"` (optisch verborgen) im Formular, die Insel füllt sie beim Senden und leert sie bei Fehler (`src/views/Contact.astro`, `src/islands/form.ts`). | „Kontaktformular de/en: „Wird gesendet“ wird als Status gemeldet …“ |
| M-3 | 1.3.1 | Tabellenzellen nur mit „–“ (Preise, Spalte „erstes Beta-Jahr“ bei Enterprise; Topologie, „durch Redundanz geschützt“): Screenreader lesen den Halbgeviertstrich in der Standardeinstellung meist nicht vor, die Zelle klingt leer. | Strich `aria-hidden`, daneben das Wort optisch verborgen: „entfällt“/„not applicable“ (Preise), „keines“/„none“ (Tabellen aus `DataTable`); neue Texte `ui().matrix.na` und `ui().matrix.none` (`src/i18n/*.ts`, `src/views/Pricing.astro`, `src/components/DataTable.astro`). `tests/e2e/preise.spec.ts` erwartet nun Strich und Wort. | „Struktur …“ (Prüfpunkt „Tabellenzelle nur mit Strich“) |
| M-4 | 1.4.1 | Der Link „Datenschutzerklärung“ / „Privacy policy“ im Hinweis unter dem Kontaktformular war nicht unterstrichen und vom Text daneben nur durch die Farbe zu unterscheiden. Ursache: Die Grundregeln von Tailwind setzen `text-decoration: inherit` und heben die Unterstreichung aus `base.css` auf. Eine Probe über alle Routen fand keinen weiteren Link im Fließtext. | `p a, .rt-placeholder a { text-decoration-line: underline; }` in `src/styles/base.css`. | „Links im Fließtext …“ |

## 5. Barrierefreiheitsbaum: Befunde

Gelesen wurden alle 20 Schnappschüsse in `docs/qa/a11y-snapshots/`.

### 5.1 Landmarken, Überschriften, Namen

- Jede Seite: genau ein `banner`, ein `main`, ein `contentinfo`; der Sprunglink steht vor dem Kopf. Navigationen heißen „Hauptnavigation“, „Hauptnavigation im Menü“ (nur schmal sichtbar), „Produkt“ (Produktseiten), „Zu einer Kategorie springen“ (Geräte ohne JavaScript), „Weiterführende Links“ (404); keine zwei gleich.
- Jeder Abschnitt ist ein benannter Bereich (`section` mit `aria-labelledby` auf seine Überschrift). Das ergibt viele Bereichs-Landmarken (Startseite: 12). Kein Verstoß; Screenreader-Nutzer, die per Landmarke springen, finden so jeden Abschnitt. In Phase 8 prüfen, ob die Menge stört (Hinweis H-3).
- Überschriften: eine `h1`, Abschnitte `h2`, darin `h3`; Fußzeile mit `h2` je Spalte. Keine übersprungene Ebene.
- Der Name eines Belegs lautet im Baum „Beleg : Titel“ (Chromium setzt um die optisch verborgene Ergänzung ein Leerzeichen). Vorgelesen wird „Beleg: Titel“ mit kurzer Pause; unschädlich.

### 5.2 Widgets

- **Ausfallsimulation:** Bereich „Ausfallsimulation“ mit dem fokussierbaren Rahmen „Schema einer Stromkette mit Ausfallsimulation“, darin das Bild mit Titel und Beschreibung; Gruppe „Ausfall simulieren“ mit neun Umschaltknöpfen (`pdu-a` gedrückt), Ergebniszeile als `status` („Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt). Durch Redundanz geschützt: srv-01, srv-02.“), Legende als Text. Der zugängliche Name des Bilds enthält Titel und Beschreibung zusammen (lang, Hinweis H-2).
- **Gerätefilter:** Gruppe „Kategorie“ mit fünf Umschaltknöpfen, Anzahl als Absatz mit `aria-live="polite"`, Tabelle mit Spaltenköpfen, Kategoriezeilen als `th scope="rowgroup"`, Hersteller als Zeilenkopf.
- **Preise:** Pakettabelle mit verborgenen Spaltenköpfen „Beschreibung und Handlung“ und „Belege“; Zeilenkopf nur der Paketname; Knöpfe „30 Tage testen: Essentials“ usw. Matrix: Wort statt Symbol („enthalten“, „nicht enthalten“, „unbegrenzt“). Bei 390 px meldet Chromium beide Tabellen weiter als Tabelle mit Kopf- und Datenzellen (CDP-Test); die sichtbaren Beschriftungen der gestapelten Zellen stehen nicht im Namen (`layout.spec.ts`).
- **Formular:** Felder mit Namen aus dem `label`, Hinweis und Fehler als Beschreibung, `invalid` am fehlerhaften Feld; Zusammenfassung als `alert` mit Links zu den Feldern; Fehlerseite des Servers gleich aufgebaut wie der Fehler mit JavaScript (Unterschied nur in den gemeldeten Fehlern); Statuszeile nach M-2 vorhanden.
- **Demo:** drei Knöpfe „Adresse kopieren“, „Benutzer kopieren“, „Passwort kopieren“, je mit eigener Statuszeile.

### 5.3 Kontrast: kleinster Wert je Seitentyp

| Seitentyp | Textstellen | kleinster Wert | Stelle |
|---|---|---|---|
| Startseite de/en | 374 | 5,86 | Kantenbeschriftung `powered_by` im Netzschema (`fg-subtle` auf `panel`) |
| Topologie de/en | 201 | 5,86 | wie oben |
| Geräte de/en, gefiltert | 187 / 103 | 6,36 | Markenhinweis (`fg-subtle` auf `canvas`) |
| Preise de/en | 280 | 5,86 | Strich „–“ der Matrix (zur Zierde, `aria-hidden`) |
| Demo de/en | 92 | 6,36 | Bildunterschrift |
| Kontakt (alle Zustände) | 63–72 | 6,36 | Hinweis am Feld |
| Impressum, Barrierefreiheit, Legal notice (Dokument) | 58 / 100 | 4,99 | Firmierung in der Fußzeile (`fg-subtle` auf `canvas`, laut Tabelle 5,0) |
| 404 de/en | 47 | 6,36 | Firmierung in der Fußzeile |

### 5.4 Tab-Halte je Seitentyp (Chromium, 1280 px)

Startseite 94, Topologie 71, Preise 64, Geräte 52, Demo 42, Kontakt 40 (mit Fehlern 44, Fehlerseite des Servers 43), Barrierefreiheit 39, 404 37, Impressum 32. Bei 390 px mit geöffnetem Menü je ein Halt mehr (Menüknopf).

## 6. Offene Punkte und Hinweise

Keiner der Punkte ist ein Verstoß gegen ein Kriterium der Stufe A oder AA nach dieser Prüfung.

| Nr. | Punkt | Vorschlag |
|---|---|---|
| H-1 | Fokussierbare Scrollrahmen (Tabellen, Netzschemata, Code) sind auch dann ein Tab-Halt, wenn sie bei breitem Fenster nicht scrollen. Kein Verstoß (2.4.3 bleibt gewahrt), aber zusätzliche Halte ohne Funktion. | Ohne JavaScript muss der Rahmen fokussierbar bleiben; mit JavaScript könnte eine kleine Insel `tabindex` nur bei Überlauf setzen. Entscheidung offen. |
| H-2 | Der Name des Netzschema-Bilds besteht aus Titel und Beschreibung (`aria-labelledby` auf beide). | Titel als Name, Beschreibung als `aria-describedby`; dann liest ein Screenreader erst den kurzen Namen. Nach dem Screenreader-Test in Phase 8 entscheiden. |
| H-3 | Viele Bereichs-Landmarken (jeder Abschnitt). | in Phase 8 mit NVDA (Taste D) und VoiceOver (Rotor „Orientierungspunkte“) beurteilen |
| H-4 | Links außerhalb des Fließtexts (Pflichtlinks der Fußzeile, Linkliste der 404-Seite, Sprungmarken der Geräte) sind nicht unterstrichen, obwohl `base.css` Unterstreichung vorsieht (Tailwind hebt sie auf). Kein Verstoß gegen 1.4.1, weil sie allein stehen. | Gestaltungsentscheidung für den Auftraggeber |
| H-5 | Fehlerzusammenfassung ist `role="alert"` und bekommt den Fokus; manche Screenreader lesen sie dann zweimal. | in Phase 8 prüfen; bei doppelter Ansage `role="alert"` entfernen und nur fokussieren |
| H-6 | Pflichtfelder: „(Pflicht)“ im Text und `required`; Screenreader sagen beides („Pflicht … erforderlich“). | hinnehmbar; in Phase 8 anhören |
| H-7 | Screenshots sind Platzhalter, Rechtstexte fehlen. | nach Lieferung Alternativtexte, Bildunterschriften, Überschriften und Sprache der Texte prüfen |
| H-8 | Kontaktweg für Hinweise zu Barrieren auf `/barrierefreiheit/` ist ein Platzhalter (`compliance-matrix.md` B-01). | vom Anbieter liefern lassen |
| H-9 | Firefox und WebKit wurden lokal nicht ausgeführt; die neuen Tests laufen dort erst in der CI. Bekannte Grenzen: erzwungene Farben, Baum und CDP nur in Chromium; Startpunkt nach dem Sprunglink in WebKit übersprungen; Auswahllisten zählen in WebKit nicht als Pflicht-Tab-Halt. | ersten CI-Lauf auswerten |

## 7. Anleitung für die Prüfung mit Screenreadern (Phase 8)

Hier nicht möglich: kein Windows, kein macOS, kein Android, keine Sprachausgabe. Die Prüfung erfolgt auf der Vorschau der Zielumgebung (Task 5) oder lokal mit `npm run build && npm run serve`.

### 7.1 Aufbau

| Kombination | Gerät | Einstellung |
|---|---|---|
| NVDA (aktuell) + Firefox (aktuell) | Windows 11 | Sprache Deutsch, Satzzeichen „einige“ (Standard), Fokusmodus automatisch |
| VoiceOver + Safari | macOS (aktuell) | Safari: Einstellungen › Erweitert › „Mit Tab-Taste jedes Objekt auf einer Webseite hervorheben“ an |
| VoiceOver + Safari | iPhone (aktuelles iOS) | Rotor mit „Überschriften“, „Orientierungspunkte“, „Tabellen“, „Formularsteuerelemente“ |
| TalkBack + Chrome | Android (aktuell) | Lesesteuerung mit „Überschriften“, „Steuerelemente“, „Links“ |

Je Kombination die deutsche Startseite, Preise, Geräte, Kontakt und eine englische Seite. Ergebnis je Schritt als „wie erwartet“ oder mit wörtlicher Ansage festhalten, Abweichungen als Mangel mit Seite, Schritt, Kombination.

### 7.2 Erwartete Ansagen

Wortlaute der Website sind verbindlich; die Rahmenwörter des Screenreaders („Schalter“, „Link“, „gedrückt“) unterscheiden sich je Produkt und Version und sind Beispiele.

**Seitenanfang und Sprache (alle Seiten)**
1. Seite laden: Titel, z. B. „Reticora – …“, dann Inhalt. Erste Tab-Taste: „Zum Inhalt, Link“. Enter, dann Tab: das erste Bedienelement im Hauptbereich (Startseite: „30 Tage testen, Link“). In Safari ausdrücklich prüfen (Abschnitt 6, H-9).
2. Sprachumschalter im Kopf (breites Fenster): „Sprache, Gruppierung“, „DE“ (aktuell), „EN – English, Link“ **mit englischer Stimme** (`lang="en"`). Fußzeile: „English, Link“ englisch. Auf englischen Seiten umgekehrt: „DE – Deutsch“ mit deutscher Stimme.
3. Landmarkenliste (NVDA: NVDA+F7 › Orientierungspunkte; VoiceOver: Rotor): Banner, Hauptnavigation, Hauptbereich mit den Abschnitten, Inhaltsinformationen. Keine Navigation ohne Namen.

**Ausfallsimulation (Startseite, `/produkt/topologie-impact/`)**
1. Mit Tab zum Schema: „Schema einer Stromkette mit Ausfallsimulation, Bereich“ (fokussierbarer Rahmen), danach „Ausfall simulieren, Gruppierung, usv-01, Umschalter, nicht gedrückt“.
2. Weiter zu „pdu-a, Umschalter, gedrückt“. Leertaste: „nicht gedrückt“, danach von selbst (höflich, ohne den Fokus zu verlassen): „Wählen Sie ein CI, um seinen Ausfall zu simulieren.“
3. Zurück zu „usv-01“, Leertaste: „gedrückt“, dann „Fällt „usv-01“ aus, sind 8 weitere CIs betroffen (grau dargestellt).“
4. „usv-01“ wieder aus, „vm-db-01“ an: „Fällt „vm-db-01“ aus, ist kein weiteres CI betroffen.“
5. Pass: Jede Änderung wird genau einmal angesagt, der Fokus bleibt auf dem Knopf. Mangel: keine Ansage, doppelte Ansage, Ansage erst nach Verlassen des Knopfs.
6. Ohne Maus auf dem Telefon (VoiceOver/TalkBack): Wischen erreicht dieselben Knöpfe; Doppeltippen schaltet; Ergebniszeile wird angesagt.

**Beleg (überall, z. B. Startseite unter „So entsteht Ihr Bestand“)**
1. Fokus auf die Marke: „Beleg: Nur ausgehende Verbindungen, Schalter, reduziert“ (NVDA) bzw. „Beleg: …, reduziert, Offenlegungsdreieck“ (VoiceOver).
2. Enter/Leertaste: „erweitert“; weiterlesen (NVDA Pfeil runter, VoiceOver VO+Pfeil rechts): Titel, dann Belegtext. Erneut Enter: „reduziert“.
3. Pass: Zustand wird angesagt, Inhalt folgt direkt auf die Marke.

**Gerätefilter (`/geraete/`)**
1. Tab: „Kategorie, Gruppierung, Alle, Umschalter, gedrückt“.
2. Tab zu „Storage, Umschalter, nicht gedrückt“, Leertaste: „gedrückt“, danach höflich „4 Gerätefamilien“. „Alle“: „31 Gerätefamilien“.
3. Tabellennavigation (NVDA Strg+Alt+Pfeile, VoiceOver VO+Befehl+T bzw. Rotor „Tabellen“): „Gerätefamilien mit Hersteller und Protokollen, Bereich, Tabelle mit 3 Spalten“; Spaltenköpfe werden beim Spaltenwechsel genannt („Familie, …“), Kategorien als Zeilengruppe.

**Preise, gestapelte Tabelle (`/preise/` bei Telefonbreite oder Zoom ≥ 250 %)**
1. iPhone, Rotor „Tabellen“: „Pakete, Preise und Limits, Tabelle, 9 Spalten, 6 Zeilen“ (oder ähnlich). Bleibt die Ansage „Tabelle“ bei der gestapelten Darstellung aus, ist das ein Mangel (WebKit kann Tabellensemantik bei `display: block` verwerfen; dann `role="table"`/`row`/`cell` setzen).
2. In der Zeile „Essentials“: „Zeilenkopf Essentials“; Zelle „im Monat, 49 €“ (Spaltenkopf vor dem Wert, **einmal**, nicht zusätzlich die sichtbare Beschriftung). Zelle „erstes Beta-Jahr“ bei Enterprise: „entfällt“ (nicht leer, nicht „Strich“).
3. Knopf: „30 Tage testen: Essentials, Link“. Matrix: „DATEV-Export, Essentials, nicht enthalten“.
4. Beleg in der Matrix (Spalte „Enterprise Local“, Zeile „Dokumentenspeicher“): aufklappen, der Text bleibt im Scrollrahmen lesbar.

**Kontaktformular mit JavaScript (`/kontakt/`)**
1. Felder: „Name (Pflicht), Eingabefeld, erforderlich“; „Geschäftliche E-Mail-Adresse (Pflicht), … An diese Adresse antworten wir.“ (Beschreibung); „Anliegen (Pflicht), Kombinationsfeld, Bitte wählen“.
2. Leer absenden: „Wird gesendet …“ (Statuszeile, M-2), dann Fokus und Ansage „Bitte korrigieren Sie 4 Angaben.“ mit Liste. Pass: die Zusammenfassung wird einmal gelesen (H-5).
3. Ersten Fehlerlink aktivieren: Fokus im Feld „Name (Pflicht), Eingabefeld, ungültig, erforderlich, Bitte geben Sie Ihren Namen an.“
4. Verbindung trennen (Netz aus) und senden: „Wird gesendet …“, dann Fokus auf die Meldung mit dem direkten Kontakt.
5. Korrekt ausfüllen und senden: „Wird gesendet …“, dann die Danke-Seite mit Titel.

**Fehlerseite des Servers (ohne JavaScript)**
1. Firefox: `about:config` › `javascript.enabled` aus (oder Erweiterung), Formular mit „keine-adresse“ als E-Mail absenden.
2. Erwartet: Titel „Fehler: Kontakt – Reticora“ wird angesagt; die Seite hat dieselben Felder mit den Eingaben; die Zusammenfassung steht über dem Formular („Bitte korrigieren Sie … Angaben.“), ihre Links springen zu den Feldern; am Feld „ungültig“ mit Fehlertext.

**Kopierknöpfe (`/demo/`)**
1. „Adresse kopieren, Schalter“. Enter: höflich „Kopiert“, Fokus bleibt.

### 7.3 Ergänzende Prüfungen in Phase 8

- Windows Kontrastmodus („Kontrastdesigns“, z. B. „Wüste“ und „Nachthimmel“): Knöpfe, Felder, Fokus, Netzschema (ausgefallen und betroffen unterscheidbar), Belege.
- Browserzoom 200 % und 400 % in Firefox und Safari auf echten Geräten; Textgröße „sehr groß“ auf iOS und Android.
- Sprachsteuerung (Windows-Sprachzugriff oder macOS Sprachsteuerung): „Klicke 30 Tage testen“, „Klicke pdu-a“, „Klicke Beleg“ wirken (Beschriftung im Namen).
