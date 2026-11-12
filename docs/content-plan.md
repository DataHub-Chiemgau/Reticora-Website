# Inhaltsplan – Website für Reticora CMDB

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – Freigabe ausstehend** |

## 1. Regeln für Inhalte

1. **Präsens, ohne Roadmap.** Alle Funktionen des Paketumfangs stehen als
   verfügbar da. Keine Phasenkürzel (P1–P5), kein „bald“, kein „geplant“
   (Vorgabe des Auftraggebers, `project-brief.md` W-E02).
2. **Prüfung vor dem Go-live.** Jede Aussage im Claim-Register (§7) wird vor
   dem Go-live gegen den ausgelieferten Stand geprüft. Was dann nicht stimmt,
   wird gestrichen oder geändert.
3. **Keine erfundenen Zahlen, Kunden, Zitate, Siegel.** Zielwerte aus
   Planungsdokumenten sind keine Zusagen und stehen nur mit Freigabe auf der
   Website.
4. **Begriffe der App.** Kunde (nicht „Client“ oder „Mandant“ im Fließtext),
   Standort, CI, Review, Collector, Scope.
5. **Screenshots sind Platzhalter**, bis die Bilder aus der Demo-Organisation
   vorliegen (§8).
6. **Der Wortlaut je Seite** steht unter `docs/copy/`; die Startseite in
   `copy/startseite-de.md`.

## 2. Sitemap

```
/                              Startseite
/produkt/
  discovery/                   Auslesen: Collector, Protokolle, Ablauf
  datenqualitaet/              Identität, Quellränge, Provenienz, Review-Inbox
  topologie-impact/            Topologie, Rack, Ausfallsimulation
  verwaltung/                  Assets, Lager, Inventur, Dokumente, Verträge
  betrieb/                     Tickets, SLAs, Monitoring, Workflows
  compliance/                  Audit, Compliance, Befunde, IGA
  api/                         REST-API, Webhooks, Export, Import
/geraete/                      Unterstützte Geräte und Protokolle
/loesungen/
  isp/                         Für Netzbetreiber
  msp/                         Für Managed-Service-Provider
/sicherheit/                   Sicherheit, Datenschutz, Betriebsmodelle
/preise/                       Pakete, Add-ons, Fragen
/demo/                         Live-Demo: Zugangsdaten, was es zu sehen gibt, Link
/kontakt/                      Kontakt (Formular)
/kontakt/danke/                Bestätigung (noindex)
/impressum/                    Rechtstext vom Auftraggeber
/datenschutz/                  Rechtstext vom Auftraggeber
/agb/                          Rechtstext vom Auftraggeber
/subprozessoren/               Liste vom Auftraggeber
/barrierefreiheit/             Stand der Barrierefreiheit, Kontakt für Hinweise
/404
/en/…                          englische Fassung, gleiche Struktur, zum Start
```

Zwei Handlungsaufrufe führen von der Website weg und sind keine eigenen
Seiten:

- **„30 Tage testen“** → `https://www.reticora.cloud/onboarding`
  (Registrierung in der App).
- **„Live-Demo“** führt zuerst auf die Seite `/demo/`. Dort stehen die
  Zugangsdaten (`demo@reticora.cloud`, Passwort `Demo`), drei Dinge zum
  Ausprobieren und der Link zu `https://www.demo.reticora.cloud`.

| Seite | Zweck | Hauptrolle | Handlungsaufruf | Start |
|---|---|---|---|---|
| Startseite | Produkt in einer Minute verstehen | alle | Testen, Live-Demo | Pflicht |
| Discovery | zeigen, wie der Bestand entsteht | Techniker | Testen | Pflicht |
| Datenqualität | zeigen, warum die Daten stimmen | Techniker | Testen | Pflicht |
| Topologie und Impact | Zusammenhänge und Ausfallfolgen | Netzbetrieb | Live-Demo, Testen | Pflicht |
| Verwaltung | Assets, Lager, Inventur, Dokumente | Bestandsverwaltung | Live-Demo | Pflicht |
| Betrieb | Tickets, Monitoring, Workflows | Service-Desk | Live-Demo | Pflicht |
| Compliance | Audit, Befunde, IGA | Compliance | Kontakt | Pflicht |
| API | Integration bewerten | Techniker | Doku, Testen | Pflicht |
| Geräte | „Wird mein Gerät erkannt?“ | Techniker | Testen | Pflicht |
| Lösungen ISP / MSP | Nutzen je Geschäftsmodell | Entscheider | Live-Demo, Kontakt | Pflicht |
| Sicherheit | Erstprüfung bestehen | Sicherheit, Einkauf | Kontakt | Pflicht |
| Preise | Paket wählen | Entscheider | Testen, Kontakt (Enterprise) | Pflicht |
| Live-Demo | Zugang zur Demo geben und sagen, was man dort ausprobieren kann | alle | Demo öffnen | Pflicht |
| Kontakt | Anfrage stellen | Entscheider | Absenden | Pflicht |
| Rechtsseiten | Pflichtangaben | alle | – | Pflicht |
| Englisch | internationale Interessenten | alle | wie oben | Pflicht (W-E09) |

Nicht zum Start: Blog, Changelog, Karriere, Partnerseite, Vergleichsseiten,
Newsletter. Jede dieser Seiten bringt eigene Pflichten mit
(`compliance-matrix.md`).

## 3. Navigation

- **Kopfzeile:** Produkt (Menü mit den sieben Produktseiten), Geräte,
  Lösungen, Sicherheit, Preise; rechts „Anmelden“ (Link zur App),
  „Live-Demo“, „30 Tage testen“. „Kontakt“ steht in der Fußzeile und als
  Handlungsaufruf auf den Seiten für Entscheider und Prüfer.
- **Fußzeile:** alle Seiten, Impressum, Datenschutz, AGB, Subprozessoren,
  Barrierefreiheit, Sprache. Impressum und Datenschutz sind von jeder Seite
  mit einem Klick erreichbar.

## 4. Wege zum Abschluss

| Weg | Wer | Verlauf | Ziel |
|---|---|---|---|
| A Selbst testen | Techniker | Startseite → Discovery oder Geräte → „30 Tage testen“ | Registrierung in der App (Organisation, E-Mail, Name) |
| B Ansehen, dann entscheiden | Leitung MSP | Startseite → „Live-Demo“ → Lösungen MSP → Preise → „30 Tage testen“ | Demo-Instanz, dann Registrierung |
| C Prüfen | Sicherheit, Einkauf | Sicherheit → Subprozessoren → Kontakt | Formular, Thema „Sicherheit und Datenschutz“ |
| D Großer Bestand | Netzbetrieb ISP | Lösungen ISP → Preise (Enterprise) → Kontakt | Formular, Thema „Enterprise“ |

