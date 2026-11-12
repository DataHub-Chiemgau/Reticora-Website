# Texte der Startseite (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – inhaltliche Freigabe durch den Auftraggeber ausstehend** |
| Regeln | `content-plan.md` §1, `brand-strategy.md` §4; Wörter der App nach `content-plan.md` §6.3 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Die Bausteine stehen in `design-system.md` §5.

## Kopf der Seite

- **Titel im Browser:** Reticora – die CMDB, die Ihr Netz selbst ausliest
- **Beschreibung:** CMDB für ISPs und Netzwerk-MSPs: Ein Collector liest Ihr
  Netz aus, jedes Feld zeigt Quelle und Zeitpunkt. Mit Topologie, Racks und
  Ausfallsimulation.

## 1. Einstieg

- **Überschrift (h1):** Die CMDB, die Ihr Netz selbst ausliest und jeden Wert
  belegt.
- **Vorspann:** Ein Collector in Ihrem Netz erfasst Switches, Router, Server,
  USVs und Storage. Reticora gleicht die Beobachtungen ab und zeigt zu jedem
  Feld Quelle und Zeitpunkt. Für ISPs und Netzwerk-MSPs.
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Live-Demo“
- **Zeile unter den Knöpfen:** Angebot nur für Unternehmen.
- **Netzschema:** nach `design-system.md` §6, Ausgangszustand `pdu-a`
  ausgefallen.
- **Betriebsleiste:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Sweep | alle 24 h | C-26 |
| Poll | alle 15 min | C-26 |
| Puffer | bis 24 h | C-27 |
| Verbindung | nur ausgehend · 443, 4222 | C-02 |
| Hosting | EU | C-07 |

## 2. So entsteht Ihr Bestand

- **Überschrift:** So entsteht Ihr Bestand
- **Vorspann:** Vom Collector bis zum geprüften Eintrag sind es fünf
  Schritte. Sie tippen dabei kein Gerät ab.
- **Schritte:**

| Nr. | Titel | Text | Claim |
|---|---|---|---|
| 1 | Collector verbinden | Sie installieren den Collector in Ihrem Netz und geben einen Enrollment-Code ein. Er baut die Verbindung selbst auf. Von außen greift niemand in Ihr Netz. | C-02 |
| 2 | Scopes bestätigen | Der Collector meldet seine lokalen Netze. Sie entscheiden, welche durchsucht werden. | C-29 |
| 3 | Auslesen | Ein Sweep findet die erreichbaren Geräte. Danach fragt der Collector sie über SNMP, SSH und Redfish ab. | C-01 |
| 4 | Abgleichen | Reticora erkennt, welche Beobachtung zu welchem Gerät gehört: an Seriennummer, Hardware-UUID, MAC-Adressen und Management-IP. Aus einem Gerät wird nie ein zweites CI. | C-05 |
| 5 | Prüfen | Was nicht eindeutig ist, landet in der Review-Inbox. Dort entscheiden Sie. Ohne Sie wird nichts verworfen. | C-04 |

- **Abbildung:** Schemazeichnung „Verbindungsrichtung“. Unterschrift:
  „Abb. 1 · Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit
  mTLS 4222. Schemazeichnung.“

## 3. Daten, denen Sie trauen

- **Überschrift:** Daten, denen Sie trauen
- **Vorspann:** Eine CMDB nützt nur, wenn man ihr glaubt. Reticora sagt zu
  jedem Feld, woher der Wert stammt, und überschreibt nie, was Sie von Hand
  gesetzt haben.

