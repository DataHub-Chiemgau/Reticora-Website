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
| Collector, Discovery, Scope | Collector, Discovery, Scope |
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