Der Test ist der erste Handlungsaufruf, die Live-Demo der zweite. Auf Seiten
für Prüfer und für Enterprise-Interessenten steht der Kontakt vorn.

## 5. Startseite

| Nr. | Abschnitt | Aussage | Bild |
|---|---|---|---|
| 1 | Einstieg | „Die CMDB, die Ihr Netz selbst ausliest und jeden Wert belegt.“ Ein Satz dazu, für wen und wie. Zwei Handlungsaufrufe. Darunter die Leiste mit Betriebswerten. | Netzschema mit Ausfallsimulation (Schemazeichnung, kein Screenshot) |
| 2 | So entsteht Ihr Bestand | Ablauf in fünf Schritten: Collector verbinden, Scopes bestätigen, auslesen, abgleichen, prüfen. Die ersten beiden heißen wie im Onboarding der App. | Schema der Verbindungsrichtung |
| 3 | Daten, denen Sie trauen | Quelle, Zeitpunkt und Grund je Feld; manuell gewinnt; Review-Inbox statt stiller Überschreibung | S-02 CI-Detail, S-03 Review-Inbox |
| 4 | Zusammenhänge | Topologie aus LLDP, Rack höheneinheitengenau, Ausfallsimulation mit Redundanz | S-04, S-05, S-06 |
| 5 | Für mehrere Kunden | Organisation → Kunde → Standort; getrennt bis in die Datenbank; Rollen mit Geltungsbereich | S-18 Arbeitsbereich |
| 6 | Auf demselben Bestand | Assets, Lager, Inventur, Tickets, Monitoring, Workflows, Compliance als Verzeichnis mit je einem Satz, keine Kartenreihe | – |
| 7 | Für Maschinen | REST-API, Webhooks, Export, mit einem echten Aufrufbeispiel | Code-Beispiel |
| 8 | Sicherheit in Kürze | nur ausgehende Verbindung, EU, verschlüsselte Zugangsdaten, Audit-Kette; Link zur Sicherheitsseite | Schema Verbindungsrichtung |
| 9 | Geräte | Auszug der erkannten Hersteller als Textliste; Link zur Geräteseite | – |
| 10 | Pakete | vier Pakete in einer Zeile je Paket; Link zur Preisseite | – |
| 11 | Abschluss | Test: 30 Tage, Standard-Umfang, 100 CIs. Daneben Live-Demo und Kontakt. | – |

## 6. Übrige Seiten in Stichpunkten

- **Discovery:** Protokolle (ICMP, ARP, SNMP v2c/v3, SSH, Redfish, IPMI, WMI);
  Intervalle (Sweep 24 h, Poll 15 min); Verhalten ohne Verbindung (Puffer bis
  24 h); Auslieferung des Collectors (Docker, OVA, Windows-Installer);
  Zugangsdaten nur im Speicher des Collectors. Bilder S-07, S-08.
- **Datenqualität:** die fünf Identitätsschlüssel in ihrer Reihenfolge; die
  Tabelle der Quellränge; drei Beispiele für Review-Fälle; Zusammenführen und
  Rückgängigmachen. Bilder S-02, S-03.
- **Topologie und Impact:** Topologie als Graph mit Punkten nach Status;
  Ausfallsimulation für ein oder mehrere CIs mit Redundanz über Strom und
  Cluster; Stromkette Gerät → PDU → USV → Quelle; Herkunft und Prüfstatus je
  Beziehung in der CI-Ansicht; Rack mit Vorder- und Rückseite. Bilder S-04,
  S-05, S-06. Das Netzschema folgt `design-system.md` §6.
- **Verwaltung:** Asset und CI getrennt und verknüpft; Zuweisung mit
  Unterschrift; Lagerbewegungen; Inventur mit Barcode; Dokumente und
  Verträge; DATEV-Export. Bilder S-09, S-10.
- **Betrieb:** Tickets mit SLA und Geschäftskalender; Monitoring und
  Alarmregeln; Workflows und Formulare; Wartungsfenster. Bilder S-11, S-12.
- **Compliance:** Audit-Protokoll mit Hash-Kette und Prüfwerkzeug;
  Compliance-Regeln und Befunde; Berichte; IGA als Add-on. Bilder S-13, S-14.
- **API:** Grundsätze (OpenAPI, additive Änderungen, Fehlerformat, Limits);
  Webhooks mit Signatur; Export und Import; API-Schlüssel. Bild S-15.
- **Geräte:** Tabelle aus den Klassifikationsprofilen (`collector/profiles`),
  filterbar nach Kategorie; Hinweis, was mit unbekannten Geräten geschieht
  (`generic_device` und Review).
- **Lösungen ISP / MSP:** je drei bis vier Arbeitssituationen aus dem Alltag
  und wie Reticora sie löst; keine erfundenen Fallstudien.
- **Sicherheit:** Betriebsmodelle; Verbindungsrichtung und Ports;
  Mandantentrennung; Verschlüsselung der Zugangsdaten; Identität und MFA;
  Audit; Datenschutz (PII-Tresor, Löschung); Datenstandort;
  Subprozessoren; Meldeweg für Sicherheitslücken.
- **Preise:** Paketmatrix aus einer Datendatei (§6.1); Add-ons; Test; Fragen
  (Was zählt als CI? Was passiert über dem Limit? Was passiert nach Ablauf?).
  Antworten stehen in `README.md` §14.
- **Live-Demo:** Zugangsdaten in einer Kennwertliste (Adresse, Benutzer,
  Passwort) mit Kopierknopf; drei Dinge zum Ausprobieren (Ausfall in der
  Topologie simulieren, Herkunft eines Feldes ansehen, ein Review
  entscheiden); Hinweis, dass alle Besucher dasselbe Konto nutzen und keine
  eigenen Daten eingeben sollen; Knopf „Demo öffnen“.
- **Kontakt:** Formular (§9), daneben direkte Kontaktdaten (F-01).

### 6.1 Preise

Angabe des Auftraggebers vom 2026-11-12. Sie ersetzt die Preise in
`README.md` §14. Die Website führt sie an genau einer Stelle
(`src/data/pricing.ts`).

| Paket | monatlich | jährlich | erstes Beta-Jahr bei jährlicher Zahlung |
|---|---|---|---|
| Essentials | 49 € | 490 € | 441 € |
| Standard | 119 € | 1.190 € | 1.071 € |
| Pro | 299 € | 2.990 € | 2.691 € |
| Enterprise Shared | ab 999 € | auf Anfrage | – |
| Enterprise Local | ab 1.999 € | auf Anfrage | – |