| Titel | Text | Bild | Claim |
|---|---|---|---|
| Jedes Feld mit Herkunft | Zu jedem Feld sehen Sie die Quelle, ihren Rang, den Zeitpunkt der Beobachtung und den Grund, warum dieser Wert gilt. | S-02, „Abb. 2 · Herkunft eines Feldes in der CI-Ansicht.“ | C-03; Beleg mit der Rangfolge der Quellen |
| Manuell gewinnt | Ein Override bleibt, bis Sie ihn aufheben. Meldet eine Quelle später etwas anderes, sehen Sie beide Werte nebeneinander und entscheiden. | – | C-04 |
| Entscheiden statt aufräumen | Die Review-Inbox sammelt, was die Automatik nicht allein entscheiden darf: ein unbekanntes Gerät, eine mögliche Dublette, widersprüchliche Werte. Sie vergleichen Beobachtung und CI und entscheiden: zusammenführen, neu anlegen, übernehmen oder verwerfen. | S-03, „Abb. 3 · Review-Inbox: Beobachtung und CI im Vergleich.“ | C-30 |

- **Beleg „Rangfolge der Quellen“:** manuell 100 · Import 95 · Workflow 92 ·
  Redfish 90 · Agent 85 · SNMP 80 · API 75 · WMI 70 · SSH 60 · Sweep 20.

## 4. Sehen, was zusammenhängt

- **Überschrift:** Sehen, was zusammenhängt
- **Vorspann:** Aus den Beobachtungen entsteht ein Bild Ihres Netzes: wer mit
  wem verbunden ist, was wo im Rack steckt und was betroffen ist, wenn ein
  Gerät ausfällt.

| Titel | Text | Bild | Claim |
|---|---|---|---|
| Topologie | Nachbarschaften aus LLDP und die Abhängigkeiten zwischen CIs als Graph. | S-04, „Abb. 4 · Topologie: Beziehungen zwischen CIs als Graph.“ | C-31 |
| Racks | Die Belegung je Höheneinheit, Vorder- und Rückseite. | S-05, „Abb. 5 · Rack, Vorderseite.“ | C-10 |
| Ausfallsimulation | Lassen Sie ein oder mehrere CIs ausfallen und sehen Sie, was betroffen ist. Geräte mit zweiter Stromversorgung zählen erst, wenn beide Wege ausfallen. | S-06, „Abb. 6 · Ausfallsimulation in der Topologie.“ | C-09 |

Anordnung: Abb. 4 breit, darunter Abb. 5 (hoch) neben Abb. 6. Keine drei
gleichen Karten.

## 5. Für mehrere Kunden gebaut

- **Überschrift:** Für mehrere Kunden gebaut
- **Vorspann:** Organisation, Kunde, Standort: Der Arbeitsbereich steht immer
  im Kopf der Anwendung. Wer nur einen Kunden betreut, sieht nur dessen
  Daten.
- **Kennwerte:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Ebenen | Organisation → Kunde → Standort | C-32 |
| Trennung | in der Datenbank erzwungen | C-06 |
| Rollen | mit Geltungsbereich je Kunde, Standort oder Team | C-33 |
| Zweiter Faktor | Pflicht für Administratoren | C-34 |

- **Bild:** S-18, „Abb. 7 · Der Arbeitsbereich: Organisation, Kunde,
  Standort.“

## 6. Mehr als ein Inventar

- **Überschrift:** Mehr als ein Inventar
- **Vorspann:** Auf demselben Bestand arbeiten auch Service-Desk, Lager und
  Compliance. Es gibt nur einen Bestand, also nichts abzugleichen.
- **Verzeichnis** (Begriff und ein Satz, keine Karten):

| Begriff | Satz | Claim |
|---|---|---|
| Assets und Verträge | Kaufdaten, Zuweisung mit Unterschrift, Verträge und Dokumente am Gerät. | C-35 |
| Lager und Inventur | Bestand, Bewegungen und Inventur mit Etiketten und Barcode. | C-36 |
| Tickets | Tickets mit SLA und Geschäftskalender, direkt am betroffenen CI. | C-37 |
| Monitoring | Erreichbarkeit, Interface-Zähler, USV- und PDU-Werte als Verlauf am CI; Alarmregeln lösen Tickets und Benachrichtigungen aus. | C-24 |
| Workflows und Formulare | Übergaben, Genehmigungen und wiederkehrende Abläufe, ohne zu programmieren. | C-24 |
| Compliance | Regeln, Befunde und ein Audit-Protokoll mit Hash-Kette. | C-12, C-24 |

