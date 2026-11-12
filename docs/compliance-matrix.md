# Compliance-Matrix – Website für Reticora CMDB

| | |
|---|---|
| Stand der Sichtung | 2026-11-12 |
| Status | **Erste Risikoeinschätzung – nicht rechtlich geprüft, nichts freigegeben** |
| Gesichtet von | Claude (KI-Assistent), ohne Zugriff auf aktuelle Gesetzesdatenbanken in dieser Sitzung |

**Dieses Dokument ist keine Rechtsberatung.** Es sammelt die Anforderungen,
die für eine B2B-Website in Deutschland und der EU typischerweise zu prüfen
sind, und ordnet sie dem Projekt zu. Fundstellen und Einschätzungen muss eine
fachkundige Person prüfen. Die Website gilt erst als geprüft, wenn in jeder
Zeile eine benannte Person die Freigabe eingetragen hat. Rechtstexte liefert
der Auftraggeber; hier werden keine formuliert.

Spalte „Prüfer“: Bis F-14 (`project-brief.md` §8) geklärt ist, steht dort die
Rolle. Spalte „Freigabe“: `offen`, `umgesetzt, fachliche Prüfung ausstehend`, `in Prüfung`, `freigegeben (Name, Datum)`.
`umgesetzt, fachliche Prüfung ausstehend` heißt: Die Maßnahme ist im Quelltext
vorhanden und durch Tests belegt (Stand Phase 6, 2026-11-12). Es ist keine
Freigabe und keine Aussage über Rechtskonformität; dazu fehlt die Prüfung durch
die genannte Rolle.

## 1. Erste Risikoeinschätzung

| Rang | Risiko | Warum | Maßnahme |
|---|---|---|---|
| 1 | **Irreführende Werbung** (UWG §5): Funktionen werden als verfügbar dargestellt, bevor sie es sind; Zielwerte lesen sich wie Zusagen | Vorgabe „als fertig darstellen“; Sicherheits- und Leistungsangaben im Repository sind teils Ziele oder nur erklärt | Claim-Register mit Pflichtprüfung vor Go-live (W-01, W-02) |
| 2 | **Fehlende Anbieterangaben und Rechtstexte** | Firma und Anschrift liegen vor (W-E05); Geschäftsführung, Register, USt-IdNr. und Kontaktangaben fehlen (F-01); Impressums- und Datenschutzfehler sind abmahnfähig | Go-live-Sperre, bis die Angaben und Texte vom Auftraggeber vorliegen (I-01, D-02) |
| 3 | **B2B-Beschränkung nicht belastbar** | Der Auftraggeber hat ausschließlich B2B bestätigt (W-E08). BFSG, PAngV und §§312j/k BGB entfallen aber nur, wenn die Beschränkung für Besucher erkennbar ist und in der Registrierung durchgesetzt wird (F-05) | deutlicher B2B-Hinweis, Nettopreise mit Zusatz, Prüfung des Signups der App (B-01 bis B-04) |
| 4 | **Auftragsverarbeitung und Subprozessoren** | AV-Vertrag mit Hetzner ungeklärt (F-09); Subprozessorenliste der SaaS im Repository leer | AVV abschließen, Liste vom Betreiber (D-05, D-10) |
| 5 | **Lead-Daten** | Formular verarbeitet personenbezogene Daten; Speicherdauer, Empfänger und Postfach sind offen (F-06) | Datensparsamkeit, Löschfrist, Verfahren dokumentieren (D-03, D-07, D-08) |
| 6 | **Drittanfragen und Endgerätezugriff** | jede eingebettete Schrift, Karte, Video oder Messung löst Einwilligungs- und Transferfragen aus | null Drittanfragen als Testkriterium (T-01, D-09) |
| 7 | **E-Mail-Werbung** | Werbung per E-Mail braucht auch im B2B die vorherige ausdrückliche Einwilligung | kein Newsletter zum Start; Antworten nur auf Anfragen (W-04) |