Limits je Paket nach `README.md` §14 (W-E16):

| Paket | CIs | Collectors | Nutzer |
|---|---|---|---|
| Essentials | 500 | 2 | 5 |
| Standard | 2.500 | 5 | 25 |
| Pro | 10.000 | 20 | 100 |
| Enterprise Shared, Enterprise Local | 50.000 | unbegrenzt | unbegrenzt |

- **Enterprise Shared:** in der Cloud auf getrennter Infrastruktur.
  **Enterprise Local:** beim Kunden gehostet; der Preis enthält alle Arbeiten.
- **Beta-Rabatt:** 20 % in den ersten sechs Monaten, 10 % in den folgenden
  sechs Monaten, danach der volle Preis. Bei jährlicher Vorauszahlung gilt
  der Preis der letzten Spalte.
- **Zusatzkosten im Monat:** je zusätzlichem CI 0,05 €, je Monitoring-Service
  0,03 € (W-E12).
- **Test:** 30 Tage, Standard-Umfang, bis 100 CIs. Nach dem Test bleibt die
  CMDB 30 Tage aktiv; ohne Tarif wird sie danach gelöscht (W-E15).
- **Downgrade:** Es gehen keine Daten verloren. CIs über dem Limit des neuen
  Tarifs werden als zusätzliche CIs abgerechnet. Funktionen, die der Tarif
  nicht enthält, werden gesperrt, ihre Daten bleiben erhalten (W-E15).
- **Darstellung:** Nettopreise mit dem Zusatz „zzgl. MwSt.“ und dem Hinweis
  „Angebot nur für Unternehmen“ (`compliance-matrix.md` B-02). Die
  Bedingungen des Beta-Rabatts stehen direkt bei den Preisen (I-03).
- **Geklärt (W-E16):** Nettopreise mit „zzgl. MwSt.“; der Paketname lautet
  „Essentials“; die Limits stehen oben.
- **Offen:** Buchungszeitraum des Beta-Rabatts; Weg vom Test zum Vertrag
  (F-19).

### 6.2 Funktionen je Paket

Die App nennt die Stufen „Paket“ (englisch „plan“); die Website übernimmt
das Wort. Die Zeilen fassen die Funktionsschlüssel des Codes
(`backend/internal/entitlement/entitlement.go`) in der Sprache der App
zusammen.

| Zeile | ab Paket |
|---|---|
| CMDB, Discovery und Reviews | Essentials |
| Topologie, Ausfallsimulation und Racks | Essentials |
| API, Webhooks, Export und Import | Essentials; DATEV-Export ab Standard |
| Inventar, Zuweisungen, Verträge und Dokumente | Essentials; Dokumentenspeicher 1.000 / 10.000 / 50.000 MiB / unbegrenzt |
| Tickets | Essentials; SLAs und Geschäftskalender ab Standard |
| Lagerbestand, Inventur, Etiketten und Unterschrift | Standard; Bestellungen ab Pro |
| Monitoring, Workflows und Formulare | Pro |
| Compliance, Befunde und Endpoint-Agent | Enterprise |
| Add-ons: IGA, KI-Assistent | zu jedem Paket buchbar |

Zu klären (F-23): Code und `README.md` §14 weichen bei einzelnen Funktionen
ab (Befunde: Enterprise im Code, Pro in der README; Schulungen: Pro im Code,
Enterprise in der README). Die README nennt außerdem Funktionen ohne
Schlüssel im Code (SMS/Pager, Ticketing Pro, Disposition, erweitertes Audit,
Reseller, RFID, GIS). Bis zur Klärung gilt die Zuordnung des Codes.

### 6.3 Begriffe in beiden Sprachen

Die Website nimmt die Wörter der Oberfläche, im Englischen in
US-Schreibweise.

| Deutsch | Englisch |
|---|---|
| Organisation | Organization |
| Kunde | Customer |
| Standort | Site (oberste Ebene), Location (jede Ebene) |
| CI, CI-Typ | CI, CI type |
| Collector, Discovery, Scope (Discovery) | Collector, Discovery, Scope (nur Discovery-Scopes) |
| Review-Inbox, Review | Review inbox, review |
| Abgleich | Reconciliation |
| Herkunft, Quelle, Rang | Provenance, Source, Rank |
| Override, Effektiv | Override, Effective |
| Beziehung, Beziehungstyp | Relationship, Relationship type |
| Topologie, Ausfallsimulation | Topology, Outage simulation |
| Ausfall simulieren | Simulate outage |
| Betroffene CIs | Affected CIs |
| Durch Redundanz geschützt | Protected by redundancy |
| Auswirkungsanalyse | Impact analysis |
| Paket | Plan |
| Testzeitraum | Trial |
| Konto anlegen | Create account |
| Anmelden | Sign in |
| Höheneinheit (HE) | Rack unit (U) |

Begriffe, die die englische Fassung der Website selbst gebildet hat, weil die
Oberfläche der App sie nicht kennt (oder deren Begriff mehrdeutig ist).
**Vorgeschlagen, Freigabe ausstehend.** Der Auftraggeber entscheidet, ob sie
bleiben oder durch Begriffe der App ersetzt werden.

| Deutsch | Englisch | Anmerkung |
|---|---|---|
| Arbeitsbereich | Workspace | vorgeschlagen, Freigabe ausstehend: die App beschriftet die Kopfzeilen-Auswahl „Scope“, das kollidiert mit den Discovery-Scopes. „Scope“ steht auf der Website nur für Discovery-Scopes; für den Umfang eines Pakets stehen „plan“, „included in …“, „what the sweep covers“. Der Auftraggeber entscheidet |
| Lebenszeichen | Heartbeat | nicht in der App |
| Puffer, Takt | Buffer, Intervals | nicht in der App |
| Klick-Builder | Click builder | |
| Massenänderung | Bulk change | |
| Probelauf | Dry run | |
| Stromkette | Power chain | passt zu Claim C-51 |
| Mehrfachausfall | Multiple failures | |
| Wartungsfenster | Maintenance window | die App kennt nur „Maintenance“ |
| Rollen mit Geltungsbereich | Scoped roles | passt zu Claim C-33 |
| Identitätsabgleich | Identity matching | |
| Betriebsmodelle | Deployment models | |
| Notfallzugang | Break-glass access | passt zu Claim C-82 |
| Anliegen (Formularfeld) | Topic | statt „Enquiry“ |
| Leitstand, Dokument (Darstellungen) | Control room, Document | Seite Barrierefreiheit |
| Kontakt aufnehmen | Get in touch | |
| erstes Beta-Jahr | first beta year | |

