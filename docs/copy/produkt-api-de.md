# Texte der Seite „API“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/produkt/api/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4; Wörter der App nach `content-plan.md` §6.3 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Ein Verweis auf eine öffentliche API-Referenz erscheint erst, wenn
es sie gibt (F-15).

## Kopf der Seite

- **Titel im Browser:** REST-API, Webhooks und Export – Reticora
- **Beschreibung:** REST-API nach OpenAPI mit additiven Änderungen, Fehlern
  nach RFC 7807 und festen Limits. Signierte Webhooks, CSV- und DATEV-Export,
  Import mit Probelauf.

## Einstieg

- **Überschrift (h1):** Eine REST-API mit festen Regeln.
- **Vorspann:** Die REST-API unter `/api/v1` ist vollständig in OpenAPI
  beschrieben. Änderungen kommen nur hinzu. Was entfällt, kündigt Reticora
  mindestens 12 Monate vorher an. [C-11, C-71]
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Live-Demo“

## 1. Grundsätze

- **Überschrift:** Grundsätze
- **Vorspann:** Diese Regeln gelten für jeden Endpunkt unter `/api/v1`.
- **Kennwerte:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Beschreibung | OpenAPI, vollständig | C-11 |
| Änderungen | nur additiv; Abkündigung mit `Sunset`-Header, mindestens 12 Monate vorher | C-71 |
| Fehler | RFC 7807 mit `trace_id` | C-71 |
| Wiederholung | idempotent für 24 h | C-71 |
| Gleichzeitige Änderungen | Schutz per `ETag` | C-71 |
| Listen | Cursor, 50 Einträge je Seite, höchstens 200; Filter, Sortierung, Auswahl der Felder, Volltext `q` | C-71 |

## 2. Anmeldung und Limits

- **Überschrift:** Anmeldung und Limits
- **Text:** Programme melden sich mit einem API-Schlüssel im Kopf
  `X-API-Key` an. Ein Schlüssel beginnt mit `rk_live_`, gehört einem Nutzer
  oder einem Service-Account und wird nur als Hash gespeichert. Schlüssel
  rotieren mit Überlappung, damit Ihre Integration beim Wechsel nicht
  ausfällt. [C-11, C-75] Ein Schlüssel sieht nur, was seine Rolle sehen darf,
  bis auf das einzelne Feld. [C-33, C-89]
- **Code-Beispiel**, Kopfzeile `GET /api/v1/cis`:

```
# Alle CIs, deren Name „core“ enthält, 50 je Seite
curl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50" \
  -H "X-API-Key: rk_live_…"
```

- **Kennwerte „Limits“:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| je Schlüssel oder Sitzung | 600 Anfragen je Minute | C-38, C-72 |
| je Organisation | 6.000 Anfragen je Minute | C-72 |
| vor der Anmeldung, je IP-Adresse | 20 Anfragen je Minute | C-72 |

## 3. Webhooks

- **Überschrift:** Webhooks
- **Text:** Abonnieren Sie Ereignisse, statt die API abzufragen. Jede
  Zustellung ist mit HMAC-SHA256 signiert; Ihr Empfänger prüft die Signatur
  mit dem gemeinsamen Geheimnis. Schlägt eine Zustellung fehl, wiederholt
  Reticora sie mit wachsendem Abstand von 30 Sekunden bis 6 Stunden. Danach
  landet sie in der Dead-Letter-Queue, und das Abonnement wird deaktiviert.
  [C-73] Auch in Webhooks gelten die Feldrechte. [C-89] Ziele in privaten Netzen oder bei Metadaten-Diensten nimmt
  Reticora nicht an. [C-81]
- **Abbildung:** S-15, „Abb. 1 · Webhooks: Abonnements, Zustellverlauf und
  Dead-Letter-Queue.“

## 4. Export und Import

- **Überschrift:** Export und Import
- **Text:** Der CSV-Export läuft im Hintergrund. Er schreibt UTF-8 mit BOM
  und Semikolon, damit die Datei in Tabellenprogrammen richtig aufgeht,
  enthält nur die Felder, die Sie sehen dürfen, und legt ein Manifest bei. Die
  Adresse zum Herunterladen gilt 15 Minuten. Für die Buchhaltung gibt es den
  DATEV-Export (ab Standard). Beim Import ordnen Sie die Spalten über ein
  gespeichertes Profil zu und starten zuerst einen Probelauf. [C-74, C-11]

## 5. Massenänderungen

- **Überschrift:** Massenänderungen
- **Text:** Eine Massenänderung umfasst bis 500 IDs. Ab 100 IDs läuft sie als
  Job im Hintergrund und liefert einen Bericht, welche Einträge nicht
  geändert werden konnten. [C-76]

## Abschluss

- Abschlussband wie auf allen Seiten: „30 Tage testen“ (Hauptknopf),
  „Live-Demo“, „Kontakt“; darunter „Angebot nur für Unternehmen.“