## 2. Anbieterkennzeichnung und Medienrecht

| ID | Rechtsquelle (Sichtung) | Anwendbarkeit und Begründung | Umsetzung | Test / Nachweis | Prüfer | Freigabe |
|---|---|---|---|---|---|---|
| I-01 | DDG §5 Abs. 1 (2026-11-12) | **anwendbar:** geschäftsmäßiger, in der Regel entgeltlicher digitaler Dienst | Seite `/impressum/` und `/en/legal-notice/` mit Angaben vom Auftraggeber (F-01); Link in der Fußzeile jeder Seite. Phase 6: Seiten gebaut, Firma und Anschrift aus `SITE`; Geschäftsführung, Register, USt-IdNr., E-Mail und Telefon sind sichtbare Platzhalter (`data-placeholder`), die `build:release` meldet; kein erfundener Rechtstext | Playwright: Link auf jeder Seite, Ziel antwortet mit 200; Sichtprüfung der Angaben | Recht | offen (Angaben fehlen) |
| I-02 | DDG §5: „leicht erkennbar, unmittelbar erreichbar, ständig verfügbar“ (2026-11-12) | **anwendbar** | Bezeichnung „Impressum“, ein Klick von jeder Seite, auch mobil und auf der 404-Seite | Playwright je Viewport | Recht | offen |
| I-03 | DDG §6 (2026-11-12) | **anwendbar:** Der Beta-Rabatt wird beworben (W-E07). Kommerzielle Kommunikation und die Bedingungen von Preisnachlässen müssen klar erkennbar und leicht zugänglich sein | Bedingungen des Beta-Rabatts direkt bei den Preisen: Höhe, Dauer, Buchungszeitraum (`content-plan.md` §6.1, F-04) | Sichtprüfung der Preisseite in beiden Sprachen (`/preise/`, `/en/pricing/` gebaut; Bedingungen stehen im Text, Wortlaut und Enddatum offen, F-04) | Recht | offen |
| I-04 | MStV §18 Abs. 2 (2026-11-12) | **zum Start voraussichtlich nicht anwendbar:** kein journalistisch-redaktionelles Angebot; wird relevant mit Blog oder Magazin | kein Blog zum Start; bei Einführung Verantwortliche Person nennen | Sitemap-Prüfung | Recht | offen |
| I-05 | §35a GmbHG; der Anbieter ist eine UG (haftungsbeschränkt) (2026-11-12) | **derzeit nicht ausgelöst:** Seit Spec Ä-09 geht keine E-Mail an die eingegebene Adresse; das Formular sendet nur an das Vertriebspostfach. Antworten des Vertriebs auf Anfragen sind Geschäftsbriefe und tragen die Pflichtangaben | Keine Bestätigungsmail, keine Signatur-Einstellung mehr; Dankeseite bestätigt den Eingang. Pflichtangaben in den Antworten des Vertriebs (F-01) liegen beim Auftraggeber | Test: keine Mail an die eingegebene Adresse (PHPUnit, E2E liest die Mail-Datei) | Recht | umgesetzt, fachliche Prüfung ausstehend (Teil Formular); Antworten des Vertriebs offen |

## 3. Datenschutz