Kurze Erläuterungen, die nur die englische Fassung enthält (Definitionen, keine
Produktaussagen): DATEV („the format used by German accounting software“),
DIN 66399 („the German standard for destroying data media“), KRITIS („the
German framework for critical infrastructure“). Die englische Fassung nimmt
außerdem Begriffe der App unverändert: Unclassified device, Probable duplicate, Serial number
mismatch, Unlicensed CI, Repair, Review inbox, Simulate outage, Protected by
redundancy, Field permissions, Business calendar, Stocktake.

## 7. Claim-Register

Status „Beleg“ nennt die Quelle im Repository. „Vor Go-live“ nennt, was
zusätzlich geklärt sein muss. Kein Eintrag gilt als geprüft, bevor eine
benannte Person ihn abgehakt hat (F-14).

| ID | Aussage | Beleg | Vor Go-live |
|---|---|---|---|
| C-01 | Automatische Erfassung über SNMP v2c/v3, SSH und Redfish sowie NAS- und Strom-Plugins; IPMI und WMI ergänzend | `README.md` §5.1 (IPMI und WMI dort als „Best Effort“) | IPMI und WMI nicht gleichrangig bewerben |
| C-02 | Collector baut nur ausgehende Verbindungen auf (443, 4222) | `README.md` §2.1, `docs/betrieb/firewall-matrix.md` | – |
| C-03 | Herkunft je Feld: Quelle, Wert, Zeitpunkt, Auswahlgrund | `README.md` §5.3 | – |
| C-04 | Manuelle Werte werden nie automatisch überschrieben | `README.md` §1.1 | – |
| C-05 | Kein automatisches Zusammenführen allein über den Hostnamen | `README.md` §5.3 | – |
| C-06 | Mandantentrennung wird in der Datenbank erzwungen: Row-Level Security auf den Mandantentabellen; Metrik-Zeitreihen sind über eigene Sichten getrennt | `README.md` §4; Ausnahme für Metriken: `docs/decisions/0001-timescale-rls.md` | nie „alle Daten per Row-Level Security“ schreiben |
| C-07 | Daten, Backups, Logs und Suchindex in der EU | `README.md` §3 | **Region und Anbieter vom Betreiber bestätigen (F-10)** |
| C-08 | Liste erkannter Hersteller und Geräteklassen | `README.md` §5.4, `collector/profiles` | mit Profilstand abgleichen |
| C-09 | Ausfallsimulation mit Redundanz und Mehrfachausfall | `README.md` §7 | – |
| C-10 | Rack-Ansicht höheneinheitengenau | `README.md` §9 | – |
| C-11 | REST-API nach OpenAPI, signierte Webhooks, Export | `README.md` §8 | öffentliche Doku vorhanden? (F-15) |
| C-12 | Audit-Protokoll mit Hash-Kette, prüfbar | `README.md` §12 | – |
| C-13 | Zugangsdaten liegen verschlüsselt in der Plattform (AES-256-GCM) und gehen zusätzlich verschlüsselt an den Collector; im Klartext nur im Arbeitsspeicher, nie auf Datenträgern, in API-Antworten oder Logs | `README.md` §5.6 | nicht „nur im Collector“ schreiben |
| C-14 | Personenbezogene Daten in einem eigenen Tresor; Löschung durch Vernichten des Schlüssels | `README.md` §12 | – |
| C-15 | Signierte Release-Artefakte und SBOM | `README.md` §3, §15 | – |
| C-16 | Externer Penetrationstest | nur Erklärung des Auftraggebers, kein Bericht im Repository (`docs/security/pentest-g1.md`) | **nur mit Nachweis nennen (F-10)** |
| C-17 | Verfügbarkeit, RPO, RTO | Zielwerte in `README.md` §15 | **nur als vertragliche Zusage nennen (F-10)** |
| C-18 | Antwortzeiten und Durchsatz | Zielwerte, Lastschwellen G2 vorläufig (`docs/acceptance/lasttest-g2.md`) | **nicht nennen ohne Freigabe** |
| C-19 | Berichte für ISO 27001, NIS2, KRITIS | `README.md` §12 | Formulierung: Berichtsfunktion, keine Zertifizierung des Anbieters, keine Garantie der Konformität des Kunden |
| C-20 | KI-Add-on: Verarbeitung in der EU oder selbst betrieben, kein Training mit Kundendaten, Einschalten je Organisation | `README.md` §13 | Anbieter und Region bestätigen |
| C-21 | Paketumfang, Limits, Preise | Preise: Auftraggeber, 2026-11-12 (§6.1). Umfang und Limits: `README.md` §14, dort „noch zu bestätigen“ | **offene Punkte aus F-04** |
| C-22 | Test: 30 Tage, Standard-Umfang, 100 CIs; danach 30 Tage weiter aktiv, dann Löschung; Downgrade ohne Datenverlust | Dauer, Tarif und Limit im Code (`backend/internal/config/config.go`); Testende und Downgrade: Auftraggeber, 2026-11-12 (W-E15) | **Produkt muss der Zusage folgen:** README und Code beschreiben das Testende anders (F-19) |
| C-23 | Barrierefreiheit der App | Ziel WCAG 2.2 AA (`frontend/DESIGN.md` §7) | als Ziel formulieren, nicht als Konformität |
| C-24 | Funktionen späterer Produktphasen (Monitoring-Alarme, Workflows, Compliance-Befunde, Endpoint-Agent, SAML/SCIM, Reseller, RFID, GIS, Mobil) | `README.md` §14, §17 | **gegen Launch-Umfang prüfen (F-03)** |
| C-25 | Dedicated Instance und Air-Gapped-Betrieb | `docs/betrieb/referenzmodell.md` | Angebot bestätigen |
| C-26 | Sweep alle 24 Stunden, Abfrage über SNMP und Redfish alle 15 Minuten, einstellbar ab 5 Minuten | `README.md` §5.2 | – |
| C-27 | Ohne Verbindung puffert der Collector bis 24 Stunden und liefert in ursprünglicher Reihenfolge nach | `README.md` §2.1, §5.2 | – |
| C-28 | Collector als Docker-Image, OVA oder Windows-Installer | `README.md` §5.6 | Stand der Auslieferung |
| C-29 | Nach dem Enrollment schlägt der Collector seine lokalen Netze als Scopes vor | `README.md` §5.2 | – |
| C-30 | Review-Inbox mit Vergleich von Beobachtung und CI; Aktionen zusammenführen, neu anlegen, übernehmen, verwerfen | `README.md` §9; `frontend/src/i18n/de-DE.json` (`reviews.actions.*`) | – |
| C-31 | Nachbarschaften aus LLDP als Beziehung `connected_to` | `README.md` §5.5 | – |
| C-32 | Ebenen Organisation → Kunde → Standort | `README.md` §4 | – |
| C-33 | Rollen mit Geltungsbereich auf Organisation, Kunde, Standort oder Team | `README.md` §12 | – |
| C-34 | Zweiter Faktor ist Pflicht für Administratoren der Organisation | `README.md` §12 | – |
| C-35 | Assets mit Kaufdaten, Zuweisung mit Unterschrift, Verträge, Dokumente | `README.md` §6.5; `docs/releases/phase2.md` | – |
| C-36 | Lagerbestand, Bewegungen, Inventur, Etiketten | `docs/releases/phase2.md` | – |
| C-37 | Tickets mit SLA und Geschäftskalender | `README.md` §6.5 | – |
| C-38 | 600 Anfragen je Minute und Schlüssel | `README.md` §8 | – |
| C-39 | Der Sweep nutzt ICMP mit höchstens 256 parallelen Anfragen, ARP, SNMP und Reverse-DNS, auf Wunsch zusätzlich die Ports 22, 80, 443, 623, 5985 und 8006. | README.md §5.1 | – |
| C-40 | Der Collector klassifiziert Geräte in der Reihenfolge SNMP, Redfish, Banner und zieht die Herstellerkennung der MAC-Adresse hinzu. Ohne Treffer entsteht ein generisches Gerät und ein Review. | README.md §5.2 Schritt 3; collector/profiles/README.md „Classification“ | – |
| C-41 | Ein Collector meldet sich mit einem Einmal-Code an, der 24 Stunden gilt. Sein Zertifikat gilt 90 Tage und erneuert sich ab 60 % der Laufzeit selbst. Gesperrt wird ein Collector durch Widerruf. | README.md §5.6 „Enrollment“ | – |
| C-42 | Der Collector meldet sich alle 60 Sekunden; nach 5 Minuten ohne Meldung gilt er als offline. Er aktualisiert sich nur mit signierten Paketen, über die Kanäle stable und beta, mit Rollback. | README.md §5.6 „Betrieb“, §2.1 | – |
| C-43 | Ein Scope legt CIDR, Host oder Adressbereich samt VRF fest, dazu Zeitplan, Zugangsdaten und Plugins. | README.md §5.2 Schritt 1 | – |
| C-44 | Ein beobachtetes CI, das seit dem Dreifachen des Scope-Intervalls nicht gesehen wurde, erhält den Status unknown. Manuell angelegte CIs sind davon ausgenommen. | README.md §5.3 „Weitere Regeln“ | – |
| C-45 | Reticora erkennt ein Gerät innerhalb eines Kunden in dieser Reihenfolge: Seriennummer, Hardware-UUID, eindeutige Schnittmenge der MAC-Adressen, Management-IP mit sysObjectID in derselben VRF. Platzhalter-Seriennummern, bekannte Klon-UUIDs sowie lokal administrierte, VRRP-, HSRP- und CARP-MACs zählen nicht. Der Hostname führt nie zum automatischen Zusammenführen, nur zu einem Review. | README.md §5.3 „Priorisierte Identity-Keys“ | – |
| C-46 | Rang der Quellen: manuell 100, Import 95, Workflow 92, Redfish 90, Agent 85, SNMP 80, API und Integration 75, WMI 70, SSH und NAS 60, Sweep 20. | README.md §5.3 Tabelle „Quellränge“ | – |
| C-47 | Ein Wert wird nur übernommen, wenn seine Beobachtung neuer ist als die des gespeicherten Werts; maßgeblich ist der Zeitpunkt der Beobachtung, nicht der Eingang. Weicht eine Quelle von einem Override ab, entsteht ein Review. | README.md §1.1, §5.3 „Weitere Regeln“ | – |
| C-48 | Beim Zusammenführen hängt Reticora alle Bezüge um, das alte CI leitet weiter. Eine Zusammenführung lässt sich 30 Tage lang rückgängig machen, ein gelöschtes CI 90 Tage lang wiederherstellen. | README.md §6.2 „Merge“, „Soft-Delete“ | – |
| C-49 | Reviews entstehen unter anderem für: unklassifiziertes Gerät, mehrdeutige Identität, widersprüchliche Werte, wahrscheinliches Duplikat, Konflikt mit Override, wiedergekehrtes Gerät, abweichende Seriennummer, doppelte IP-Adresse, nicht lizenziertes CI und Scope-Vorschlag. | README.md §5.3; frontend/src/i18n/de-DE.json (reviews.kinds.*) | – |
| C-50 | Über powered_by und member_of_cluster ist ein CI erst betroffen, wenn alle seine Versorger ausgefallen sind. Was nur über connected_to erreicht wird, gilt als möglicherweise betroffen und zählt nicht zu den betroffenen CIs. | README.md §7; frontend/src/i18n/de-DE.json (impact.heuristicHint) | – |
| C-51 | Das Strommodell bildet die Kette Gerät, PDU, USV, Quelle ab. | README.md §7 „Strommodell“ | – |
| C-52 | Die Auswirkungsanalyse nennt betroffene CIs, Kunden, Standorte und Services sowie die Single Points of Failure eines Services. | README.md §7 („ab P2“: Blast Radius, SPOFs); docs/releases/phase2.md M2.7; frontend/src/i18n/de-DE.json (impact.*) | – |
| C-53 | Beziehungen tragen Herkunft, Konfidenz und Prüfstatus (ungeprüft oder bestätigt). LLDP ergibt die Konfidenz 1,0; die Weiterleitungstabelle wird nur ohne LLDP genutzt und ergibt 0,6. Unbestätigte Kanten aus der Discovery verschwinden nach 7 Tagen oder dem Fünffachen des Scope-Intervalls, je nachdem, was länger ist. Manuelle Kanten löscht die Discovery nie, von Hand entfernte legt sie nicht neu an. | README.md §5.5, §6.4; frontend/src/i18n/de-DE.json (relationship.verificationState, relationship.state.*) | – |
| C-54 | Racks zeigen Vorder- und Rückseite. Beim Einbau prüft Reticora Höhe und Überschneidung je Seite. | README.md §6.4 (rack_mount mit Exclusion-Constraint front/rear/both und Höhenprüfung), §9 | – |
| C-55 | Die Topologie zeigt bis 2.000 Knoten ohne Filter; darüber wählen Sie zuerst Standort oder Typ. | README.md §7 „Topologie“, §9 „Visualisierungen“ | – |
| C-56 | Asset und CI sind getrennt und lassen sich verknüpfen. Das Asset führt Seriennummer, Standort, physischen Lebenszyklus und Kaufdaten; das CI zeigt diese Werte nur an. Weichen sie ab, entsteht ein Review. | README.md §1.1, §6.1 | – |
| C-57 | Lager gliedern sich in Lager, Zone, Regal und Fach. Mengenartikel haben einen Bestand je Fach und einen Mindestbestand; wird er unterschritten, benachrichtigt Reticora. Jede Bewegung steht in einer unveränderlichen Historie. | README.md §4 (Lagerzweig), §6.5; docs/releases/phase2.md M2.5; backend/internal/notify/templates.go (StockBelowMinimum); backend/internal/movement/model.go (MovementTypes) | – |
| C-58 | Interne Bestellungen werden nach dem Vier-Augen-Prinzip genehmigt. | docs/releases/phase2.md M2.5; README.md §6.5 (internal_order) | – |
| C-59 | Eine Inventur erfasst den Bestand per Barcode-Scan, zeigt die Differenzen und wird abgeschlossen. Etiketten mit Barcode lassen sich drucken. | README.md §6.5 (stocktake, stock_scan, Barcode und Etikettendruck); docs/releases/phase2.md M2.5 und abgekündigte Pfade (…/differences) | – |
| C-60 | Dokumente haben Versionen und lassen sich mit CIs, Assets, Zuweisungen, Tickets, Standorten, Inventuren und Entsorgungen verknüpfen. Jede neue Version wird vor dem ersten Download auf Schadsoftware geprüft. Speicher je Paket: 1.000 MiB, 10.000 MiB, 50.000 MiB, Enterprise unbegrenzt. | docs/releases/phase2.md M2.3; docs/betrieb/referenzmodell.md „Uploads und Malware-Scan“; backend/migrations/000217_document_link_targets.up.sql; backend/internal/entitlement/entitlement.go (storageDefaultMB) | Speicher je Paket mit dem Code abgleichen |
| C-61 | Reticora führt Lieferanten und Verträge mit Warnung vor dem Ablauf, Zuweisungen mit Unterschrift, Reservierungen und die Entsorgung nach DIN 66399. | docs/releases/phase2.md M2.4 | – |
| C-62 | Tickets haben eine Nummer je Organisation, einen Bezug auf ein Objekt wie ein CI und Anhänge; aus einem Review lässt sich ein Ticket anlegen. Der Geschäftskalender gilt je Organisation oder je Kunde. | docs/releases/phase2.md M2.6 | – |
| C-63 | Monitoring erfasst Erreichbarkeit, Interface-Zähler sowie USV- und PDU-Werte und bewahrt Metriken 400 Tage auf. | README.md §10 | gegen Launch-Umfang prüfen (F-03): Monitoring ab Pro |
| C-64 | Eine Alarmregel nennt Metrik, Bedingung, Schwellwert, Dauer und Schweregrad. Sie löst ein Ticket, einen Webhook oder eine Benachrichtigung aus. | README.md §10 (P3); backend/internal/monitoring/monitoring.go (AlertRule) | gegen Launch-Umfang prüfen (F-03, F-23): Alarmregeln im Standard-Release ausgeschaltet |
| C-65 | Workflows starten durch ein Ereignis, von Hand oder nach Zeitplan. Aktionen sind Ticket, Webhook, Benachrichtigung, Feld setzen und Genehmigung. Schreibende Aktionen tragen die Herkunft Workflow mit Rang 92 und lassen Overrides stehen. Formulare sind versioniert und haben bedingte Logik. | README.md §11 | gegen Launch-Umfang prüfen (F-03, F-23): Workflows und Formulare im Standard-Release ausgeschaltet |
| C-66 | Ein Wartungsfenster hat Beginn, Ende und die betroffenen CIs; Reticora leitet daraus die betroffenen Kunden ab. Die Auswirkungsanalyse rechnet mehrere CIs zugleich. | backend/internal/maintenance/model.go (Window, Notification je Client); README.md §7 „Mehrfachausfall“ | Benachrichtigung der Kunden je Wartungsfenster bleibt im Code „pending“, bis die Benachrichtigungskette steht; nur die Ableitung der Kunden nennen |
| C-67 | Compliance-Regeln gelten je CI-Typ, entstehen im Klick-Builder und tragen Schweregrad, Kategorie und einen Hinweis zur Behebung. Der Score zählt bestanden, fehlgeschlagen und nicht anwendbar, gesamt und je CI-Typ. | backend/internal/compliance/model.go (Rule, Score); README.md §6.3 (Regelsprache, Klick-Builder), §12 | gegen Launch-Umfang prüfen (F-03, F-23): Compliance im Standard-Release ausgeschaltet |
| C-68 | Der Bericht enthält das Prüfergebnis der Audit-Kette, den Score, die Befunde nach Schweregrad mit den betroffenen CIs und die eingeschalteten Sicherheitsfunktionen. | backend/internal/compliance/report.go (Report) | wie C-67; Formulierung als Berichtsfunktion (C-19) |
| C-69 | Das Audit-Protokoll wird 10 Jahre aufbewahrt, die Feldhistorie 3 Jahre. Die Hash-Kette lässt sich in der Anwendung und mit dem Kommandozeilenwerkzeug audit-verify prüfen. | README.md §12 „Audit“; frontend/src/i18n/de-DE.json (audit.verifyNow) | – |
| C-70 | Das IGA-Add-on bietet Eintritt, Wechsel und Austritt, Zugriffsanträge mit Genehmigung, Access-Reviews und Drift-Erkennung. Korrekturen laufen nur, wenn eine zweite Person zustimmt; schreibende Connectoren laufen als eigener Prozess mit geringsten Rechten. | README.md §12.1, §2.1 | Add-on: Preis und Buchungsweg offen (F-24); im Standard-Release ausgeschaltet (F-23) |
| C-71 | Fehler folgen RFC 7807 mit trace_id. Wiederholte Anfragen sind 24 Stunden idempotent, Änderungen sind per ETag gegen Überschreiben geschützt. Listen blättern per Cursor, 50 Einträge je Seite, höchstens 200. Änderungen kommen nur hinzu; was entfällt, wird mit Sunset-Header mindestens 12 Monate vorher angekündigt. | README.md §8 „Grundsätze“ | – |
| C-72 | Die API erlaubt 20 Anfragen je Minute und IP-Adresse vor der Anmeldung, 600 je Minute und Schlüssel oder Sitzung und 6.000 je Minute und Organisation. | README.md §8 „Rate-Limits“ | – |
| C-73 | Webhooks sind mit HMAC-SHA256 signiert. Schlägt die Zustellung fehl, wiederholt Reticora sie mit wachsendem Abstand von 30 Sekunden bis 6 Stunden, legt sie danach in eine Dead-Letter-Queue und deaktiviert das Abonnement. | README.md §8 „Zusätzlich“ | – |
| C-74 | Der CSV-Export läuft im Hintergrund, schreibt UTF-8 mit BOM und Semikolon, enthält nur die Felder, die Sie sehen dürfen, und ein Manifest; die Download-Adresse gilt 15 Minuten. Der Import arbeitet mit Zuordnungsprofilen und einem Probelauf. | README.md §8 „Zusätzlich“; docs/releases/phase2.md M2.8 | – |
| C-75 | API-Schlüssel beginnen mit rk_live_, werden nur als Hash gespeichert und gehören einem Nutzer oder einem Service-Account. Sie rotieren mit Überlappung. | README.md §8 „Auth“, §12 „Schlüssel“ | – |
| C-76 | Massenänderungen umfassen bis 500 IDs; ab 100 IDs laufen sie als Job im Hintergrund mit einem Bericht über Teilfehler. | README.md §8 „Bulk“ | – |
| C-77 | Im Kundennetz braucht der Collector keine eingehende Regel in der Firewall, kein VPN und keine Portweiterleitung. Auf Port 4222 weist er sich mit eigenem Zertifikat aus; gesperrte Zertifikate und deaktivierte Collectors werden abgewiesen, und jeder Collector nutzt nur seinen eigenen Kanal. Für HTTPS ist ein Proxy möglich; Port 4222 braucht eine direkte Verbindung. | docs/betrieb/firewall-matrix.md „Grundsatz“, „Kundenseite“, „Plattformseite“ | – |
| C-78 | Die Anwendung greift mit einer Datenbankrolle ohne Superuser-Recht und ohne BYPASSRLS zu. Lesen und Schreiben prüfen dieselben Bedingungen der Mandantentrennung. | README.md §4 „Regeln“ | – |
| C-79 | Die Anmeldung läuft über OIDC mit PKCE; Sitzungstoken gelten 15 Minuten. Einen eigenen Identity-Provider binden Sie je Organisation an. Einladungen gelten 7 Tage, eine Deaktivierung wirkt sofort. | README.md §4 „Mandantenlebenszyklus“, §8 „Auth“, §12 „Identität“ | – |
| C-80 | Die Signaturschlüssel der Sitzungen wechseln alle 90 Tage, der Datenschlüssel jeder Organisation jährlich; der Hauptschlüssel wird ohne Ausfallzeit neu verpackt. | README.md §12 „Schlüssel“ | – |
| C-81 | Adressen für Webhooks, Importe und Connectoren dürfen nicht auf private Netze oder Metadaten-Dienste zeigen; Reticora schützt vor DNS-Rebinding und begrenzt Weiterleitungen. | README.md §12 „Egress-Schutz“ | – |
| C-82 | Das Personal des Plattformbetriebs arbeitet mit persönlichen Identitäten und zweitem Faktor. Jede Nutzung des Notfallzugangs löst einen Alarm aus; diese Zugriffe stehen in einem eigenen Audit-Protokoll mit Hash-Kette. | README.md §12 „Operatoren“ | – |
| C-83 | Sie können Ihre Organisation vollständig exportieren. Die Löschung einer Organisation wird nach 30 Tagen Karenz wirksam. | README.md §4 „Mandantenlebenszyklus“ | „ab P3“ in der README; gegen Launch-Umfang prüfen (F-03) |
| C-84 | Die Systemrollen heißen org_admin, engineer, viewer und client_technician. Jeder Endpunkt ist einer Berechtigung zugeordnet; ohne Zuordnung wird der Zugriff verweigert. | README.md §12 „RBAC + ABAC“ | – |
| C-85 | VRFs liegen auf Ebene der Organisation, Standard ist die VRF global. Subnetze sind je Organisation, VRF und CIDR eindeutig. | README.md §4 „Regeln“ | – |
| C-86 | Für das CI-Limit zählen alle nicht gelöschten CIs der Organisation über alle Kunden, gleich ob die Discovery sie angelegt hat oder ein Mensch. | backend/internal/ci/service.go (CountActive); backend/migrations/000186_ci_active_count.up.sql | – |
| C-87 | Findet die Discovery über dem CI-Limit ein neues Gerät, verwirft Reticora es nicht: Es wartet als Review „Nicht lizenziertes CI“ und wird übernommen, sobald das Limit es zulässt. | README.md §14 „Regeln“; backend/internal/discovery/unlicensed.go | Verhältnis zu den Zusatzkosten je CI (C-94) klären: hält das Produkt Mehr-CIs zurück oder berechnet es sie? |
| C-88 | Geräteprofile sind beschreibende Dateien im Collector. Zusätzliche oder geänderte Profile lädt der Collector aus einem Verzeichnis, ohne neue Version. | collector/profiles/README.md „Classification“ (RETICORA_PROFILES_DIR); collector/profiles/profiles.go (LoadDir) | – |
| C-89 | Feldrechte je Attribut und Rolle wirken in REST-API, Suche, Export, Webhooks und Historie. | README.md §12 „RBAC + ABAC“; docs/releases/phase2.md M2.2 | – |
| C-90 | Benachrichtigungen gehen per E-Mail, mit Ruhezeiten, Sammelmeldung und Entdoppelung. | README.md §15 „Benachrichtigungen“ (SMS/Pager dort ab P3, ohne Schlüssel im Entitlement-Code, daher nicht genannt) | SMS/Pager nicht nennen (kein Entitlement-Schlüssel, F-23) |
| C-91 | Die Discovery hebt ein generisches Gerät auf einen bestimmten Typ, ändert aber keinen anderen Typ. Den Hersteller nennt bei unbekannten Geräten die MAC-Adresse. | README.md §6.2 „Reklassifikation“; collector/profiles/README.md „Classification“ (OUI) | – |
| C-92 | Enterprise Shared läuft in der Cloud auf getrennter Infrastruktur. Enterprise Local wird bei Ihnen gehostet; der Preis enthält alle Arbeiten dafür. | Entscheidung W-E14 (docs/project-brief.md der Website); Produkt: README.md §2.1 (Dedicated Instance), docs/betrieb/referenzmodell.md. Angebot vor Go-live bestätigen. | Angebot bestätigen (C-25); Umfang „alle Arbeiten“ vertraglich fassen |
| C-93 | Ein automatischer Isolationstest prüft die Mandantentrennung über alle Zugriffswege. | README.md §16 „Tests“ (Isolationstest über alle Zugriffspfade); docs/releases/phase2.md M2.10 | – |
| C-94 | Jedes CI über dem Limit des Pakets kostet 0,05 € im Monat, jeder Monitoring-Service 0,03 € im Monat, jeweils zuzüglich Mehrwertsteuer. | README.md §14 „Extra-Kosten“; Entscheidungen W-E12, W-E15 (docs/project-brief.md der Website) | „Monitoring-Service“ definieren (was wird gezählt?) |
| C-95 | Die Kontrastverhältnisse der Farbpaare dieser Website sind nach der Formel der WCAG 2 selbst berechnet, nicht von Dritten geprüft. Auf dem Seitengrund erreichen im dunklen Thema Text 16,0 : 1, Vorspann 8,3 : 1, Hinweise 6,4 : 1, Akzentfarbe 9,0 : 1 und Umriss von Bedienelementen 3,9 : 1; im hellen Thema 15,7 : 1, 6,4 : 1, 5,0 : 1, 5,0 : 1 und 3,1 : 1. | docs/design-system.md §3.1, Tabelle „Kontrast nach WCAG 2, selbst berechnet“ | nur als eigene Berechnung nennen, nicht als Prüfung durch Dritte |
| C-96 | Bewegung gibt es nur als Antwort auf eine Handlung, dauert höchstens 150 ms und entfällt bei „Bewegung reduzieren“. Gemessen an den Bewegungen des Netzschemas. | docs/design-system.md §8; tests/e2e/topology.spec.ts (Dauer 0 < d ≤ 0,15 s, reduziert 0 s) | übrige Seitenelemente sind nicht einzeln gemessen |
| C-97 | Jede gebaute Seite beider Sprachen wird bei jeder Änderung automatisch mit axe-core geprüft; zuletzt ohne Befund. | tests/e2e/pages.spec.ts („axe ohne Befunde“); .github/workflows/ci.yml | „automatische Prüfung“, nie „konform“ oder „barrierefrei“ schreiben |
| C-98 | Menü, aufklappbare Belege, Ausfallsimulation und Kontaktformular sind in Browsertests per Tastatur bedient worden. | tests/e2e/components.spec.ts, topology.spec.ts, contact.spec.ts | ersetzt keine Prüfung mit Screenreadern |
| C-99 | Im Modus „Erzwungene Farben“ übernehmen Knöpfe, Netzschema und Ausfallsimulation die Systemfarben; ausgefallene und betroffene CIs bleiben unterscheidbar. | tests/e2e/topology.spec.ts (forcedColors: active) | – |

