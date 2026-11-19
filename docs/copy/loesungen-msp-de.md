# Texte der Seite „Lösungen für MSPs“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/loesungen/msp/` |
| Regeln | `content-plan.md` §1, §6 (Arbeitssituationen, keine Fallstudien); `brand-strategy.md` §4 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Die Situationen sind typische Aufgaben eines Managed-Service-
Providers. Sie beschreiben, was das Produkt tut, und erzählen keine
Geschichte eines Kunden.

## Kopf der Seite

- **Titel im Browser:** Reticora für Managed-Service-Provider (MSP)
- **Beschreibung:** Neuen Kunden aufnehmen, Rechte je Kunde vergeben, gleiche
  Adressbereiche trennen, Verträge und SLAs im Blick: So arbeiten MSPs mit
  Reticora.

## Einstieg

- **Überschrift (h1):** Für MSPs: jeder Kunde getrennt, alle in einer CMDB.
- **Vorspann:** Organisation, Kunde, Standort: In Reticora arbeiten Sie für
  alle Kunden in einer Anwendung, und die Daten bleiben bis in die Datenbank
  getrennt. Vier Situationen aus dem Alltag zeigen, wie. [C-32, C-06]
- **Knöpfe:** „Live-Demo“ (Hauptknopf), „30 Tage testen“

Jede Situation hat dieselbe Form: Überschrift (die Situation), Text (so gehen
Sie vor), Kennzeile mit den Funktionen und Claims.

## 1. Ein neuer Kunde kommt dazu

- **Überschrift:** Ein neuer Kunde kommt dazu.
- **Text:** Sie legen den Kunden und seine Standorte an. Im Netz des Kunden
  installieren Sie einen Collector und geben den Enrollment-Code ein, der
  24 Stunden gilt. Der Collector verbindet sich nur nach außen; beim Kunden
  ist keine eingehende Regel in der Firewall nötig. [C-32, C-41, C-02, C-77]
  Er schlägt die Netze vor, in denen er steht; Sie bestätigen die Scopes, und
  die ersten CIs erscheinen beim richtigen Kunden. [C-29]
- **Funktionen:** Kunden und Standorte, Collector, Scopes
- **Abbildung:** S-18, „Abb. 1 · Der Arbeitsbereich: Organisation, Kunde,
  Standort.“

## 2. Ein Techniker betreut nur zwei Kunden

- **Überschrift:** Ein Techniker betreut nur zwei Kunden.
- **Text:** Sie geben ihm eine Rolle mit Geltungsbereich auf diese beiden
  Kunden; Rollen lassen sich auch auf Standorte oder Teams begrenzen. Er sieht
  dann nur deren Daten – in der Oberfläche, in der API, in der Suche und im
  Export. [C-33, C-84, C-93] Die Trennung erzwingt die Datenbank selbst, per
  Row-Level Security auf den Mandantentabellen. [C-06] Felder, die er nicht
  sehen soll, etwa Kaufpreise, blenden Sie über Feldrechte aus. [C-89]
- **Funktionen:** Rollen mit Geltungsbereich, Row-Level Security, Feldrechte
- **Abbildung:** S-17, „Abb. 2 · Berechtigungen.“

## 3. Zwei Kunden nutzen dasselbe private Netz

- **Überschrift:** Zwei Kunden nutzen dasselbe private Netz.
- **Text:** Beide Kunden haben `192.168.1.0/24`. Sie ordnen ihre Scopes
  verschiedenen VRFs zu; Subnetze sind je VRF eindeutig, also kommen sich die
  Adressen nicht in die Quere. [C-43, C-85] Geräte erkennt Reticora immer
  innerhalb eines Kunden: Ein Switch bei Kunde A wird nie mit einem Switch bei
  Kunde B zusammengeführt, auch wenn Name und Adresse gleich sind. [C-45]
- **Funktionen:** Scopes mit VRF, Identitätsabgleich je Kunde

## 4. Ein Kunde fragt nach Verträgen, Garantien und SLAs

- **Überschrift:** Ein Kunde fragt nach Verträgen, Garantien und SLAs.
- **Text:** Verträge und Lieferanten hängen am Bestand, Reticora warnt vor
  dem Ablauf. Rechnungen und Garantiebelege liegen als Dokumente am Asset.
  [C-61, C-60] SLAs rechnen mit dem Geschäftskalender dieses Kunden, nicht mit
  Ihrem. [C-62] Für den Kunden exportieren Sie eine CSV-Datei, die nur Felder
  enthält, die Sie sehen dürfen. [C-74]
- **Funktionen:** Verträge, Dokumente, SLAs, Export
- **Ergänzende Abbildung:** S-16, „Abb. 3 · Dashboard.“

## Abschluss

- **Überschrift:** Sehen Sie es sich mit Beispieldaten an.
- **Text:** Die Live-Demo zeigt Reticora mit Beispieldaten, ohne Konto.
  Oder testen Sie 30 Tage mit Ihrem eigenen Netz.
- **Knöpfe:** „Live-Demo“ (Hauptknopf), „30 Tage testen“, „Kontakt“
- **Zeile darunter:** Angebot nur für Unternehmen.
