# Vendor-Register – Website für Reticora CMDB

| | |
|---|---|
| Stand | 2026-11-12, ergänzt nach Phase 6 |
| Status | **Entwurf – Verträge und Standorte sind vom Auftraggeber zu bestätigen** |

Erfasst sind alle Dienstleister und Werkzeuge, die für die Website Daten von
Besuchern verarbeiten oder bei Bau und Auslieferung beteiligt sind. Die
Subprozessoren der Reticora-SaaS gehören nicht hierher; ihre Liste führt
`docs/legal/subprozessoren.md` (derzeit ohne Einträge).

## 1. Zur Laufzeit (verarbeiten Daten von Besuchern)

| Anbieter | Leistung | Daten | Ort | Vertrag | Drittland | Status |
|---|---|---|---|---|---|---|
| **Hetzner Online GmbH**, Gunzenhausen | Webhosting L, Webserver: statische Seiten, `.htaccess`, Zugriffslogs, Backups | IP-Adresse und Anfragedaten in den Zugriffslogs | Deutschland (laut Anbieter; im Konto zu bestätigen) | AV-Vertrag nach Art. 28 DSGVO: **offen** (F-09) | nein | offen |
| Hetzner (gleicher Tarif), PHP | Ausführung von `api/lead.php`; Protokoll ohne Formularinhalte und ohne IP-Adressen (nur Ereignisnamen und Lead-IDs) | Formularinhalte während der Verarbeitung; Herkunftsadresse nur kurzzeitig im Arbeitsspeicher | wie oben | wie oben | nein | offen. Zu klären: PHP-Version im Konto (Ziel 8.4), `REMOTE_ADDR` hinter dem Proxy des Hosters |
| Hetzner (gleicher Tarif), MariaDB | Speicherung der Anfragen (Name, E-Mail, Unternehmen, Anliegen, Nachricht, Sprache, Zeitpunkt) und der Rate-Limit-Zähler (HMAC der gekürzten Herkunftsadresse, Schlüssel täglich überschrieben) | personenbezogene Daten der Anfragenden | wie oben | wie oben | nein | offen. Zu klären: Datenbankserver von außen erreichbar (daher eigener Benutzer), Backup-Frist |
| SMTP-Postfach des Hosters (Versandkonto des Formulars) | Versand der Anfrage an das Vertriebspostfach über PHPMailer, SMTP mit TLS (`ssl` oder `starttls`) und Anmeldung | Formularinhalte in der Mail; keine Mail an die eingegebene Adresse | Deutschland (laut Anbieter, unbestätigt) | wie oben | nein | offen. Zu klären: Absenderdomain, SPF/DKIM/DMARC, Weiterleitung des Postfachs, Aufbewahrung der gesendeten Mails |
| Domain-Registrar und DNS | Namensauflösung | keine Inhaltsdaten | unbekannt (F-02) | – | unbekannt | offen |
| Empfängerpostfach des Vertriebs | Eingang der Anfragen | Formularinhalte | unbekannt (F-06). Liegt das Postfach bei einem anderen Anbieter oder wird weitergeleitet, kommt dieser Anbieter hier hinzu. | offen | zu prüfen | offen |

Mehr ist zur Laufzeit nicht vorgesehen.

## 2. Bewusst nicht eingesetzt

| Kategorie | Entscheidung zum Start | Folge bei späterer Einführung |
|---|---|---|
| Reichweitenmessung, Tag-Manager | keine (F-13) | Neubewertung TDDDG §25, neuer Eintrag hier |
| Schriften von Drittservern | keine; Schriften liegen auf dem eigenen Webspace | – |
| CDN | keines | AV-Vertrag, Standort |
| Captcha eines Dritten | keines; Köderfeld, Rate-Limit je Herkunft, Obergrenze für alle Anfragen (Spec Ä-07, Ä-18), bei Bedarf selbst gehostetes ALTCHA | – |
| Eingebettete Videos, Karten, Social-Media-Inhalte | keine | Einwilligung vor dem Laden |
| Chat-Widget, Terminbuchung | keine | AV-Vertrag, Einwilligung |
| CRM, Newsletter-Dienst | keiner (F-06, F-07) | AV-Vertrag, Double-Opt-in, UWG §7 |

## 3. Bau und Auslieferung (keine Besucherdaten)

