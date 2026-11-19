# Texte der Seite „Sicherheit“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/sicherheit/` |
| Regeln | `content-plan.md` §1, §6, §7 (C-16 und C-17 werden nicht genannt); `brand-strategy.md` §4; keine Rechtstexte |

Jede Aussage mit Zahl, Sicherheits- oder Datenschutzbezug nennt in eckigen
Klammern ihren Eintrag im Claim-Register (`content-plan.md` §7). Auf der
Seite wird daraus ein Beleg. Nicht genannt werden: Penetrationstest (C-16),
Verfügbarkeit, RPO und RTO (C-17), Zertifizierungen.

## Kopf der Seite

- **Titel im Browser:** Sicherheit und Datenschutz – Reticora
- **Beschreibung:** Betriebsmodelle, Verbindungsrichtung und Ports,
  Mandantentrennung in der Datenbank, verschlüsselte Zugangsdaten, MFA,
  Audit-Kette und Datenstandort EU.

## Einstieg

- **Überschrift (h1):** Was Ihre Informationssicherheit wissen will.
- **Vorspann:** Diese Seite beantwortet die Fragen einer Erstprüfung: wo die
  Daten liegen, welche Verbindungen es gibt, wie Kunden getrennt sind, wer
  sich wie anmeldet und was protokolliert wird. Jede Angabe hat einen Beleg.
- **Knöpfe:** „Kontakt“ (Hauptknopf, Anliegen „Sicherheit und
  Datenschutz“), „Live-Demo“

## 1. Betriebsmodelle

- **Überschrift:** Betriebsmodelle
- **Tabelle:**

| Modell | Pakete | Wo Reticora läuft | Claim |
|---|---|---|---|
| Cloud | Essentials, Standard, Pro | in der EU; der Collector läuft in Ihrem Netz | C-07, C-02 |
| Enterprise Shared | Enterprise Shared | in der Cloud auf getrennter Infrastruktur | C-92 |
| Enterprise Local | Enterprise Local | bei Ihnen gehostet; der Preis enthält alle Arbeiten dafür | C-92 |

## 2. Verbindungen und Ports

- **Überschrift:** Verbindungen und Ports
- **Text:** Der Collector baut jede Verbindung selbst auf, nach außen, zu
  festen Hostnamen. Reticora öffnet nie eine Verbindung in Ihr Netz; Sie
  brauchen keine eingehende Regel, kein VPN und keine Portweiterleitung.
  Für HTTPS ist ein Proxy möglich; Port 4222 braucht eine direkte Verbindung,
  weil sich der Collector dort mit seinem Zertifikat ausweist. [C-02, C-77]
- **Tabelle:**

| Richtung | Port | Zweck | Claim |
|---|---|---|---|
| Collector → Reticora | 443/TCP, HTTPS | Enrollment mit Einmal-Code, Updates | C-02, C-41 |
| Collector → Reticora | 4222/TCP, NATS mit mTLS | Ergebnisse der Discovery, Metriken, Lebenszeichen, Zugangsdaten | C-02, C-77 |
| Collector → Geräte in Ihrem Netz | ICMP, ARP, 22, 80, 443, 161/UDP, 623, 5985, 8006 | Discovery; verlässt Ihr Netz nicht | C-39, C-77 |

- **Abbildung:** Schemazeichnung „Verbindungsrichtung“. Unterschrift:
  „Abb. 1 · Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit
  mTLS 4222. Schemazeichnung.“
- **Kennwerte „Collector“:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Enrollment-Code | gilt 24 h, nur einmal | C-41 |
| Zertifikat | 90 Tage, erneuert sich selbst; Sperre per Widerruf | C-41 |
| Kanal | nur der eigene; gesperrte Zertifikate und deaktivierte Collectors werden abgewiesen | C-77 |
| Updates | nur signiert | C-42 |

## 3. Trennung der Kunden

- **Überschrift:** Trennung der Kunden
- **Text:** Die Trennung zwischen Organisationen, Kunden, Standorten und
  Teams erzwingt die Datenbank selbst: Row-Level Security auf den
  Mandantentabellen, Metrik-Zeitreihen über eigene Sichten. [C-06] Die
  Anwendung greift mit einer Rolle ohne Superuser-Recht und ohne `BYPASSRLS`
  zu; Lesen und Schreiben prüfen dieselben Bedingungen. [C-78] Ein
  automatischer Test prüft die Trennung über alle Zugriffswege. [C-93]

## 4. Zugangsdaten und Schlüssel

