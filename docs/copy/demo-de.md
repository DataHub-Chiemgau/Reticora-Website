# Texte der Seite „Live-Demo“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/demo/` |
| Regeln | `content-plan.md` §2, §6 (Live-Demo); Zugangsdaten nur aus `src/data/links.ts` (`LINKS`) |

Die Zugangsdaten stehen nie im Text, sondern kommen aus `LINKS.demo`,
`LINKS.demoUser` und `LINKS.demoPassword`. Die Bezeichnungen der App
(„Topologie“, „Ausfall simulieren“, „Betroffene CIs“, „Durch Redundanz
geschützt“, „Review-Inbox“) folgen `content-plan.md` §6.3.

## Kopf der Seite

- **Titel im Browser:** Live-Demo – Reticora ausprobieren
- **Beschreibung:** Öffnen Sie die Demo von Reticora mit dem gemeinsamen
  Zugang. Drei Dinge zum Ausprobieren: Ausfall simulieren, Herkunft ansehen,
  Review entscheiden.

## Einstieg

- **Überschrift (h1):** Live-Demo
- **Vorspann:** Die Demo ist eine eigene Instanz von Reticora mit
  Beispieldaten. Sie brauchen kein Konto: Melden Sie sich mit dem Zugang
  unten an und probieren Sie aus, was Sie interessiert.

## 1. Zugang

- **Überschrift:** Zugang zur Demo
- **Kennwertliste** mit Kopierknopf je Zeile:

| Bezeichnung | Wert |
|---|---|
| Adresse | `LINKS.demo` |
| Benutzer | `LINKS.demoUser` |
| Passwort | `LINKS.demoPassword` |

- **Kopierknopf:** Beschriftung „Kopieren“, nach dem Klick „Kopiert“;
  zugänglicher Name „{Bezeichnung} kopieren“. Ohne JavaScript entfallen die
  Knöpfe; die Werte bleiben markierbar.
- **Hinweis** (Hinweisband, über dem Knopf): **Gemeinsames Konto.** Alle
  Besucher der Demo nutzen dasselbe Konto und sehen, was andere eintragen.
  Geben Sie keine echten Daten ein: keine Namen, keine Adressen, keine
  Zugangsdaten, nichts aus Ihrem Netz oder dem Ihrer Kunden.
- **Knopf:** „Demo öffnen“ (Hauptknopf) → `LINKS.demo`

## 2. Drei Dinge zum Ausprobieren

- **Überschrift:** Drei Dinge zum Ausprobieren

### 2.1 Einen Ausfall simulieren

- **Titel:** Einen Ausfall simulieren
- **Text:** Öffnen Sie „Topologie“, wählen Sie eine PDU oder USV und klicken
  Sie „Ausfall simulieren“. Grau dargestellt sind die betroffenen CIs.
  Server, die an zwei Stromwegen hängen, stehen unter „Durch Redundanz
  geschützt“. Wählen Sie ein zweites CI dazu und sehen Sie, wie sich das Bild
  ändert. [C-09]
- **Abbildung:** S-06, „Abb. 1 · Ausfallsimulation in der Topologie.“

### 2.2 Die Herkunft eines Feldes ansehen

- **Titel:** Die Herkunft eines Feldes ansehen
- **Text:** Öffnen Sie ein CI und dort die Herkunft eines Feldes, etwa der
  Seriennummer. Sie sehen Quelle, Rang, Zeitpunkt der Beobachtung und warum
  dieser Wert gilt. [C-03]
- **Abbildung:** S-02, „Abb. 2 · Herkunft eines Feldes in der CI-Ansicht.“

### 2.3 Ein Review entscheiden

- **Titel:** Ein Review entscheiden
- **Text:** Öffnen Sie die Review-Inbox und wählen Sie einen Eintrag.
  Beobachtung und CI stehen nebeneinander. Entscheiden Sie: zusammenführen,
  neu anlegen, übernehmen oder verwerfen. [C-30]
- **Abbildung:** S-03, „Abb. 3 · Review-Inbox: Beobachtung und CI im
  Vergleich.“

## Abschluss

- **Überschrift:** Lieber mit Ihrem eigenen Netz?
- **Text:** Im Test verbinden Sie einen Collector mit Ihrem Netz und sehen
  Ihre eigenen Geräte, 30 Tage im Standard-Umfang bis 100 CIs. [C-22]
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Kontakt“
- **Zeile darunter:** Angebot nur für Unternehmen.