| ID | Rechtsquelle (Sichtung) | Anwendbarkeit und Begründung | Umsetzung | Test / Nachweis | Prüfer | Freigabe |
|---|---|---|---|---|---|---|
| D-01 | DSGVO Art. 5 Abs. 1 lit. c, Art. 25 (2026-11-12) | **anwendbar:** Formular und Server-Logs verarbeiten personenbezogene Daten | Formular mit fünf Feldern (Name, E-Mail, Unternehmen, Anliegen, Nachricht; `content-plan.md` §9) plus Köderfeld; Eingaben werden serverseitig geprüft und begrenzt; das Protokoll enthält nur Ereignisnamen und Lead-IDs, keine Formularinhalte und keine IP-Adressen; keine Messung; keine Profile | Feldliste im Test; PHPUnit (Grenzwerte, Steuerzeichen); Review | Datenschutz | umgesetzt, fachliche Prüfung ausstehend |
| D-02 | DSGVO Art. 12–14 (2026-11-12) | **anwendbar** | Seiten `/datenschutz/` und `/en/privacy/` gebaut, Text ist ein sichtbarer Platzhalter (kein Rechtstext von Claude); Hinweis am Formular mit Link und Platzhalter für die Verarbeitungsangabe (`kontakt-verarbeitung`) | Playwright: Link auf jeder Seite und am Formular; `build:release` meldet die Platzhalter | Datenschutz, Recht | offen (Text fehlt) |
| D-03 | DSGVO Art. 6 Abs. 1 lit. b oder f (2026-11-12) | **anwendbar:** Rechtsgrundlage für Anfragen und Logs ist festzulegen | Festlegung durch Auftraggeber; kein Einwilligungs-Häkchen, sofern nicht nötig | Eintrag im Verarbeitungsverzeichnis | Datenschutz | offen |
| D-04 | DSGVO Art. 30 (2026-11-12) | **anwendbar** (Umfang je nach Unternehmensgröße zu prüfen) | Verarbeitungen „Website-Betrieb“ und „Kontaktanfragen“ ins Verzeichnis des Auftraggebers | Auszug | Datenschutz | offen |
| D-05 | DSGVO Art. 28 (2026-11-12) | **anwendbar:** Hetzner verarbeitet im Auftrag (Webserver, Datenbank, Postfach) | AV-Vertrag mit Hetzner abschließen und ablegen (F-09) | Vertragsnachweis | Datenschutz | offen |
| D-06 | DSGVO Art. 32 (2026-11-12) | **anwendbar** | TLS überall, Security-Header, serverseitige Prüfung, Zugangsdaten außerhalb des Webroots, Zugriff auf Leads beschränkt. Phase 6: auch die vom Backend erzeugte 422-Seite setzt CSP, Referrer-Policy, COOP und Permissions-Policy (gleiche CSP wie `.htaccess`); Eingaben werden mit `htmlspecialchars` maskiert | Header-Test, Sicherheitsreview Phase 7; Tests gegen XSS-Muster (PHPUnit, E2E) | Sicherheit | umgesetzt, fachliche Prüfung ausstehend |
| D-07 | DSGVO Art. 5 Abs. 1 lit. e, Art. 17 (2026-11-12) | **anwendbar** | Löschfrist für Leads und Rate-Limit-Einträge, Cronjob (`vendor-register.md` §5); Frist legt der Auftraggeber fest. Phase 6: `retention_days` (Vorschlag 90 Tage, **nicht bestätigt**), stündlicher `bin/purge.php`; Rate-Limit-Zähler werden bei jedem Aufruf und im Lauf gelöscht. Der Cronjob ist auf dem Hosting noch nicht eingerichtet | PHPUnit des Löschlaufs; Protokoll auf dem Hosting steht aus | Datenschutz | umgesetzt, fachliche Prüfung ausstehend (Code); Frist und Betrieb offen |
| D-08 | DSGVO Art. 15–21 (2026-11-12) | **anwendbar** | Kontaktweg und internes Verfahren für Auskunft und Löschung | Verfahrensbeschreibung | Datenschutz | offen |
| D-09 | DSGVO Art. 44 ff. (2026-11-12) | **zu vermeiden:** keine Übermittlung in Drittländer zur Laufzeit geplant | keine Dritt-Skripte, Schriften, Karten, Videos, Captchas; Postfach ohne Weiterleitung in Drittländer (F-06); PHPMailer läuft lokal und verbindet sich nur mit dem konfigurierten SMTP-Server | Netzwerktest T-01; Vendor-Register | Datenschutz | offen |
| D-10 | DSGVO Art. 28 Abs. 2–4, Verweis der Website auf die SaaS (2026-11-12) | **anwendbar auf die Aussage** „Subprozessoren“ und „EU-Hosting“ | Seite `/subprozessoren/` nur mit Liste des Betreibers; `docs/legal/subprozessoren.md` ist derzeit leer | Abgleich mit Betreiberliste | Datenschutz | offen |
| D-11 | DSGVO Art. 37, BDSG §38 (2026-11-12) | **zu klären** (F-17): Benennungspflicht hängt u. a. von der Zahl der Personen ab, die ständig personenbezogene Daten automatisiert verarbeiten | Angabe in der Datenschutzerklärung, falls benannt | Erklärung des Auftraggebers | Datenschutz | offen |
| D-12 | DSGVO Art. 6 Abs. 1 lit. f; Server-Logs (2026-11-12) | **anwendbar:** Zugriffslogs des Hosters enthalten IP-Adressen | Einstellungen zu Anonymisierung und Aufbewahrung im Hetzner-Konto prüfen (F-09) | Bildschirmfoto der Einstellung | Datenschutz | offen |
| D-13 | DSGVO Art. 33, 34 (2026-11-12) | **anwendbar** | Meldeweg bei Datenpannen des Website-Backends im Betriebshandbuch | Verfahrensbeschreibung | Datenschutz, Sicherheit | offen |
| D-14 | LG München I, Urteil vom 20.01.2022 – 3 O 17493/20 (2026-11-12) | **einschlägig als Maßstab:** Einbindung von Schriften über Server Dritter überträgt die IP-Adresse | Schriften selbst gehostet | Netzwerktest T-01 | Datenschutz | offen |

