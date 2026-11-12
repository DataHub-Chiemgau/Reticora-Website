# Texte der Seiten „Kontakt“ und „Danke“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adressen | `/kontakt/`, `/kontakt/danke/` (`noindex`) |
| Regeln | `content-plan.md` §9; `specs/2026-11-12-website-spec.md` §6 (Feldgrenzen, Rate-Limit); keine Rechtstexte |

Der Hinweis zur Verarbeitung ist ein Platzhalter; den Text liefert der
Anbieter. Die direkten Kontaktdaten kommen aus `SITE` (`src/data/site.ts`);
fehlende Angaben stehen als Platzhalter mit `data-placeholder`.

## Kontakt: Kopf der Seite

- **Titel im Browser:** Kontakt – Reticora
- **Beschreibung:** Vorführung, Enterprise, Sicherheit und Datenschutz oder
  eine andere Frage: Schreiben Sie uns über das Formular. Angebot nur für
  Unternehmen.

## Kontakt: Einstieg

- **Überschrift (h1):** Kontakt
- **Vorspann:** Schreiben Sie uns, worum es geht. Wir antworten an Ihre
  geschäftliche E-Mail-Adresse.
- **Zeile darunter:** Angebot nur für Unternehmen.

## Formular

- **Zeile über dem Formular:** Felder mit „(Pflicht)“ müssen ausgefüllt
  sein.

| Feld | Beschriftung | Pflicht | Hilfetext | `autocomplete` |
|---|---|---|---|---|
| `name` | Name (Pflicht) | ja | – | `name` |
| `email` | Geschäftliche E-Mail-Adresse (Pflicht) | ja | An diese Adresse antworten wir. | `email` |
| `company` | Unternehmen (Pflicht) | ja | – | `organization` |
| `topic` | Anliegen (Pflicht) | ja | – | `off` |
| `message` | Nachricht | nein | Höchstens 4.000 Zeichen. | `off` |

- **Auswahl „Anliegen“:** erste Option „Bitte wählen“ (leer), dann:

| Wert | Text |
|---|---|
| `demo` | Vorführung |
| `enterprise` | Enterprise |
| `security` | Sicherheit und Datenschutz |
| `other` | Sonstiges |

- **Knopf:** „Nachricht senden“; während des Sendens „Wird gesendet …“
- **Hinweis zur Verarbeitung** (unter dem Knopf, mit `data-placeholder`):
  „[Hinweis zur Verarbeitung: Text vom Anbieter]“ mit Link
  „Datenschutzerklärung“ → `/datenschutz/`
- **Köderfeld** (für Hilfstechnik verborgen, nicht fokussierbar):
  Beschriftung „Bitte leer lassen“.

## Fehlertexte

- **Zusammenfassung** (über dem Formular, erhält den Fokus):
  - Überschrift bei einem Fehler: „Bitte korrigieren Sie 1 Angabe.“
  - Überschrift bei mehreren: „Bitte korrigieren Sie {n} Angaben.“
  - Darunter je Fehler ein Link zum Feld mit dem Fehlertext.
- **Allgemeine Zeile ohne JavaScript** (`#fehler`): „Das Formular wurde
  nicht gesendet. Bitte prüfen Sie Ihre Angaben.“

| Code | Feld | Text am Feld |
|---|---|---|
| `required` | `name` | Bitte geben Sie Ihren Namen an. |
| `required` | `email` | Bitte geben Sie Ihre geschäftliche E-Mail-Adresse an. |
| `required` | `company` | Bitte geben Sie Ihr Unternehmen an. |
| `required` | `topic` | Bitte wählen Sie ein Anliegen. |
| `too_long` | `name` | Der Name ist zu lang. Erlaubt sind höchstens 200 Zeichen. |
| `too_long` | `email` | Die E-Mail-Adresse ist zu lang. Erlaubt sind höchstens 254 Zeichen. |
| `too_long` | `company` | Der Name des Unternehmens ist zu lang. Erlaubt sind höchstens 200 Zeichen. |
| `too_long` | `message` | Die Nachricht ist zu lang. Erlaubt sind höchstens 4.000 Zeichen. |
| `invalid` | `email` | Bitte geben Sie eine gültige E-Mail-Adresse an, zum Beispiel name@example.com. |
| `invalid` | `topic` | Bitte wählen Sie eines der vier Anliegen aus der Liste. |
| `invalid` | `name`, `company` | Bitte verwenden Sie keine Zeilenumbrüche oder Steuerzeichen. |

| Fehler der Anfrage | Text (über dem Formular) |
|---|---|
| Rate-Limit (`429`) | Sie haben in kurzer Zeit mehrere Nachrichten gesendet. Bitte versuchen Sie es in einer Stunde erneut. |
| Fehler des Servers (`5xx`) oder keine Verbindung | Ihre Nachricht konnte gerade nicht gesendet werden. Bitte versuchen Sie es in einigen Minuten erneut. |

Die Frist „in einer Stunde“ folgt dem Rate-Limit der Spezifikation
(höchstens 5 Anfragen je Herkunft und Stunde).

## Direkter Kontakt (neben dem Formular)

- **Überschrift:** Anbieter
- **Inhalt aus `SITE`:** Firma, Straße, Ort.
- **Platzhalter für fehlende Angaben:** „[E-Mail-Adresse: Angabe vom
  Anbieter]“, „[Telefon: Angabe vom Anbieter]“
- **Verweis:** „Impressum“ → `/impressum/`

## Danke: Kopf der Seite

- **Titel im Browser:** Vielen Dank – Reticora
- **Beschreibung:** Ihre Nachricht ist bei uns angekommen.
- **Robots:** `noindex`

## Danke: Inhalt

- **Überschrift (h1):** Vielen Dank für Ihre Nachricht.
- **Text:** Ihre Anfrage ist bei uns angekommen. Wir antworten an die
  E-Mail-Adresse, die Sie angegeben haben.
- **Weiter:** „Live-Demo öffnen“ → `/demo/`, „Zur Startseite“ → `/`