## 7. Für Menschen und für Maschinen

- **Überschrift:** Für Menschen und für Maschinen
- **Vorspann:** Die REST-API ist vollständig in OpenAPI beschrieben.
  Änderungen kommen nur hinzu. Was entfällt, wird mindestens zwölf Monate
  vorher angekündigt. [C-11]
- **Code-Beispiel**, Kopfzeile `GET /api/v1/cis`:

```
# Alle CIs, deren Name „core“ enthält
curl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50" \
  -H "X-API-Key: rk_live_…"
```

- **Kennwerte:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Anmeldung | API-Schlüssel im Kopf `X-API-Key` | C-11 |
| Webhooks | signiert mit HMAC-SHA256 | C-11 |
| Export | CSV und DATEV | C-11 |
| Limit | 600 Anfragen je Minute und Schlüssel | C-38 |

## 8. Sicherheit, die man nachprüfen kann

- **Überschrift:** Sicherheit, die man nachprüfen kann
- **Vorspann:** Was Ihre Informationssicherheit zuerst fragt, steht hier. Die
  Einzelheiten stehen auf der Seite „Sicherheit“.
- **Kennwerte**, jeder mit Beleg:

| Bezeichnung | Wert | Claim |
|---|---|---|
| Verbindung | Der Collector verbindet sich nach außen. Reticora öffnet keine Verbindung in Ihr Netz. | C-02 |
| Zugangsdaten | verschlüsselt gespeichert (AES-256-GCM); im Klartext nur im Arbeitsspeicher, nie auf Datenträgern, in API-Antworten oder Logs | C-13 |
| Trennung | Row-Level Security auf den Mandantentabellen | C-06 |
| Protokoll | Audit-Protokoll mit Hash-Kette je Organisation, prüfbar von der Kommandozeile | C-12 |
| Datenstandort | Daten, Backups, Logs und Suchindex in der EU | C-07 |

- **Verweis:** „Zur Seite Sicherheit“ → `/sicherheit/`

## 9. Erkennt, was in Ihren Racks steht

- **Überschrift:** Erkennt, was in Ihren Racks steht
- **Vorspann:** Reticora bringt Profile für verbreitete Netzwerk-, Server-,
  Storage- und Stromgeräte mit. Was es nicht kennt, legt es als generisches
  Gerät an und fragt Sie. [C-08]
- **Liste** (Text, keine Logos):
  - **Netzwerk:** Cisco Catalyst, ISR, ASR, ASA und Firepower · Aruba CX und
    ProCurve · Ubiquiti UniFi · MikroTik · FortiGate · OPNsense und pfSense
  - **Server und Virtualisierung:** Dell iDRAC · HPE iLO · Lenovo XCC ·
    Supermicro BMC · VMware ESXi · Proxmox VE · Windows Server · Linux
  - **Storage:** Synology · QNAP · TrueNAS
  - **Strom:** USVs von APC und Eaton · PDUs von APC und Raritan
- **Hinweis in `caption`:** Herstellernamen sind Marken ihrer Inhaber und
  stehen hier nur zur Beschreibung der Kompatibilität.
- **Verweis:** „Alle unterstützten Geräte“ → `/geraete/`

## 10. Pakete und Preise

- **Überschrift:** Pakete und Preise
- **Vorspann:** Alle Pakete enthalten CMDB, Discovery, Topologie, Racks und
  API. Preise im Monat, zzgl. MwSt.
- **Tabelle** (Werte aus `src/data/pricing.ts`):