## 4. Endgerätezugriff und Einwilligung

| ID | Rechtsquelle (Sichtung) | Anwendbarkeit und Begründung | Umsetzung | Test / Nachweis | Prüfer | Freigabe |
|---|---|---|---|---|---|---|
| T-01 | TDDDG §25 Abs. 1 (2026-11-12) | **anwendbar dem Grunde nach;** Einwilligung nötig für jedes nicht unbedingt erforderliche Speichern oder Auslesen im Endgerät | zum Start: keine Cookies, kein Web Storage, keine Messung, keine Drittinhalte. Dann ist kein Einwilligungsbanner nötig. | Playwright-Netzwerktest: null fremde Hosts, null Cookies, leerer Web Storage auf jeder Seite | Datenschutz | offen |
| T-02 | TDDDG §25 Abs. 2 Nr. 2 (2026-11-12) | **nur falls** später eine vom Nutzer gewählte Einstellung gespeichert wird (Sprache, Darstellung) | zum Start nicht speichern: Sprache über URL, Darstellung über Systemeinstellung | Test wie T-01 | Datenschutz | offen |
| T-03 | TDDDG §25, DSGVO Art. 7 (2026-11-12) | **nur falls** Reichweitenmessung eingeführt wird (F-13) | vor Einführung: Verfahren wählen, Zeile neu bewerten, Vendor-Register ergänzen | – | Datenschutz | offen |

## 5. Wettbewerbs- und Werberecht

