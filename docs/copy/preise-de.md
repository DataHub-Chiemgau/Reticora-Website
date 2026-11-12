# Texte der Seite „Preise“ (Deutsch)

| | |
|---|---|
| Stand | 2026-11-12 |
| Status | **Entwurf – erstellt am 2026-11-12, Freigabe durch den Auftraggeber ausstehend** |
| Adresse | `/preise/` |
| Regeln | `content-plan.md` §6.1, §6.2; `compliance-matrix.md` B-02, I-03; Antworten nur aus `README.md` §14 und den Entscheidungen W-E in `project-brief.md` |

Jede Aussage mit Zahl nennt in eckigen Klammern ihren Eintrag im
Claim-Register (`content-plan.md` §7). Preise, Limits und die Paketmatrix
stehen nur in `src/data/pricing.ts` (`PLANS`, `FEATURES`, `EXTRAS`, `BETA`);
die Seite liest sie von dort. Alle Preise netto, zuzüglich Mehrwertsteuer.

## Kopf der Seite

- **Titel im Browser:** Preise und Pakete – Reticora CMDB
- **Beschreibung:** Essentials ab 49 € im Monat, dazu Standard, Pro und
  Enterprise. Funktionen, Limits, Zusatzkosten und 30 Tage Test. Preise zzgl.
  MwSt., nur für Unternehmen.

## Einstieg

- **Überschrift (h1):** Pakete und Preise
- **Vorspann:** Alle Pakete enthalten CMDB, Discovery, Topologie, Racks und
  API. Sie zahlen monatlich oder jährlich im Voraus. Preise zzgl. MwSt.
- **Zeile darunter:** Angebot nur für Unternehmen.

## 1. Die Pakete

- **Überschrift:** Die Pakete
- **Umschalter:** „monatlich“ / „jährlich“ (ohne JavaScript stehen beide
  Preise untereinander)
- **Karte je Paket** (Werte aus `PLANS`): Name, Kurzbeschreibung (`summary`),
  Preis, Limits. [C-21]

| Feld | Wortlaut |
|---|---|
| Preis monatlich | „{Preis} € im Monat“; bei Enterprise „ab {Preis} € im Monat“ |
| Preis jährlich | „{Jahrespreis} € im Jahr“; im ersten Jahr der Beta „{Beta-Jahrespreis} € im ersten Jahr“; bei Enterprise „auf Anfrage“ |
| Limits | „bis {n} CIs · {n} Collectors · {n} Nutzer“; bei Enterprise „bis 50.000 CIs · Collectors und Nutzer unbegrenzt“ |
| Zusatz | „zzgl. MwSt.“ |
| Knopf Essentials, Standard, Pro | „30 Tage testen“ |
| Knopf Enterprise | „Kontakt aufnehmen“ (Anliegen „Enterprise“) |

- **Werte zur Kontrolle** (aus `PLANS`, nicht abtippen):

| Paket | im Monat | im Jahr | erstes Beta-Jahr | CIs | Collectors | Nutzer | Claim |
|---|---|---|---|---|---|---|---|
| Essentials | 49 € | 490 € | 441 € | 500 | 2 | 5 | C-21 |
| Standard | 119 € | 1.190 € | 1.071 € | 2.500 | 5 | 25 | C-21 |
| Pro | 299 € | 2.990 € | 2.691 € | 10.000 | 20 | 100 | C-21 |
| Enterprise Shared | ab 999 € | auf Anfrage | – | 50.000 | unbegrenzt | unbegrenzt | C-21, C-92 |
| Enterprise Local | ab 1.999 € | auf Anfrage | – | 50.000 | unbegrenzt | unbegrenzt | C-21, C-92 |

- **Hinweisband direkt bei den Preisen:** **Beta-Rabatt:** 20 % in den
  ersten sechs Monaten, 10 % in den folgenden sechs Monaten, danach der volle
  Preis. Bei jährlicher Zahlung gilt im ersten Jahr der Preis der Spalte
  „erstes Beta-Jahr“. [C-21]

## 2. Funktionen je Paket

- **Überschrift:** Funktionen je Paket
- **Tabelle:** Zeilen aus `FEATURES`, Spalten je Paket. [C-21]
- **Legende:** „✓ enthalten · – nicht enthalten · ∞ unbegrenzt · Add-on: zu
  jedem Paket zubuchbar, Preis auf Anfrage“