## 8. Screenshot-Platzhalter

Alle Bilder entstehen später in der Demo-Organisation bzw. mit dem
Simulationsmodus des Collectors (`README.md` §16: 30 deterministische
Geräte), dunkles Thema, 1440 × 900 px in doppelter Auflösung, Oberfläche in
der Sprache der Seite. Keine Kundendaten.

| ID | Motiv | Seite der App | Verwendet auf |
|---|---|---|---|
| S-01 | CI-Liste mit Filter | `CIListPage` | Discovery |
| S-02 | CI-Detail mit Herkunft eines Feldes | `CIDetailPage` | Startseite, Datenqualität |
| S-03 | Review-Inbox mit Vergleichsansicht | `ReviewInboxPage` | Startseite, Datenqualität |
| S-04 | Topologie | `TopologyPage` | Startseite, Topologie |
| S-05 | Rack, Vorderseite | `RackPage` | Startseite, Topologie |
| S-06 | Ausfallsimulation | `TopologyPage` (Impact) | Startseite, Topologie |
| S-07 | Discovery: Scopes und Collector-Status | `DiscoveryPage` | Discovery |
| S-08 | Erste Schritte | `OnboardingPage` | Discovery |
| S-09 | Asset mit Zuweisung | `AssetDetailPage` | Verwaltung |
| S-10 | Inventur | `StocktakeDetailPage` | Verwaltung |
| S-11 | Ticket mit SLA | `TicketDetailPage` | Betrieb |
| S-12 | Monitoring: Metriken und Alarmregeln | `MonitoringPage` | Betrieb |
| S-13 | Compliance: Regeln, Score und Abweichungen | `CompliancePage` | Compliance |
| S-14 | Audit-Protokoll | `AuditPage` | Compliance, Sicherheit |
| S-15 | Webhooks: Abonnements, Zustellverlauf und Dead-Letter-Queue | `WebhooksPage` | API |
| S-16 | Dashboard | `DashboardPage` | Lösungen |
| S-17 | Berechtigungen | `PermissionsPage` | Sicherheit |
| S-18 | Arbeitsbereich Organisation → Kunde → Standort | Kopfzeile der App, `ClientsPage` | Startseite, Lösungen MSP |

