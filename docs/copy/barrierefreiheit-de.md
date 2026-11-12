# Texte der Seite „Barrierefreiheit“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/barrierefreiheit/` (Thema „Dokument“) |
| Regeln | nur nachweisbare Angaben; keine Erklärung der Konformität mit BFSG, BITV oder WCAG; Kontaktweg als Platzhalter |

Die Angaben betreffen die Website, nicht die Anwendung. Sie stützen sich auf
die Prüfungen in `tests/` (axe-core in den Browsertests, Tastaturtests) und
auf die Kontrastwerte in `design-system.md` §3.1. Ein Claim aus dem Register
des Produkts wird hier nicht gebraucht; Quelle ist jeweils dieses Repository.
Vor dem Go-live prüfen: Laufen axe und die Tastaturtests auf jeder Seite der
Sitemap grün?

## Kopf der Seite

- **Titel im Browser:** Barrierefreiheit – Reticora
- **Beschreibung:** Wie wir diese Website auf Barrierefreiheit prüfen,
  welche Kontraste gelten, was bekannt eingeschränkt ist und wie Sie uns
  Hinweise geben.

## Einstieg

- **Überschrift (h1):** Barrierefreiheit dieser Website
- **Vorspann:** Hier steht, was wir an dieser Website prüfen, mit welchem
  Ergebnis und wo es Grenzen gibt. Die Angaben gelten für die Website, nicht
  für die Anwendung Reticora.
- **Stand:** 12. November 2026

## 1. Wie wir prüfen

- **Überschrift:** Wie wir prüfen
- **Liste:**
  - Jede Seite wird bei jeder Änderung automatisch mit axe-core geprüft.
    Stand heute: ohne Befund.
  - Mit der Tastatur geprüft und bedienbar: das Menü, die aufklappbaren
    Belege, die Ausfallsimulation und das Kontaktformular.
  - Die Ausfallsimulation hat zusätzlich zu den Punkten im Schema einen
    Umschaltknopf je CI und eine Ergebniszeile, die Screenreader vorlesen.

## 2. Kontraste

- **Überschrift:** Kontraste
- **Text:** Die Farben sind so gewählt, dass Text mindestens das
  Kontrastverhältnis 4,5 : 1 und Umrisse von Bedienelementen mindestens 3 : 1
  erreichen. Die Werte sind nach der Formel der WCAG 2 berechnet.
- **Tabelle** (Werte aus `design-system.md` §3.1):

| Paar | dunkles Thema „Leitstand“ | helles Thema „Dokument“ | Mindestwert |
|---|---|---|---|
| Text auf Seitengrund | 16,0 : 1 | 15,7 : 1 | 4,5 : 1 |
| Vorspann und Beschreibungen auf Seitengrund | 8,3 : 1 | 6,4 : 1 | 4,5 : 1 |
| Hinweise und Bildunterschriften auf Seitengrund | 6,4 : 1 | 5,0 : 1 | 4,5 : 1 |
| Akzentfarbe auf Seitengrund | 9,0 : 1 | 5,0 : 1 | 4,5 : 1 |
| Umriss von Bedienelementen auf Seitengrund | 3,9 : 1 | 3,1 : 1 | 3,0 : 1 |

## 3. Bewegung und Darstellung

- **Überschrift:** Bewegung und Darstellung
- **Text:** Bewegung gibt es nur als Antwort auf eine Handlung, höchstens
  150 ms lang. Ist im System „Bewegung reduzieren“ eingestellt, entfällt sie
  ganz. Im Modus „Erzwungene Farben“ (etwa dem Kontrastmodus von Windows)
  übernehmen Knöpfe, Netzschema und Ausfallsimulation die Systemfarben;
  ausgefallene und betroffene CIs bleiben unterscheidbar. Farbe trägt nie allein eine
  Aussage: Zustände haben ein Wort, das Netzschema eine Ergebniszeile.

## 4. Bekannte Einschränkungen

- **Überschrift:** Bekannte Einschränkungen
- **Liste:**
  - Die Bilder der Anwendung sind noch Platzhalter. Jeder Platzhalter nennt
    in Text, was später zu sehen sein wird.
  - Schemazeichnungen wie das Netzschema sind vereinfacht. Ihr Inhalt steht
    zusätzlich als Text daneben: Die Ergebniszeile nennt jedes betroffene CI
    beim Namen.

## 5. Hinweise an uns

- **Überschrift:** Hinweise an uns
- **Text:** Ist Ihnen eine Barriere aufgefallen? Schreiben Sie uns:
  „[Kontaktweg für Hinweise zur Barrierefreiheit: Angabe vom Anbieter]“
  (Platzhalter mit `data-placeholder`).