| Anbieter / Werkzeug | Zweck | Daten | Hinweis |
|---|---|---|---|
| GitHub (Repository, Actions) | Quelltext, Tests, Build (`ci.yml`), wöchentlicher Ablaufwarnlauf für `security.txt` (`security-txt.yml`); später Deploy | Quelltext; derzeit keine Secrets. Ein Deploy-Zugang käme als Secret hinzu | keine Leads, keine Logs, keine Kundendaten im Repository oder in CI-Läufen. Standort und Vertrag von GitHub vom Auftraggeber zu bewerten (offen) |
| npm-Registry | Abhängigkeiten zum Build | keine personenbezogenen | Lockfile, Prüfung im CI |
| Packagist / PHPMailer (Bibliothek) | `phpmailer/phpmailer` ^7 für den SMTP-Versand, `composer.lock` im Repository, `composer audit` im CI | keine; die Bibliothek läuft im eigenen PHP-Prozess auf dem Webspace. **Kein Auftragsverarbeiter**, weil sie keine Daten an den Bibliotheksautor übermittelt | LGPL-2.1-Lizenz des Pakets vor Auslieferung prüfen; Composer lädt nur zum Bau, nicht zur Laufzeit |
| Claude Code (Anthropic) | Entwicklungshilfe | Quelltext und Dokumente dieses Projekts | keine echten Kundendaten, keine Leads, keine Zugangsdaten in Sitzungen |

## 4. Schriften und Lizenzen

Welche Schriften eingesetzt werden, hängt von der gewählten Art Direction ab
(`design-system.md`). Alle Kandidaten stehen unter der SIL Open Font License
und dürfen selbst gehostet werden. Die Lizenztexte werden mit ausgeliefert.

| Richtung | Schriften | Lizenz |
|---|---|---|
| A | Geist, Geist Mono | SIL OFL 1.1 |
| B | Archivo, JetBrains Mono | SIL OFL 1.1 |
| C | IBM Plex Serif, Sans, Mono | SIL OFL 1.1 |

Vor der Auslieferung wird die Lizenz jeder eingebundenen Datei im Build
geprüft.

## 5. Aufbewahrung und Löschung (Vorschlag)

Die Fristen legt der Auftraggeber fest. Die Werte sind Vorschläge für das
Gespräch mit der Datenschutzberatung.

| Daten | Ort | Vorschlag | Verfahren |
|---|---|---|---|
| Kontaktanfragen | MariaDB beim Hoster | Löschung 90 Tage nach Eingang (`retention_days`), sofern kein Vertragsverhältnis entsteht | stündlicher Cronjob `bin/purge.php`, Protokoll ohne Personenbezug |
| Rate-Limit-Einträge | MariaDB | HMAC der Herkunftsadresse (IPv6 auf /64 gekürzt) mit täglich überschriebenem Schlüssel; Zähler gelten eine Stunde und werden bei jedem Aufruf und im Cronjob gelöscht | derselbe Cronjob |
| E-Mails im Vertriebspostfach | Postfach | nach interner Regel des Auftraggebers | vom Auftraggeber zu beschreiben |
| Zugriffslogs | Hoster | kürzeste einstellbare Frist, IP-Adressen gekürzt, falls einstellbar | Einstellung im Hetzner-Konto (F-09) |
| Backups des Hosters | Hoster | Frist des Hosters; gelöschte Leads verschwinden mit Ablauf der Backups | in der Datenschutzerklärung berücksichtigen |

## 6. Anfragen an fremde Hosts

Soll-Zustand zur Laufzeit: **keine**. Der Netzwerktest in Phase 7 lädt jede
Seite und bricht ab, sobald eine Anfrage an einen anderen Host als die eigene
Domain geht, ein Cookie gesetzt wird oder Web Storage beschrieben wird.

Einzige gewollte Ausnahme sind Links, denen der Besucher selbst folgt: zur
App (Registrierung, Anmeldung) und gegebenenfalls zur Dokumentation (F-02,
F-15).

## 7. Offene Punkte

- AV-Vertrag mit Hetzner abschließen und ablegen (F-09).
- Standort und Anbieter des Vertriebspostfachs benennen (F-06).
- Registrar und DNS-Anbieter benennen (F-02).
- Subprozessorenliste der SaaS vom Betreiber beschaffen, bevor die Seite
  `/subprozessoren/` Inhalt bekommt (F-10).
- Frage an den Auftraggeber: Versandkonto des Formulars (Anbieter, Absenderdomain,
  SPF/DKIM/DMARC) und Empfängerpostfach benennen; ist es ein anderes Postfach
  als das des Hosters, gehört dieser Anbieter in §1.
- Frage an den Auftraggeber: PHP-Version, `mod_headers`, SSH und die Frist der
  Zugriffslogs im Hetzner-Konto bestätigen (F-09).
- Frage an den Auftraggeber: Bewertung von GitHub (Actions) als Werkzeug des
  Baus; es gelangen keine Besucherdaten dorthin.
- Aufbewahrungsfrist der Anfragen (90 Tage) bestätigen oder ändern.