API-Schlüssel haben in der App derzeit keine Oberfläche; die API-Seite zeigt
sie als Code-Beispiel. S-12 und S-13 setzen voraus, dass die Demo die
Module für Alarmregeln und Compliance eingeschaltet hat (F-23).

## 9. Formular „Kontakt“

| Feld | Pflicht | Zweck |
|---|---|---|
| Name | ja | Anrede in der Antwort |
| Geschäftliche E-Mail-Adresse | ja | Antwort |
| Unternehmen | ja | Zuordnung, B2B-Bezug |
| Anliegen (Vorführung, Enterprise, Sicherheit und Datenschutz, Sonstiges) | ja | Zuteilung |
| Nachricht | nein | Inhalt der Anfrage |

- Kein Telefonfeld, keine Positionsbezeichnung, keine Größenabfrage: nicht
  erforderlich, um zu antworten.
- Kein Newsletter-Häkchen (F-07).
- Unter dem Formular ein kurzer Hinweis zur Verarbeitung mit Link zur
  Datenschutzerklärung (Text vom Auftraggeber).
- Das Formular sendet ohne JavaScript. Fehler stehen am Feld und in einer
  Zusammenfassung.
- Unsichtbares Köderfeld und Zeitfalle gegen Spam; kein Captcha eines
  Dritten.

## 10. Sprache und Auffindbarkeit

- Deutsch und Englisch erscheinen zum Start (W-E09). Deutsch ist Standard
  unter `www.reticora.de/`, Englisch unter `/en/`, mit `hreflang` in beide
  Richtungen. Inhalte werden zuerst deutsch freigegeben, dann übersetzt; die
  englischen Begriffe folgen der englischen Oberfläche der App.
- Je Seite: eindeutiger Titel, Beschreibung, kanonische URL, Vorschaubild
  ohne Drittdienst, `sitemap.xml`, `robots.txt`.
- Suchbegriffe, um die die Seiten gebaut sind: CMDB für ISP, CMDB für MSP,
  Netzwerk-Discovery, Netzwerkdokumentation automatisch, Rack-Dokumentation,
  Impact-Analyse, CMDB EU-Hosting.
- Strukturierte Daten: Organisation und Produkt; Preise erst nach F-04.
