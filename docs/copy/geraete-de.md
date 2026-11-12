# Texte der Seite „Geräte“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/geraete/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4–§5 (Herstellernamen nur als Text) |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Die Tabelle kommt aus
`src/data/devices.ts` (abgeleitet aus `collector/profiles` des Produkts).

## Kopf der Seite

- **Titel im Browser:** Unterstützte Geräte und Protokolle – Reticora
- **Beschreibung:** Welche Switches, Router, Firewalls, Server, NAS, USVs
  und PDUs der Collector erkennt, über welche Protokolle, und was mit
  unbekannten Geräten geschieht.

## Einstieg

- **Überschrift (h1):** Wird Ihr Gerät erkannt?
- **Vorspann:** Der Collector bringt Profile für verbreitete Netzwerk-,
  Server-, Storage- und Stromgeräte mit. Die Tabelle zeigt jede Gerätefamilie
  mit den Protokollen, über die Reticora sie erkennt und ausliest. [C-08]
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Live-Demo“

## 1. Gerätefamilien

- **Überschrift:** Gerätefamilien
- **Filter** (Gruppe von Umschaltknöpfen, Bezeichnung „Kategorie“):
  „Alle“, „Netzwerk“, „Server und Virtualisierung“, „Storage“, „Strom“.
  Ohne JavaScript steht die ganze Tabelle, nach Kategorie gegliedert.
- **Sprungmarken ohne JavaScript** (Navigation über der Tabelle, Bezeichnung
  „Zu einer Kategorie springen“): je Kategorie ein Anker mit „{Kategorie} ({n})“
  auf die Gruppe in der Tabelle (Ä-17). Mit JavaScript ersetzt der Filter sie.
- **Tabelle**, Spalten: „Hersteller“, „Familie“, „Kategorie“, „Protokolle“.
  Werte aus `DEVICES`; Kategorien: `network` = Netzwerk, `server` = Server
  und Virtualisierung, `storage` = Storage, `power` = Strom. [C-08]
- **Hinweis über der Tabelle auf schmalen Bildschirmen:** „Die Tabelle lässt
  sich seitlich verschieben.“
- **Ergebniszeile des Filters** (Live-Region): „{n} Gerätefamilien“ bzw.
  „1 Gerätefamilie“.
- **Bildunterschrift (`caption`):** Herstellernamen sind Marken ihrer
  Inhaber und stehen hier nur zur Beschreibung der Kompatibilität.

## 2. So erkennt der Collector ein Gerät

- **Überschrift:** So erkennt der Collector ein Gerät
- **Text:** Für jedes gefundene Gerät geht der Collector in fester
  Reihenfolge vor: zuerst die Antwort auf SNMP (sysObjectID und
  Beschreibung), dann Redfish (Hersteller und Modell des Server-Controllers),
  dann das Banner eines Dienstes wie SSH. Dazu nimmt er die Herstellerkennung
  aus der MAC-Adresse. Das erste passende Profil legt Typ, Hersteller und
  Modell fest. [C-40]
- **Verweis:** „Protokolle und Ablauf der Discovery“ →
  `/produkt/discovery/`

## 3. Was mit unbekannten Geräten geschieht

- **Überschrift:** Was mit unbekannten Geräten geschieht
- **Text:** Passt kein Profil, legt Reticora das Gerät trotzdem an, als
  generisches Gerät. Den Hersteller nennt die MAC-Adresse, und in der
  Review-Inbox wartet ein Review „Unklassifiziertes Gerät“. Sie setzen den
  Typ am CI und erledigen das Review. [C-40, C-49] Ein generisches Gerät hebt
  die Discovery später auf einen bestimmten Typ; einen anderen Typ, etwa den,
  den Sie gesetzt haben, ändert sie nie. [C-91]

## 4. Profile ergänzen

- **Überschrift:** Profile ergänzen
- **Text:** Ein Profil ist eine beschreibende Datei: woran ein Gerät zu
  erkennen ist und welche Werte der Collector abfragt. Zusätzliche oder
  geänderte Profile lädt der Collector aus einem Verzeichnis, ohne dass Sie
  auf eine neue Version warten. [C-88] Fehlt Ihnen eine Familie, schreiben Sie
  uns.
- **Verweis:** „Kontakt“ → `/kontakt/`

## Abschluss

- Abschlussband wie auf allen Seiten: „30 Tage testen“ (Hauptknopf),
  „Live-Demo“, „Kontakt“; darunter „Angebot nur für Unternehmen.“
