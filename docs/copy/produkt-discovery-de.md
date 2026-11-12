# Texte der Seite „Discovery“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/produkt/discovery/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4; Wörter der App nach `content-plan.md` §6.3 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Die Bausteine stehen in `design-system.md` §5.

## Kopf der Seite

- **Titel im Browser:** Discovery – so liest Reticora Ihr Netz aus
- **Beschreibung:** Ein Collector in Ihrem Netz erfasst Geräte über SNMP,
  SSH und Redfish und verbindet sich nur nach außen. Sweep alle 24 h,
  Abfrage alle 15 min.

## Einstieg

- **Überschrift (h1):** Ihr Bestand entsteht aus Ihrem Netz, nicht aus einer
  Tabelle.
- **Vorspann:** Ein Collector in Ihrem Netz findet die Geräte, fragt sie
  über SNMP, SSH und Redfish ab und liefert die Ergebnisse an Reticora. Sie
  legen fest, welche Netze er durchsucht. [C-01]
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Live-Demo“
- **Betriebsleiste:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Sweep | alle 24 h | C-26 |
| Poll | alle 15 min, ab 5 min einstellbar | C-26 |
| Puffer | bis 24 h | C-27 |
| Verbindung | nur ausgehend · 443, 4222 | C-02 |

## 1. Der Collector in Ihrem Netz

- **Überschrift:** Der Collector in Ihrem Netz
- **Text:** Sie installieren den Collector als Docker-Image, als virtuelle
  Maschine (OVA) oder mit dem Windows-Installer. [C-28] Bei der ersten
  Verbindung geben Sie einen Enrollment-Code ein, der 24 Stunden gilt. Der
  Collector erhält damit ein eigenes Zertifikat für 90 Tage und erneuert es
  selbst. [C-41] Jede Verbindung baut er nach außen auf: HTTPS auf Port 443
  und NATS mit mTLS auf Port 4222. In Ihrem Netz brauchen Sie keine
  eingehende Regel, kein VPN und keine Portweiterleitung. [C-02, C-77]
- **Kennwerte:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Auslieferung | Docker-Image, OVA, Windows-Installer | C-28 |
| Enrollment-Code | gilt 24 h, nur einmal | C-41 |
| Zertifikat | 90 Tage, erneuert sich ab 60 % der Laufzeit | C-41 |
| Lebenszeichen | alle 60 s; offline nach 5 min ohne Meldung | C-42 |
| Updates | nur signiert, Kanäle stable und beta, mit Rollback | C-42 |

- **Abbildung:** Schemazeichnung „Verbindungsrichtung“ wie auf der
  Startseite. Unterschrift: „Abb. 1 · Der Collector verbindet sich nach
  außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung.“ [C-02]

## 2. Scopes: Sie bestimmen, was durchsucht wird

- **Überschrift:** Scopes: Sie bestimmen, was durchsucht wird
- **Text:** Nach dem Enrollment meldet der Collector die Netze, in denen er
  steht, und schlägt sie als Scopes vor. Jeder Vorschlag erscheint als Review
  in der Review-Inbox; erst wenn Sie ihn bestätigen, wird durchsucht.
  [C-29, C-49] Ein Scope legt CIDR, einzelnen Host oder Adressbereich samt
  VRF fest, dazu Zeitplan, Zugangsdaten und Plugins. [C-43] Weil Subnetze je
  VRF eindeutig sind, dürfen sich Adressbereiche in verschiedenen VRFs
  überschneiden. [C-85]
- **Abbildung:** S-07, „Abb. 2 · Discovery: Scopes und Status der
  Collectors.“
- **Zweite Abbildung:** S-08, „Abb. 3 · Erste Schritte: Registrierung,
  Verifikation, Collector verbinden, Scopes bestätigen, erste CIs.“

## 3. Sweep und Abfrage: welche Protokolle wofür

