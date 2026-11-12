# Texte der Seite „Topologie und Impact“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/produkt/topologie-impact/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4; `design-system.md` §6 für das Netzschema |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg.

## Kopf der Seite

- **Titel im Browser:** Topologie und Ausfallsimulation – Reticora
- **Beschreibung:** Topologie aus LLDP, Racks mit Vorder- und Rückseite,
  Stromkette bis zur USV und eine Ausfallsimulation, die Redundanz von Strom
  und Cluster kennt.

## Einstieg

- **Überschrift (h1):** Was hängt woran, und was fällt mit aus?
- **Vorspann:** Reticora leitet aus den Beobachtungen ab, wie Ihre Geräte
  verbunden und versorgt sind. Daraus rechnet die Ausfallsimulation, welche
  CIs, Kunden und Standorte ein Ausfall trifft. [C-31, C-52]
- **Knöpfe:** „Live-Demo“ (Hauptknopf), „30 Tage testen“
- **Netzschema:** nach `design-system.md` §6, Ausgangszustand `pdu-a`
  ausgefallen, mit den Umschaltknöpfen unter der Gruppenbezeichnung „Ausfall
  simulieren“ und der Ergebniszeile in den festen Sätzen aus §6.4. Legende:
  „Schemazeichnung, kein Screenshot“. [C-09, C-50]

## 1. Topologie als Graph

- **Überschrift:** Topologie als Graph
- **Text:** Meldet ein Gerät über LLDP einen Nachbarn, entsteht eine
  Beziehung `connected_to`. [C-31] Dazu kommen die Abhängigkeiten zwischen
  CIs: was worauf läuft, was wovon Strom bekommt, was zu einem Cluster gehört.
  Die Topologie zeigt alles als Graph; die Farbe eines Punktes steht für den
  Status des CIs. Bis 2.000 Knoten sehen Sie das ganze Netz; darüber wählen
  Sie zuerst einen Standort oder Typ. [C-55]
- **Abbildung:** S-04, „Abb. 1 · Topologie: CIs als Graph, die Farbe zeigt
  den Status.“

## 2. Ausfallsimulation mit Redundanz

- **Überschrift:** Ausfallsimulation mit Redundanz
- **Text:** Wählen Sie ein CI oder mehrere und lassen Sie sie ausfallen.
  Reticora folgt den Beziehungen und zeigt, was betroffen ist. Strom
  (`powered_by`) und Cluster (`member_of_cluster`) gelten als redundant: Ein
  Server mit zwei Netzteilen an zwei PDUs fällt erst aus, wenn beide PDUs
  ausfallen. Bei `hosted_on`, `runs_on` und `depends_on` genügt ein
  ausgefallener Versorger. [C-09, C-50]
- **Beispiel** (dieselben neun CIs wie im Netzschema):

| Ausfall | betroffen | durch Redundanz geschützt |
|---|---|---|
| `pdu-a` | `sw-access-01` | `srv-01`, `srv-02` |
| `pdu-a` und `pdu-b` | beide Server, Switch, NAS, beide VMs (6) | – |
| `usv-01` | beide PDUs und alles dahinter (8) | – |
| `srv-01` | `vm-app-01` | – |

- **Abbildung:** S-06, „Abb. 2 · Ausfallsimulation in der Topologie.“

## 3. Wer ist betroffen: CIs, Kunden, Standorte, Services

- **Überschrift:** Wer ist betroffen
- **Text:** Die Auswirkungsanalyse nennt nicht nur Geräte. Sie listet die
  betroffenen CIs, Kunden, Standorte und Services und zeigt, welches CI für
  einen Service ein Single Point of Failure ist. [C-52] Was nur über eine
  Netzverbindung (`connected_to`) erreicht wird, führt sie getrennt als
  „möglicherweise betroffen“: Ob der Ausfall diese CIs trifft, ist nicht
  sicher, und sie zählen nicht mit. [C-50] Für ein Wartungsfenster rechnen
  Sie mehrere CIs auf einmal. [C-66]
- **Verweis:** „Wartungsfenster im Betrieb“ → `/produkt/betrieb/`

## 4. Die Stromkette bis zur Quelle

- **Überschrift:** Die Stromkette bis zur Quelle
- **Text:** Reticora bildet die Versorgung als Kette ab: Gerät, PDU, USV,
  Quelle. [C-51] So beantwortet die Ausfallsimulation auch Fragen wie „Was
  bleibt an, wenn USV B gewartet wird?“. Die Werte von USVs und PDUs liest der
  Collector selbst aus und zeigt sie als Verlauf am CI. [C-01, C-63]

## 5. Herkunft und Prüfstatus jeder Beziehung

- **Überschrift:** Herkunft und Prüfstatus jeder Beziehung
- **Text:** Auch Beziehungen haben eine Herkunft. Jede trägt ihre Quelle,
  eine Konfidenz und einen Prüfstatus: ungeprüft oder bestätigt. Eine
  Nachbarschaft aus LLDP hat die Konfidenz 1,0. Fehlt LLDP, nutzt Reticora die
  Weiterleitungstabelle des Switches mit 0,6. Unbestätigte Kanten aus der
  Discovery verschwinden nach
  7 Tagen oder dem Fünffachen des Scope-Intervalls, je nachdem, was länger
  ist. Kanten, die Sie von Hand anlegen, löscht die Discovery nie; Kanten,
  die Sie entfernen, legt sie nicht wieder an. [C-53]

## 6. Racks mit Vorder- und Rückseite

- **Überschrift:** Racks mit Vorder- und Rückseite
- **Text:** Die Rack-Ansicht zeigt die Belegung je Höheneinheit, auf der
  Vorder- und der Rückseite. Beim Einbau prüft Reticora, ob das Gerät in die
  Höhe passt und ob der Platz auf dieser Seite frei ist. [C-10, C-54]
- **Abbildung:** S-05, „Abb. 3 · Rack, Vorderseite.“

## Abschluss

- Abschlussband wie auf allen Seiten: „30 Tage testen“ (Hauptknopf),
  „Live-Demo“, „Kontakt“; darunter „Angebot nur für Unternehmen.“