| ID | Rechtsquelle (Sichtung) | Anwendbarkeit und Begründung | Umsetzung | Test / Nachweis | Prüfer | Freigabe |
|---|---|---|---|---|---|---|
| W-01 | UWG §5, §5a (2026-11-12) | **anwendbar, auch im B2B:** Angaben über Merkmale der Leistung müssen zutreffen | Claim-Register (`content-plan.md` §7); Go-live-Sperre, bis jeder Eintrag gegen den ausgelieferten Stand geprüft ist | abgehaktes Register mit Name und Datum | Inhalt, Recht | offen |
| W-02 | UWG §5 (2026-11-12) | **anwendbar auf Sicherheits-, Verfügbarkeits- und Leistungsangaben** sowie auf Hinweise zu ISO 27001, NIS2, KRITIS | keine Nennung von Pentest, SLA-Werten, Zertifikaten ohne Nachweis (C-16 bis C-19); Berichtsfunktion nicht als Zertifizierung darstellen | Review der Sicherheitsseite | Recht, Sicherheit | offen |
| W-03 | UWG §6 (2026-11-12) | **zum Start nicht einschlägig:** keine vergleichende Werbung geplant | keine Wettbewerbernamen, keine Vergleichstabellen | Textsuche im Build | Inhalt | offen |
| W-04 | UWG §7 Abs. 2 Nr. 2, Abs. 3 (2026-11-12) | **anwendbar auf jede Werbe-E-Mail,** auch an Unternehmen | kein Newsletter; Formular dient nur der Antwort auf die Anfrage; keine Übernahme in Verteiler | Prozessbeschreibung; Formular ohne Werbe-Einwilligung | Recht | offen |
| W-05 | UWG §3a i. V. m. den Pflichten aus I-01, D-02 (2026-11-12) | **anwendbar:** Verstöße gegen Marktverhaltensregeln sind abmahnfähig | siehe I-01, D-02 | – | Recht | offen |
| W-06 | MarkenG §23 (2026-11-12) | **anwendbar:** Herstellernamen in der Geräteliste | Nennung nur als Text zur Beschreibung der Kompatibilität, keine Logos, kein Anschein einer Partnerschaft | Review der Geräteseite | Recht | offen |
| W-07 | UrhG; Lizenzen von Schriften, Symbolen, Bildern (2026-11-12) | **anwendbar** | Lizenzliste im Vendor-Register; nur eigene Zeichnungen und eigene Screenshots | Lizenzprüfung im Build | Inhalt | offen |

## 6. B2B-Abgrenzung und Vertragsschluss

| ID | Rechtsquelle (Sichtung) | Anwendbarkeit und Begründung | Umsetzung | Test / Nachweis | Prüfer | Freigabe |
|---|---|---|---|---|---|---|
| B-01 | BFSG §1 Abs. 3 Nr. 5, §2 Nr. 26, §3 Abs. 3 (2026-11-12) | **voraussichtlich nicht anwendbar, wenn** das Angebot sich ausschließlich an Unternehmer richtet: Das Gesetz erfasst Dienstleistungen im elektronischen Geschäftsverkehr im Hinblick auf Verbraucherverträge; zudem Ausnahme für Kleinstunternehmen. Der Auftraggeber hat ausschließlich B2B bestätigt (W-E08); die Beschränkung muss erkennbar und durchgesetzt sein (F-05). | B2B-Hinweis „Angebot nur für Unternehmen“ am Formular und an den Handlungsaufrufen der Preise; Pflichtfeld „Unternehmen“; unabhängig davon WCAG 2.2 AA als Qualitätsziel; keine Aussage „BFSG-konform“. Seite `/barrierefreiheit/` (`/en/accessibility/`) gebaut: beschreibt Stand und Grenzen, ohne Konformitätsaussage; der Kontakt für Hinweise ist ein Platzhalter | axe-Tests auf jeder Seite (Phase 6, beide Themen), manuelle Prüfung steht aus (Phase 7), Seite `/barrierefreiheit/` | Recht | umgesetzt, fachliche Prüfung ausstehend (Hinweise, Seite); Durchsetzung in der App offen (F-20) |
| B-02 | PAngV §1, §3 (2026-11-12) | **voraussichtlich nicht anwendbar bei reinem B2B;** Preisangaben dürfen dennoch nicht irreführen | Preise als Nettopreise mit Zusatz „zzgl. MwSt.“ und Hinweis „Angebot nur für Unternehmen“; Monats- und Jahrespreis stehen immer beide sichtbar (kein Umschalter, Spec Ä-27) | Sichtprüfung der Preisseite; Unit-Tests der Preisformate (DE, EN) | Recht | umgesetzt, fachliche Prüfung ausstehend |
| B-03 | BGB §312i, Art. 246c EGBGB (2026-11-12) | **gilt auch im B2B, aber für den Bestellweg:** Der Vertrag wird in der App geschlossen, nicht auf der Website. Das Formular ist individuelle Kommunikation und keine Bestellung. | Website: AGB abrufbar und speicherbar verlinken; Bestellweg der App gesondert prüfen (außerhalb dieses Projekts) | Link-Test; Hinweis an Produktteam | Recht | offen |
| B-04 | BGB §312j, §312k (2026-11-12) | **nicht anwendbar bei reinem B2B** (Verbraucherverträge). B2B ist bestätigt (W-E08). Die Registrierung der App fragt derzeit weder die gewerbliche Nutzung ab noch lässt sie AGB annehmen (F-20); solange das so ist, stützt sich die Abgrenzung allein auf Hinweise. | B2B-Beschränkung im Signup der App belastbar machen | Prüfung des Signups | Recht | offen |
| B-05 | BGB §§305 ff. (2026-11-12) | **anwendbar:** AGB müssen einbezogen und abrufbar sein | Seite `/agb/` und `/en/terms/` gebaut, Text ist ein sichtbarer Platzhalter (F-11) | Link-Test; `build:release` meldet den Platzhalter | Recht | offen (Text fehlt) |
| B-06 | VSBG §36; Verordnung (EU) 524/2013 (2026-11-12) | **voraussichtlich nicht anwendbar:** Verbraucherstreitbeilegung betrifft Verbraucherverträge; die OS-Plattform der EU wurde nach Kenntnis von Claude 2025 eingestellt. **Zu prüfen.** | kein OS-Link, kein Hinweis ohne anwaltliche Vorgabe | – | Recht | offen |

