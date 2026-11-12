# Texte der Seite „Datenqualität“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/produkt/datenqualitaet/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4; Wörter der App nach `content-plan.md` §6.3 |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg.

## Kopf der Seite

- **Titel im Browser:** Datenqualität – jeder Wert mit Herkunft
- **Beschreibung:** Wie Reticora ein Gerät eindeutig erkennt, welche Quelle
  gewinnt und warum manuelle Werte bleiben. Mit Quellrängen, Herkunft je Feld
  und Review-Inbox.

## Einstieg

- **Überschrift (h1):** Ein Gerät, ein CI. Jeder Wert mit Quelle.
- **Vorspann:** Reticora führt Beobachtungen aus mehreren Quellen zu einem
  CI zusammen – einem Eintrag in der CMDB. Dabei gelten feste Regeln: welcher
  Schlüssel ein Gerät erkennt, welche Quelle gewinnt und wann ein Mensch
  entscheidet. Dieser Abgleich heißt in der App Reconciliation.
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Live-Demo“

## 1. Fünf Schlüssel in fester Reihenfolge

- **Überschrift:** Fünf Schlüssel in fester Reihenfolge
- **Vorspann:** Bevor ein Wert in ein CI gelangt, klärt Reticora, zu welchem
  Gerät er gehört. Geprüft wird innerhalb eines Kunden, Schlüssel für
  Schlüssel. [C-45]
- **Tabelle:**

| Nr. | Schlüssel | Regel | Claim |
|---|---|---|---|
| 1 | Seriennummer | Platzhalter wie „To be filled by O.E.M.“ zählen nicht. | C-45 |
| 2 | Hardware-UUID | Bekannte Klon-UUIDs zählen nicht; virtuelle Maschinen brauchen zusätzlich MAC oder Hostname. | C-45 |
| 3 | MAC-Adressen | Eine eindeutige Schnittmenge; lokal administrierte und VRRP-, HSRP- und CARP-Adressen zählen nicht. | C-45 |
| 4 | Management-IP und sysObjectID | nur in derselben VRF | C-45 |
| 5 | Hostname oder FQDN | Führt nie zum automatischen Zusammenführen, nur zu einem Review „Wahrscheinliches Duplikat“. | C-05, C-49 |

- **Satz unter der Tabelle:** Aus einem Gerät wird so nie ein zweites CI,
  und zwei Geräte mit demselben Namen werden nie still eins. [C-05]

## 2. Welche Quelle gewinnt

- **Überschrift:** Welche Quelle gewinnt
- **Text:** Melden zwei Quellen für dasselbe Feld verschiedene Werte, gilt
  der Wert der Quelle mit dem höheren Rang. Ein Wert wird nur übernommen,
  wenn seine Beobachtung neuer ist als die des gespeicherten Werts. Es zählt
  der Zeitpunkt der Beobachtung, nicht der Eingang. [C-46, C-47]
- **Tabelle „Rangfolge der Quellen“:**

| Quelle | Rang |
|---|---|
| manuell, Override | 100 |
| Import | 95 |
| Workflow | 92 |
| Redfish | 90 |
| Agent | 85 |
| SNMP | 80 |
| API, Integration | 75 |
| WMI | 70 |
| SSH, NAS | 60 |
| Sweep | 20 |

  Beleg der Tabelle: C-46.
- **Herkunft je Feld:** Zu jedem Feld zeigt die CI-Ansicht Quelle, Rang,
  Zeitpunkt der Beobachtung und den Grund, warum dieser Wert gilt: manueller
  Override, höchstrangige Quelle, Wert aus dem Asset oder Wert des
  CI-Datensatzes. [C-03]
- **Abbildung:** S-02, „Abb. 1 · Herkunft eines Feldes in der CI-Ansicht.“

## 3. Manuell gewinnt

- **Überschrift:** Manuell gewinnt
- **Text:** Was Sie von Hand setzen, ist ein Override. Ihn überschreibt keine
  Quelle, auch kein Workflow. [C-04, C-65] Meldet eine Quelle später einen
  anderen Wert, entsteht ein Review „Konflikt mit Override“. Sie sehen beide
  Werte und entscheiden, ob Ihr Wert bleibt. [C-47, C-49] Kaufmännische
  Daten wie Seriennummer, Standort und Kaufdaten führt das Asset; das CI zeigt
  sie nur an. [C-56]

## 4. Die Review-Inbox: drei typische Fälle

- **Überschrift:** Die Review-Inbox: drei typische Fälle
- **Vorspann:** Die Review-Inbox sammelt, was die Automatik nicht allein
  entscheiden darf. Sie vergleichen Beobachtung und CI nebeneinander und
  entscheiden: zusammenführen, neu anlegen, übernehmen oder verwerfen.
  Ohne Ihre Entscheidung wird nichts verworfen. [C-30, C-04]
- **Fälle:**

| Fall | Was Reticora zeigt | Was Sie tun | Claim |
|---|---|---|---|
| Unbekanntes Gerät | Kein Profil passt. Reticora legt ein generisches Gerät an; den Hersteller nennt die MAC-Adresse. | Typ setzen, Review erledigen. | C-40, C-91 |
| Mögliche Dublette | Ein neues Gerät trägt denselben Hostnamen wie ein vorhandenes CI, die übrigen Schlüssel passen nicht. | Zusammenführen, wenn es dasselbe Gerät ist; sonst neu anlegen. | C-05, C-49 |
| Abweichende Seriennummer | Die Discovery meldet eine andere Seriennummer, als im Asset steht – etwa nach einem Tausch der Hauptplatine. | Wert übernehmen oder verwerfen. | C-49, C-56 |

- **Weitere Arten von Reviews:** mehrdeutige Identität, widersprüchliche
  Werte, wiedergekehrtes Gerät, doppelte IP-Adresse, nicht lizenziertes CI,
  Scope-Vorschlag. [C-49]
- **Abbildung:** S-03, „Abb. 2 · Review-Inbox: Beobachtung und CI im
  Vergleich.“

## 5. Zusammenführen lässt sich rückgängig machen

- **Überschrift:** Zusammenführen lässt sich rückgängig machen
- **Text:** Führen Sie zwei CIs zusammen, hängt Reticora alle Bezüge auf das
  verbleibende CI um; das alte leitet weiter.
  Stellt sich der Schritt als falsch heraus, machen Sie ihn innerhalb von
  30 Tagen rückgängig. Ein gelöschtes CI stellen Sie 90 Tage lang wieder her.
  [C-48]

## 6. Was nicht mehr gesehen wird

- **Überschrift:** Was nicht mehr gesehen wird
- **Text:** Antwortet ein Gerät nicht mehr, verschwindet es nicht. Nach dem
  Dreifachen des Scope-Intervalls ohne Sichtung erhält das CI den Status
  „unknown“. Von Hand angelegte CIs bleiben, wie sie sind. [C-44] Meldet die
  Discovery ein Gerät, dessen CI gelöscht wurde, legt Reticora es nicht
  einfach neu an: Die Review-Inbox zeigt ein „Wiedergekehrtes Gerät“, und Sie
  entscheiden. [C-49]

## Abschluss

- Abschlussband wie auf allen Seiten: „30 Tage testen“ (Hauptknopf),
  „Live-Demo“, „Kontakt“; darunter „Angebot nur für Unternehmen.“
