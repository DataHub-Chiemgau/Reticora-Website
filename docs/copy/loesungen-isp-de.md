# Texte der Seite „Lösungen für ISPs“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/loesungen/isp/` |
| Regeln | `content-plan.md` §1, §6 (Arbeitssituationen, keine Fallstudien); `brand-strategy.md` §4 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Die Situationen sind typische Aufgaben im Netzbetrieb. Sie
beschreiben, was das Produkt tut, und erzählen keine Geschichte eines
Kunden.

## Kopf der Seite

- **Titel im Browser:** Reticora für Netzbetreiber (ISP)
- **Beschreibung:** Störung an der USV, geplanter Tausch, viele PoPs, ein
  Gerät aus der Reparatur: Wie Netzbetreiber diese Aufgaben mit Reticora
  erledigen.

## Einstieg

- **Überschrift (h1):** Für Netzbetreiber: Bestand, Abhängigkeiten und
  Ausfallfolgen an einem Ort.
- **Vorspann:** Vier Situationen aus dem Betrieb eines Netzes und wie
  Reticora dabei hilft. Sie beschreiben Funktionen des Produkts, keine
  Kundenprojekte.
- **Knöpfe:** „Live-Demo“ (Hauptknopf), „Kontakt“ (Anliegen „Enterprise“)

Jede Situation hat dieselbe Form: Überschrift (die Situation), Text (so gehen
Sie vor), Kennzeile mit den Funktionen und Claims.

## 1. Eine USV im PoP meldet eine Störung

- **Überschrift:** Eine USV im PoP meldet eine Störung.
- **Text:** Öffnen Sie die USV in der Topologie und simulieren Sie ihren
  Ausfall. Reticora folgt der Stromkette über die PDUs bis zu den Geräten und
  zeigt, welche CIs, Kunden und Standorte betroffen sind. Server mit zwei
  Netzteilen an getrennten Wegen stehen unter „Durch Redundanz geschützt“,
  solange der zweite Weg steht. [C-09, C-50, C-51, C-52] Aus der Analyse legen
  Sie ein Ticket am CI an; der Verlauf der USV-Werte steht im selben CI.
  [C-62, C-63]
- **Funktionen:** Ausfallsimulation, Auswirkungsanalyse, Stromkette, Tickets,
  Monitoring
- **Abbildung:** S-06, „Abb. 1 · Ausfallsimulation in der Topologie.“

## 2. Nächste Woche wird ein Aggregationsswitch getauscht

- **Überschrift:** Nächste Woche wird ein Aggregationsswitch getauscht.
- **Text:** Lassen Sie den Switch und alles, was mit ihm vom Netz geht,
  gemeinsam ausfallen. Die Auswirkungsanalyse nennt die betroffenen Kunden
  und Services und führt getrennt auf, was nur über eine Netzverbindung
  erreicht wird und deshalb möglicherweise betroffen ist. [C-52, C-50, C-66]
  Dann legen Sie ein Wartungsfenster mit diesen CIs an; die betroffenen
  Kunden leitet Reticora daraus ab. [C-66]
- **Funktionen:** Mehrfachausfall, Auswirkungsanalyse, Wartungsfenster

## 3. Viele PoPs, mehrere Hersteller, keine aktuelle Liste

- **Überschrift:** Viele PoPs, mehrere Hersteller, keine aktuelle Liste.
- **Text:** Setzen Sie in jedem PoP einen Collector ein. Er schlägt die
  Netze vor, in denen er steht, und Sie bestätigen die Scopes, je mit ihrer
  VRF; gleiche Adressbereiche in verschiedenen VRFs bleiben getrennt.
  [C-29, C-43, C-85] Profile für Cisco, Juniper, Arista, MikroTik, FortiGate,
  USVs und PDUs bringt der Collector mit; Unbekanntes erscheint als
  generisches Gerät in der Review-Inbox. [C-08, C-40] Das Paket Enterprise
  umfasst bis 50.000 CIs und beliebig viele Collectors. [C-21]
- **Funktionen:** Collector, Scopes mit VRF, Geräteprofile, Review-Inbox
- **Verweis:** „Unterstützte Geräte“ → `/geraete/`

## 4. Ein Switch wird gegen ein Ersatzgerät aus dem Lager getauscht

- **Überschrift:** Ein Switch wird gegen ein Ersatzgerät aus dem Lager
  getauscht.
- **Text:** Sie entnehmen das Ersatzgerät dem Lager und buchen das defekte
  als Bewegung „Reparatur“. [C-57] Meldet die Discovery das neue Gerät,
  ordnet Reticora es über die Schlüssel in fester Reihenfolge zu:
  Seriennummer, Hardware-UUID, MAC-Adressen, Management-IP mit sysObjectID.
  Wo Beobachtung und Asset nicht zusammenpassen, entsteht ein Review
  „Abweichende Seriennummer“; ein zweites CI legt Reticora nicht still an,
  und Sie entscheiden. [C-45, C-49, C-56]
- **Funktionen:** Lager, Identitätsabgleich, Review-Inbox, Asset

## Ergänzende Abbildung

- S-16, „Abb. 2 · Dashboard.“ Platz neben Situation 3.

## Abschluss

- **Überschrift:** Großer Bestand oder eigene Infrastruktur?
- **Text:** Enterprise Shared läuft in der Cloud auf getrennter
  Infrastruktur, Enterprise Local bei Ihnen, inklusive aller Arbeiten.
  [C-92] Schreiben Sie uns, wie Ihr Netz aufgebaut ist.
- **Knöpfe:** „Kontakt“ (Hauptknopf, Anliegen „Enterprise“), „Live-Demo“,
  „30 Tage testen“
- **Zeile darunter:** Angebot nur für Unternehmen.