- **Hinweis auf schmalen Bildschirmen:** „Die Tabelle lässt sich seitlich
  verschieben.“
- **Bildunterschrift (`caption`):** Funktionen je Paket. Enterprise Shared
  und Enterprise Local unterscheiden sich im Betrieb. [C-21]
- **Beleg je Zeile mit Zahlen:** Dokumentenspeicher [C-60].

## 3. Zusatzkosten

- **Überschrift:** Zusatzkosten
- **Kennwerte:**

| Bezeichnung | Wert | Claim |
|---|---|---|
| je CI über dem Limit des Pakets | 0,05 € im Monat | C-94 |
| je Monitoring-Service | 0,03 € im Monat | C-94 |
| Add-ons IGA und KI-Assistent | auf Anfrage | – |

- **Zeile darunter:** Alle Beträge zzgl. MwSt.

## 4. Der Test

- **Überschrift:** 30 Tage testen
- **Text:** Der Test umfasst den Standard-Umfang für bis zu 100 CIs. Sie
  legen ein Konto an, bestätigen Ihre E-Mail-Adresse und richten bei der
  ersten Anmeldung eine Authenticator-App ein. Nach dem Test bleibt Ihre CMDB
  30 Tage erhalten; wählen Sie bis dahin kein Paket, wird sie gelöscht.
  [C-22]
- **Knopf:** „30 Tage testen“ (Hauptknopf)

## 5. Fragen

- **Überschrift:** Fragen zu Preisen und Paketen
- **Form:** immer geöffnete Liste (Frage als Fettzeile, Antwort darunter), damit alle Antworten im Druck stehen.

| Frage | Antwort | Claim |
|---|---|---|
| Was zählt als CI? | Ein CI ist ein Eintrag in der CMDB: ein Gerät, eine virtuelle Maschine, ein Service. Für das Limit zählen alle nicht gelöschten CIs Ihrer Organisation, über alle Kunden, gleich ob die Discovery sie angelegt hat oder ein Mensch. | C-86 |
| Was passiert über dem Limit? | Jedes CI über dem Limit Ihres Pakets kostet 0,05 € im Monat. Findet die Discovery über dem Limit ein neues Gerät, verwirft Reticora es nicht: Es wartet in der Review-Inbox als „Nicht lizenziertes CI“, bis es übernommen werden kann. | C-94, C-87 |
| Was passiert nach dem Test? | Ihre CMDB bleibt nach dem Ende des Tests 30 Tage erhalten. Wählen Sie in dieser Zeit ein Paket, arbeiten Sie mit allen Daten weiter; sonst wird sie gelöscht. | C-22 |
| Was passiert, wenn ich in ein kleineres Paket wechsle? | Sie verlieren keine Daten. CIs über dem Limit des neuen Pakets werden als zusätzliche CIs berechnet. Funktionen, die das neue Paket nicht enthält, werden gesperrt; ihre Daten bleiben erhalten. | C-22, C-94 |
| Wie funktioniert der Beta-Rabatt? | In den ersten sechs Monaten zahlen Sie 20 % weniger, in den folgenden sechs Monaten 10 % weniger, danach den vollen Preis. Zahlen Sie jährlich im Voraus, gilt im ersten Jahr der Preis der Spalte „erstes Beta-Jahr“. | C-21 |
| Was unterscheidet Enterprise Shared und Enterprise Local? | Enterprise Shared läuft in der Cloud auf getrennter Infrastruktur. Enterprise Local wird bei Ihnen gehostet; der Preis enthält alle Arbeiten dafür. | C-92 |
| Was kosten IGA und der KI-Assistent? | Beide Add-ons sind zu jedem Paket zubuchbar. Den Preis nennen wir auf Anfrage. | – |
| Können Privatpersonen Reticora buchen? | Nein. Das Angebot richtet sich nur an Unternehmen. Alle Preise verstehen sich zuzüglich Mehrwertsteuer. | – |

## Abschluss

- **Überschrift:** Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.
- **Knöpfe:** „30 Tage testen“ (Hauptknopf), „Live-Demo“, „Kontakt“
- **Zeile darunter:** Angebot nur für Unternehmen.