- **Überschrift:** Zugangsdaten und Schlüssel
- **Text:** Zugangsdaten für Ihre Geräte speichert Reticora verschlüsselt
  (AES-256-GCM, mit einem Datenschlüssel je Organisation). An den Collector
  gehen sie über den mTLS-Kanal und zusätzlich auf seinen Schlüssel
  verschlüsselt. Im Klartext existieren sie nur im Arbeitsspeicher, nie auf
  Datenträgern, in API-Antworten oder Logs. [C-13, C-80]
- **Kennwerte:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Signaturschlüssel der Sitzungen | Wechsel alle 90 Tage | C-80 |
| Datenschlüssel je Organisation | Wechsel jährlich | C-80 |
| Hauptschlüssel | neu verpackt ohne Ausfallzeit | C-80 |
| API-Schlüssel | nur als Hash gespeichert, Rotation mit Überlappung | C-75 |

## 5. Anmeldung und Rechte

- **Überschrift:** Anmeldung und Rechte
- **Text:** Die Anmeldung läuft über OIDC mit PKCE; ein Sitzungstoken gilt
  15 Minuten. Ihren eigenen Identity-Provider binden Sie je Organisation an.
  Einladungen gelten 7 Tage, eine Deaktivierung wirkt sofort. [C-79] Der
  zweite Faktor ist für Administratoren Pflicht. [C-34] Rollen gelten für die
  Organisation, einen Kunden, einen Standort oder ein Team; jeder Endpunkt
  ist einer Berechtigung zugeordnet, ohne Zuordnung wird verweigert. [C-33,
  C-84] Feldrechte wirken bis in API, Suche, Export und Webhooks. [C-89]
  Adressen für Webhooks und Importe dürfen nicht auf private Netze oder
  Metadaten-Dienste zeigen. [C-81]
- **Abbildung:** S-17, „Abb. 2 · Berechtigungen.“

## 6. Protokoll und Zugriffe des Betriebs

- **Überschrift:** Protokoll und Zugriffe des Betriebs
- **Text:** Das Audit-Protokoll ist je Organisation als Hash-Kette aufgebaut;
  Sie prüfen es in der Anwendung oder mit `audit-verify`. Es wird 10 Jahre
  aufbewahrt. [C-12, C-69] Das Personal des Plattformbetriebs arbeitet mit
  persönlichen Identitäten und zweitem Faktor. Jede Nutzung des
  Notfallzugangs löst einen Alarm aus, und diese Zugriffe stehen in einem
  eigenen Protokoll mit Hash-Kette. [C-82]
- **Abbildung:** S-14, „Abb. 3 · Audit-Protokoll.“

## 7. Datenschutz und Datenstandort

- **Überschrift:** Datenschutz und Datenstandort
- **Text:** Daten, Backups, Logs und Suchindex liegen in der EU. [C-07]
  Personenbezogene Daten liegen in einem eigenen Tresor; überall sonst stehen
  nur Platzhalter-IDs. Gelöscht wird durch Vernichten des Schlüssels, ohne
  die Audit-Kette zu brechen. [C-14] Sie können Ihre Organisation vollständig
  exportieren; eine Löschung der Organisation wird nach 30 Tagen Karenz
  wirksam. [C-83] Das Add-on für den KI-Assistenten verarbeitet in der EU oder
  selbst betrieben, trainiert nicht mit Ihren Daten und wird je Organisation
  eingeschaltet. [C-20]
- **Verweise:** „Subprozessoren“ → `/subprozessoren/` (Liste vom Anbieter);
  „Datenschutzerklärung“ → `/datenschutz/`
- **Platzhalter:** „[Auftragsverarbeitung: Angabe vom Anbieter]“

## 8. Lieferkette und Uploads

- **Überschrift:** Lieferkette und Uploads
- **Text:** Release-Artefakte sind signiert, zu jedem Release gibt es eine
  SBOM. Der Collector installiert nur signierte Updates. [C-15, C-42]
  Hochgeladene Dokumente werden vor dem ersten Download auf Schadsoftware
  geprüft; bis dahin ist der Download gesperrt. [C-60]

## 9. Sicherheitslücke melden

- **Überschrift:** Sicherheitslücke melden
- **Text:** Haben Sie eine Schwachstelle gefunden, schreiben Sie uns bitte
  direkt: „[Meldeweg für Sicherheitslücken: Adresse vom Anbieter]“.
- **Hinweis für die Umsetzung:** Platzhalter mit `data-placeholder`; die
  Adresse kommt auch in `/.well-known/security.txt`, sobald sie feststeht.

## Abschluss

- **Überschrift:** Ihre Prüfung braucht mehr?
- **Text:** Schreiben Sie uns, welche Fragen offen sind.
- **Knöpfe:** „Kontakt“ (Hauptknopf, Anliegen „Sicherheit und
  Datenschutz“), „Live-Demo“, „30 Tage testen“
- **Zeile darunter:** Angebot nur für Unternehmen.
