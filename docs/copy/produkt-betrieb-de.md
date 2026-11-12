# Texte der Seite „Betrieb“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/produkt/betrieb/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4; Wörter der App nach `content-plan.md` §6.3 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Ab welchem Paket eine Funktion enthalten ist, steht in Klammern
dahinter (Paketmatrix `FEATURES` in `src/data/pricing.ts`).

## Kopf der Seite

- **Titel im Browser:** Betrieb – Tickets, SLAs, Monitoring, Workflows
- **Beschreibung:** Tickets mit SLA und Geschäftskalender am betroffenen CI,
  Monitoring mit Alarmregeln, Workflows und Formulare, Wartungsfenster mit den
  betroffenen Kunden.

## Einstieg

- **Überschrift (h1):** Störung, Ticket, Wartung: am CI, nicht daneben.
- **Vorspann:** Service-Desk und Netzbetrieb arbeiten auf demselben Bestand
  wie die Discovery. Ein Ticket kennt sein CI, ein Alarm sein Gerät, ein
  Wartungsfenster seine Kunden.
- **Knöpfe:** „Live-Demo“ (Hauptknopf), „30 Tage testen“

## 1. Tickets mit SLA

- **Überschrift:** Tickets mit SLA
- **Text:** Jedes Ticket hat eine Nummer, die in Ihrer Organisation eindeutig ist,
  einen Bezug auf das betroffene CI oder ein anderes Objekt und Anhänge. Aus
  einem Review legen Sie direkt ein Ticket an, wenn die Klärung
  Arbeit vor Ort braucht. [C-62] SLAs rechnen mit einem Geschäftskalender,
  den Sie für die Organisation oder für einzelne Kunden festlegen
  (ab Standard). [C-37, C-62]
- **Abbildung:** S-11, „Abb. 1 · Ticket mit SLA.“

## 2. Monitoring und Alarmregeln

- **Überschrift:** Monitoring und Alarmregeln
- **Text:** Der Collector liest Erreichbarkeit, Interface-Zähler sowie die
  Werte von USVs und PDUs mit aus. Reticora zeigt sie als Verlauf am CI und
  bewahrt sie 400 Tage auf. [C-63] Eine Alarmregel nennt Metrik, Bedingung,
  Schwellwert, Dauer und Schweregrad. Löst sie aus, entsteht ein Ticket, ein Webhook
  oder eine Benachrichtigung (ab Pro). [C-64] Benachrichtigungen gehen per
  E-Mail, mit Ruhezeiten, Sammelmeldung und Entdoppelung. [C-90]
- **Abbildung:** S-12, „Abb. 2 · Monitoring: Metriken und Alarmregeln.“

## 3. Workflows und Formulare

- **Überschrift:** Workflows und Formulare
- **Text:** Wiederkehrende Abläufe bauen Sie im Klick-Builder, ohne zu
  programmieren. Ein Workflow startet bei einem Ereignis, von Hand oder nach
  Zeitplan, und führt Aktionen aus: Ticket anlegen, Webhook senden,
  benachrichtigen, ein Feld setzen, eine Genehmigung einholen. Was ein
  Workflow schreibt, trägt die Herkunft „Workflow“ mit Rang 92 und lässt
  Ihre Overrides stehen. Formulare sind versioniert und blenden Felder je nach
  Antwort ein oder aus (ab Pro). [C-65]
- **Beispiele** (Einsatzzwecke aus der Produktbeschreibung, keine
  Kundenprojekte):

| Ablauf | Bausteine | Claim |
|---|---|---|
| Übergabe eines Geräts | Formular, Unterschrift, Feld setzen | C-65 |
| Bestellung genehmigen | Formular, Genehmigung, Ticket | C-65 |
| Wartung ankündigen | Zeitplan, Benachrichtigung | C-65 |

## 4. Wartungsfenster

- **Überschrift:** Wartungsfenster
- **Text:** Ein Wartungsfenster hat Beginn, Ende und die CIs, an denen
  gearbeitet wird. Reticora leitet daraus ab, welche Kunden betroffen sind.
  Vorher lassen Sie die CIs in der Ausfallsimulation gemeinsam ausfallen und
  sehen, was mit ausfällt und was die Redundanz trägt. [C-66, C-09]
- **Verweis:** „Ausfallsimulation“ → `/produkt/topologie-impact/`

## Abschluss

- Abschlussband wie auf allen Seiten: „30 Tage testen“ (Hauptknopf),
  „Live-Demo“, „Kontakt“; darunter „Angebot nur für Unternehmen.“