- **Überschrift:** Sweep und Abfrage: welche Protokolle wofür
- **Text:** Der Sweep findet, was in einem Scope erreichbar ist. Danach
  fragt der Collector jedes Gerät über das Protokoll ab, das zu ihm passt.
  Alle diese Abfragen bleiben in Ihrem Netz; nach außen geht nur das
  Ergebnis. [C-39, C-01, C-77]
- **Tabelle:**

| Protokoll | Einsatz | Claim |
|---|---|---|
| ICMP, ARP, Reverse-DNS | Sweep: erreichbare Adressen und ihre Namen; ICMP mit höchstens 256 parallelen Anfragen | C-39 |
| Ports 22, 80, 443, 623, 5985, 8006 | Sweep, auf Wunsch: Hinweis auf SSH, Weboberfläche, BMC, WinRM und Proxmox | C-39 |
| SNMP v2c und v3 | Switches, Router, Firewalls, Access Points, USVs, PDUs, NAS | C-01, C-08 |
| SSH | Linux, Proxmox VE, TrueNAS und Kommandos auf Netzwerkgeräten | C-01, C-08 |
| Redfish | Server-Controller: Dell iDRAC, HPE iLO, Lenovo XCC, Supermicro | C-01, C-08 |
| WMI, IPMI | ergänzend, wo die übrigen Wege nicht reichen | C-01 |
| NAS- und Strom-Plugins | Werte von NAS, USVs und PDUs | C-01 |

## 4. Klassifikation: Was ist das für ein Gerät?

- **Überschrift:** Klassifikation: Was ist das für ein Gerät?
- **Text:** Der Collector prüft jedes gefundene Gerät in fester Reihenfolge:
  zuerst die Antwort auf SNMP, dann Redfish, dann das Banner des Dienstes.
  Dazu nimmt er die Herstellerkennung der MAC-Adresse. Passt ein Profil,
  stehen Typ, Hersteller und Modell fest. Passt keines, legt Reticora ein
  generisches Gerät an und öffnet ein Review. Sie setzen den Typ, und nichts
  geht verloren. [C-40, C-91] Die Profile sind beschreibende Dateien; neue
  oder geänderte Profile lädt der Collector ohne neue Version. [C-88]
- **Verweis:** „Alle unterstützten Geräte“ → `/geraete/`

## 5. Takt, Puffer und was nicht mehr antwortet

- **Überschrift:** Takt, Puffer und was nicht mehr antwortet
- **Text:** Standardmäßig läuft der Sweep alle 24 Stunden, die Abfrage über
  SNMP und Redfish alle 15 Minuten; Sie können bis auf 5 Minuten
  heruntergehen. [C-26] Reißt die Verbindung ab, puffert der Collector bis zu
  24 Stunden und liefert danach in der ursprünglichen Reihenfolge nach. [C-27]
  Jeder Wert trägt den Zeitpunkt seiner Beobachtung, nicht den seiner
  Ankunft. [C-47] Ein CI, das seit dem Dreifachen des Scope-Intervalls nicht
  gesehen wurde, erhält den Status „unknown“; Reticora löscht es nicht. Von
  Hand angelegte CIs sind davon ausgenommen. [C-44]

## 6. Zugangsdaten

- **Überschrift:** Zugangsdaten
- **Text:** Zugangsdaten für SNMP, SSH und Redfish speichert Reticora
  verschlüsselt (AES-256-GCM). An den Collector gehen sie
  über den mTLS-Kanal und zusätzlich auf seinen Schlüssel verschlüsselt. Im
  Klartext existieren sie nur im Arbeitsspeicher, nie auf Datenträgern, in
  API-Antworten oder Logs. [C-13]
- **Verweis:** „Mehr zur Sicherheit“ → `/sicherheit/`

## Abschluss

- Abschlussband wie auf allen Seiten: „30 Tage testen“ (Hauptknopf),
  „Live-Demo“, „Kontakt“; darunter „Angebot nur für Unternehmen.“