| Paket | Kurzbeschreibung | CIs | im Monat |
|---|---|---|---|
| Essentials | CMDB, Discovery, Topologie, Racks, API, Assets, Tickets | 500 | 49 € |
| Standard | dazu Lager, Inventur, Etiketten, Unterschrift, SLAs, DATEV-Export | 2.500 | 119 € |
| Pro | dazu Monitoring, Workflows, Formulare, Bestellungen | 10.000 | 299 € |
| Enterprise Shared | dazu Compliance und Endpoint-Agent, in der Cloud auf getrennter Infrastruktur | 50.000 | ab 999 € |
| Enterprise Local | bei Ihnen gehostet, inklusive aller Arbeiten | 50.000 | ab 1.999 € |

- **Hinweisband:** **Beta-Rabatt:** 20 % in den ersten sechs Monaten, 10 %
  in den folgenden sechs Monaten, danach der volle Preis.
- **Zeile darunter:** Angebot nur für Unternehmen.
- **Verweis:** „Alle Preise und Funktionen“ → `/preise/`

Die Kurzbeschreibungen folgen der Paketmatrix des Codes (Vorbehalt F-23),
die CI-Limits der `README.md` §14 (W-E16).

## 11. Abschluss

- **Überschrift:** Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.
- **Text:** Der Test umfasst den Standard-Umfang für bis zu 100 CIs. Sie
  legen ein Konto an, bestätigen Ihre E-Mail-Adresse und richten bei der
  ersten Anmeldung eine Authenticator-App ein. Nach dem Test bleibt Ihre CMDB
  30 Tage erhalten. [C-22]
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Live-Demo“, „Kontakt“ (ohne
  Gewicht)
- **Zeile darunter:** Angebot nur für Unternehmen.

## Neue Einträge im Claim-Register

Diese Aussagen kommen auf der Startseite vor und fehlen bisher im Register.
Sie werden mit dieser Fassung ergänzt.

| ID | Aussage | Beleg im Produkt-Repository |
|---|---|---|
| C-26 | Sweep alle 24 Stunden, Abfrage über SNMP und Redfish alle 15 Minuten, einstellbar ab 5 Minuten | `README.md` §5.2 |
| C-27 | Ohne Verbindung puffert der Collector bis 24 Stunden und liefert in ursprünglicher Reihenfolge nach | `README.md` §2.1, §5.2 |
| C-29 | Nach der Anmeldung schlägt der Collector seine lokalen Netze als Scopes vor | `README.md` §5.2 |
| C-30 | Review-Inbox mit Vergleich von Beobachtung und CI; Aktionen zusammenführen, neu anlegen, übernehmen, verwerfen | `README.md` §9; `frontend/src/i18n/de-DE.json` (`reviews.actions.*`) |
| C-31 | Nachbarschaften aus LLDP als Beziehung `connected_to` | `README.md` §5.5 |
| C-32 | Ebenen Organisation → Kunde → Standort | `README.md` §4 |
| C-33 | Rollen mit Geltungsbereich auf Organisation, Kunde, Standort oder Team | `README.md` §12 |
| C-34 | Zweiter Faktor ist Pflicht für `org_admin` | `README.md` §12 |
| C-35 | Assets mit Kaufdaten, Zuweisung mit Unterschrift, Verträge, Dokumente | `README.md` §6.5; `docs/releases/phase2.md` |
| C-36 | Lagerbestand, Bewegungen, Inventur, Etiketten | `docs/releases/phase2.md` |
| C-37 | Tickets mit SLA und Geschäftskalender | `README.md` §6.5 |
| C-38 | 600 Anfragen je Minute und Schlüssel | `README.md` §8 |

Geändert gegenüber dem bisherigen Register:

- **C-06:** „Row-Level Security auf den Mandantentabellen“. Die
  Metrik-Zeitreihen sind über eigene Sichten getrennt
  (`docs/decisions/0001-timescale-rls.md`); deshalb steht hier nicht „alle
  Daten“.
- **C-13:** Klartext existiert im Arbeitsspeicher der Plattform bei der
  Übergabe und im Arbeitsspeicher des Collectors, nicht „nur im Collector“.
- **C-01:** SNMP, SSH und Redfish werden genannt. IPMI und WMI führt die
  README als „Best Effort“; sie stehen nicht auf der Startseite.
