# Texte der Seite „Compliance“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/produkt/compliance/` |
| Regeln | `content-plan.md` §1, §6; `brand-strategy.md` §4; C-19: Berichtsfunktion, keine Zertifizierung, keine Garantie der Konformität |

Jede Aussage mit Zahl oder Sicherheitsbezug nennt in eckigen Klammern ihren
Eintrag im Claim-Register (`content-plan.md` §7). Auf der Seite wird daraus
ein Beleg. Handlungsaufruf dieser Seite ist „Kontakt“ (`content-plan.md` §2).

## Kopf der Seite

- **Titel im Browser:** Compliance und Audit – Reticora
- **Beschreibung:** Audit-Protokoll mit Hash-Kette, Compliance-Regeln je
  CI-Typ mit Score und Befunden, Berichte für ISO 27001, NIS2 und KRITIS, IGA
  als Add-on.

## Einstieg

- **Überschrift (h1):** Nachweise aus dem Bestand, nicht aus dem Gedächtnis.
- **Vorspann:** Wer prüft, braucht zwei Dinge: ein Protokoll, an dem sich
  nichts unbemerkt ändern lässt, und Regeln, die zeigen, wo der Bestand
  abweicht. Beides arbeitet in Reticora auf denselben CIs.
- **Knöpfe:** „Kontakt“ (Hauptknopf, Anliegen „Sicherheit und
  Datenschutz“), „Live-Demo“

## 1. Audit-Protokoll mit Hash-Kette

- **Überschrift:** Audit-Protokoll mit Hash-Kette
- **Text:** Jede Änderung landet im Audit-Protokoll Ihrer Organisation. Die
  Einträge sind zu einer Hash-Kette verbunden: Wird ein Eintrag nachträglich
  geändert oder entfernt, bricht die Kette an dieser Stelle. Sie prüfen die
  Kette in der Anwendung oder mit dem Kommandozeilenwerkzeug `audit-verify`.
  [C-12, C-69] Daneben führt Reticora zu jedem CI die Feldhistorie: wer oder
  welche Quelle wann welchen Wert gesetzt hat. [C-69, C-03]
- **Kennwerte:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| Kette | je Organisation | C-12 |
| Prüfung | in der Anwendung und per `audit-verify` | C-69 |
| Aufbewahrung Audit-Protokoll | 10 Jahre | C-69 |
| Aufbewahrung Feldhistorie | 3 Jahre | C-69 |
| Zugriffe des Plattformbetriebs | eigenes Protokoll mit Hash-Kette | C-82 |

- **Abbildung:** S-14, „Abb. 1 · Audit-Protokoll.“

## 2. Compliance-Regeln und Score

- **Überschrift:** Compliance-Regeln und Score
- **Text:** Eine Compliance-Regel gilt für einen CI-Typ und prüft dessen
  Felder, zum Beispiel ob auf allen Firewalls eine unterstützte
  Firmware-Version steht. Sie bauen die Regel im Klick-Builder und geben ihr
  Schweregrad, Kategorie und einen Hinweis zur Behebung. Reticora wertet jedes
  CI aus: bestanden, fehlgeschlagen oder nicht anwendbar. Daraus entsteht ein
  Score, gesamt und je CI-Typ (ab Enterprise). [C-67]
- **Abbildung:** S-13, „Abb. 2 · Compliance: Regeln, Score und
  Abweichungen.“

## 3. Befunde mit den betroffenen CIs

- **Überschrift:** Befunde mit den betroffenen CIs
- **Text:** Jede fehlgeschlagene Regel wird zum Befund. Er nennt Regel,
  Schweregrad und Kategorie, den Hinweis zur Behebung und die betroffenen CIs.
  Befunde sind nach Schweregrad sortiert, damit das Wichtigste oben steht.
  [C-68]

## 4. Berichte für ISO 27001, NIS2 und KRITIS

- **Überschrift:** Berichte für ISO 27001, NIS2 und KRITIS
- **Text:** Reticora erstellt einen Bericht für Ihre Prüfung. Er enthält: Ergebnis der Prüfung der Audit-Kette, Score, Befunde nach
  Schweregrad mit den betroffenen CIs und die Sicherheitsfunktionen, die in
  Ihrer Organisation eingeschaltet sind. [C-68] Der Bericht liefert Nachweise
  für Ihre Prüfung. Er ersetzt sie nicht, und er bescheinigt keine
  Konformität. [C-19]

## 5. IGA als Add-on

- **Überschrift:** IGA als Add-on
- **Text:** Mit dem Add-on IGA steuern Sie Berechtigungen in angebundenen
  Systemen: Eintritt, Wechsel und Austritt von Personen, Zugriffsanträge mit
  Genehmigung, regelmäßige Access-Reviews und die Erkennung von Abweichungen.
  Korrekturen laufen nur, wenn eine zweite Person zustimmt. Schreibende
  Connectoren laufen als eigener Prozess mit eigenem Enrollment und den
  geringsten nötigen Rechten. [C-70] IGA ist zu jedem Paket zubuchbar; den
  Preis nennen wir auf Anfrage.
- **Verweis:** „Preise und Add-ons“ → `/preise/`

## Abschluss

- **Überschrift:** Sie bereiten eine Prüfung vor?
- **Text:** Schreiben Sie uns, was Ihre Prüfung verlangt. Wir zeigen Ihnen
  Audit-Protokoll, Regeln und Bericht an einem Beispiel.
- **Knöpfe:** „Kontakt“ (Hauptknopf, Anliegen „Sicherheit und Datenschutz“),
  „Live-Demo“, „30 Tage testen“
- **Zeile darunter:** Angebot nur für Unternehmen.
