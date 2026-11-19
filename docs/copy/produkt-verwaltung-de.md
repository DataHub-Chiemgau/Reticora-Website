# Texte der Seite „Verwaltung“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/produkt/verwaltung/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4; Wörter der App nach `content-plan.md` §6.3 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Ab welchem Paket eine Funktion enthalten ist, steht in der
Paketmatrix (`src/data/pricing.ts`, `FEATURES`) und in Klammern dahinter.

## Kopf der Seite

- **Titel im Browser:** Verwaltung – Assets, Lager, Inventur, Verträge
- **Beschreibung:** Assets mit Zuweisung und Unterschrift, Lager bis zum
  Fach, Inventur per Barcode, Verträge und Dokumente – auf demselben Bestand
  wie Ihre CMDB.

## Einstieg

- **Überschrift (h1):** Kaufmännische Daten am selben Gerät wie die
  technischen.
- **Vorspann:** Die Discovery weiß, was im Netz läuft. Die Verwaltung weiß,
  was es gekostet hat, wer es hat und wo der Ersatz liegt. In Reticora ist das
  ein Bestand, nicht zwei Listen.
- **Knöpfe:** „Live-Demo“ (Hauptknopf), „30 Tage testen“

## 1. Asset und CI: getrennt und verknüpft

- **Überschrift:** Asset und CI: getrennt und verknüpft
- **Text:** Das CI beschreibt, was ein Gerät im Netz tut. Das Asset
  beschreibt das physische Stück: Seriennummer, Standort, Lebenszyklus,
  Kaufdaten. Beide sind getrennt und lassen sich verknüpfen. Was das Asset
  führt, zeigt das CI nur an. Meldet die Discovery eine andere Seriennummer
  als das Asset, entsteht ein Review statt einer stillen Änderung.
  [C-56, C-35, C-49]
- **Abbildung:** S-09, „Abb. 1 · Asset mit Zuweisung.“

## 2. Zuweisung, Reservierung, Entsorgung

- **Überschrift:** Zuweisung, Reservierung, Entsorgung
- **Text:** Sie weisen ein Asset einer Person oder einem Team zu und
  lassen die Übergabe unterschreiben (ab Standard). Sie reservieren Geräte vorab und dokumentieren am Ende die Entsorgung nach DIN 66399.
  [C-61, C-35]

## 3. Lager bis zum Fach

- **Überschrift:** Lager bis zum Fach
- **Text:** Lager gliedern sich in Lager, Zone, Regal und Fach. Für
  Mengenartikel wie Patchkabel oder Transceiver führt Reticora den Bestand je
  Fach und warnt am Mindestbestand. Jede Bewegung – Eingang, Umlagerung,
  Zuweisung, Rückgabe, Reparatur, Entsorgung – steht in einer Historie, die sich nicht nachträglich ändern lässt.
  [C-57, C-36] Interne Bestellungen genehmigt eine zweite Person (ab Pro).
  [C-58]

## 4. Inventur mit Barcode

- **Überschrift:** Inventur mit Barcode
- **Text:** Sie drucken Etiketten mit Barcode, starten eine Inventur und
  erfassen den Bestand per Scan. Reticora zeigt die Differenzen zum Soll; mit
  dem Abschluss ist die Inventur festgeschrieben (ab Standard). [C-59, C-36]
- **Abbildung:** S-10, „Abb. 2 · Inventur.“

## 5. Verträge und Dokumente

- **Überschrift:** Verträge und Dokumente
- **Text:** Lieferanten und Verträge hängen am Bestand; vor dem Ablauf eines
  Vertrags warnt Reticora. [C-61] Dokumente – Lieferscheine, Garantien,
  Übergabeprotokolle – haben Versionen und lassen sich mit CIs, Assets,
  Zuweisungen, Tickets, Standorten, Inventuren und Entsorgungen verknüpfen.
  Jede neue Version wird vor dem ersten Download auf Schadsoftware geprüft;
  bis dahin ist der Download gesperrt. [C-60]
- **Kennwerte:**

| Paket | Dokumentenspeicher | Claim |
|---|---|---|
| Essentials | 1.000 MiB | C-60 |
| Standard | 10.000 MiB | C-60 |
| Pro | 50.000 MiB | C-60 |
| Enterprise | unbegrenzt | C-60 |

## 6. Export für die Buchhaltung

- **Überschrift:** Export für die Buchhaltung
- **Text:** Für die Buchhaltung exportiert Reticora im DATEV-Format
  (ab Standard). Der CSV-Export enthält nur die Felder, die die exportierende
  Person sehen darf. [C-11, C-74]

## Abschluss

- Abschlussband wie auf allen Seiten: „30 Tage testen“ (Hauptknopf),
  „Live-Demo“, „Kontakt“; darunter „Angebot nur für Unternehmen.“