## 7. Sicherheit des Website-Betriebs

Keine Rechtsquelle im engeren Sinn, aber Voraussetzung für D-06.

| ID | Maßstab (Sichtung) | Anwendbarkeit | Umsetzung | Test / Nachweis | Prüfer | Freigabe |
|---|---|---|---|---|---|---|
| S-01 | OWASP ASVS, Abschnitte zu Eingabeprüfung und Ausgabe (2026-11-12) | Lead-Endpunkt | Prüfung aller Felder auf dem Server; Längen; Ausgabe maskiert; vorbereitete SQL-Anweisungen; keine Header-Injektion in E-Mails | PHPUnit: die zehn Angriffsmuster in jedem Feld laufen in `ContactPageTest` (Maskierung auf der 422-Seite) und `AppTest`/`ValidatorTest` (Prüfung, vorbereitete Anweisungen, Kopfzeilen der Mail). Playwright (`tests/e2e/contact.spec.ts`) prüft nur einzelne XSS-Zeichenketten in jedem Feld, auf der 422-Seite und mit Insel: kein Dialog, keine CSP-Verstöße, Eingabe bleibt Text | Sicherheit | umgesetzt, fachliche Prüfung ausstehend |
| S-02 | Rate-Limit (2026-11-12) | Lead-Endpunkt | Limit je Herkunft über einen HMAC der Adresse (IPv6 auf /64 gekürzt) mit täglich überschriebenem Zufallsschlüssel statt gesalzenem Hash; Zähler gelten eine Stunde und werden bei jedem Aufruf und stündlich gelöscht (Spec Ä-10, Ä-22); zusätzlich Obergrenze für alle angenommenen Anfragen je Stunde (Ä-18). Ob `REMOTE_ADDR` hinter dem Proxy des Hosters die Besucheradresse ist, ist ungeprüft | Test: Sperre nach n Anfragen, IPv6, Schlüsselwechsel (PHPUnit, E2E) | Sicherheit | umgesetzt, fachliche Prüfung ausstehend (Code); Betrieb offen |
| S-03 | Security-Header (2026-11-12) | alle Antworten | HSTS, CSP ohne `unsafe-inline` für Skripte, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` über `.htaccess` (F-09: `mod_headers`) | Header-Test im Playwright-Lauf; die 422-Seite des Backends trägt dieselben Kopfzeilen (Ä-20); ob Apache und PHP auf dem Hosting Kopfzeilen doppelt setzen, ist ungeprüft | Sicherheit | umgesetzt, fachliche Prüfung ausstehend (lokal); Hosting offen |
| S-04 | Geheimnisse (2026-11-12) | Deploy, SMTP, Datenbank | nie im Repository; Konfiguration außerhalb des Webroots; Deploy-Zugang als geschütztes Secret | Secret-Scan im CI | Sicherheit | offen |
| S-05 | Weiterleitungen (2026-11-12) | Formular, Sprachwechsel | keine Ziel-URL aus Nutzereingaben; feste Ziele | Test | Sicherheit | offen |
| S-06 | Abhängigkeiten und Build (2026-11-12) | Build | Lockfile, `npm audit` im CI, Prüfung des Build-Ergebnisses auf fremde Hosts und Quelltext-Karten | CI-Lauf | Sicherheit | offen |
| S-07 | RFC 9116 (2026-11-12) | empfohlen | `/.well-known/security.txt` mit Meldeadresse (F-01): entsteht nur, wenn `SITE.securityContact` gesetzt ist (Ä-13, Ä-25); `build:release` meldet die fehlende Adresse; wöchentlicher Lauf prüft, dass `Expires` mindestens 30 Tage voraus liegt (Ä-33) | Abruf-Test, Unit-Test des Warnlaufs | Sicherheit | offen (Adresse fehlt) |
| S-08 | E-Mail-Authentifizierung (2026-11-12) | Versanddomain | SPF, DKIM, DMARC für die Absenderdomain | DNS-Prüfung | Sicherheit | offen |

## 8. Weitere Punkte zur Prüfung

| ID | Rechtsquelle (Sichtung) | Einschätzung | Umsetzung | Prüfer | Freigabe |
|---|---|---|---|---|---|
| X-01 | Verordnung (EU) 2024/1689 (KI-Verordnung), Art. 50 (2026-11-12) | **zu prüfen:** betrifft Aussagen zum KI-Add-on und KI-erzeugte Inhalte; Texte der Website werden von Menschen freigegeben | keine KI-erzeugten Bilder von Personen oder Ereignissen; Aussagen zum Add-on nach C-20 | Recht | offen |
| X-02 | Verordnung (EU) 2022/2065 (DSA) (2026-11-12) | **voraussichtlich nicht einschlägig:** keine Nutzerinhalte, kein Vermittlungsdienst | keine Kommentarfunktion | Recht | offen |
| X-03 | Kennzeichnung von Testdaten (2026-11-12) | Screenshots dürfen keine echten Kundendaten zeigen | nur Demo-Organisation und Simulationsmodus | Inhalt, Datenschutz | offen |
| X-04 | Sprachfassungen (Entscheidung W-E09, Spec §3) (2026-11-12) | **Qualität, keine Rechtspflicht:** Deutsch und Englisch zum Start (W-E09). Englische Rechtsseiten enthalten nur Beschriftungen und Platzhalter; rechtlich maßgeblich ist, was der Auftraggeber liefert, auch zur Frage, welche Sprachfassung gilt | beide Sprachen gebaut (`/en/…`), Sprachumschalter nur auf Seiten mit Gegenstück, `hreflang` und `lang`; selbst gebildete englische Begriffe stehen unter „vorgeschlagen, Freigabe ausstehend“ (`content-plan.md` §6.3) | Inhalt, Recht | umgesetzt, fachliche Prüfung ausstehend (Technik); Wortlaut offen |

## 9. Go-live-Sperren

Die Website geht nicht online, solange eine dieser Zeilen offen ist:
I-01, I-02, D-02, D-05, D-07, T-01, W-01, W-02, B-05, S-01 bis S-04.
