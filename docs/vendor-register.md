# Vendor-Register – Website für Reticora CMDB

| | |
|---|---|
| Stand | 2026-11-12, ergänzt nach Phase 6 und nach der Datenschutzprüfung vom 2026-11-18 (`docs/qa/2026-11-datenschutz.md`) |
| Status | **Entwurf – Verträge und Standorte sind vom Auftraggeber zu bestätigen** |

Erfasst sind alle Dienstleister und Werkzeuge, die für die Website Daten von
Besuchern verarbeiten oder bei Bau und Auslieferung beteiligt sind. Die
Subprozessoren der Reticora-SaaS gehören nicht hierher; ihre Liste führt
`docs/legal/subprozessoren.md` (derzeit ohne Einträge).

## 1. Zur Laufzeit (verarbeiten Daten von Besuchern)

| Anbieter | Leistung | Daten | Ort | Vertrag | Drittland | Status |
|---|---|---|---|---|---|---|
| **Hetzner Online GmbH**, Gunzenhausen | Webhosting L, Webserver: statische Seiten, `.htaccess`, Zugriffslogs, Backups, Cron (mit Mail der Ausgabe) | IP-Adresse und Anfragedaten in den Zugriffslogs (Felder wie Nutzeragent und Referrer je nach Format des Hosters); Backups enthalten Datenbank und Protokolldateien | Deutschland (laut Anbieter; im Konto zu bestätigen) | AV-Vertrag nach Art. 28 DSGVO: **offen** (F-09) | nein | offen. Zu klären: Format, Frist und IP-Kürzung der Zugriffs- und Fehlerprotokolle, Backup-Frist (Datenschutzprüfung Q-03, Q-07) |
| Hetzner (gleicher Tarif), PHP | Ausführung von `api/lead.php`; Protokoll ohne Formularinhalte und ohne IP-Adressen (nur Ereignisnamen und Lead-IDs; in Phase 7 an echten Absendungen geprüft), Datei unter `log_path` oder sonst das PHP-Fehlerprotokoll des Hosters | Formularinhalte während der Verarbeitung; Herkunftsadresse nur kurzzeitig im Arbeitsspeicher | wie oben | wie oben | nein | offen. Zu klären: PHP-Version im Konto (Ziel 8.4), `REMOTE_ADDR` hinter dem Proxy des Hosters |
| Hetzner (gleicher Tarif), MariaDB | Speicherung der Anfragen (Name, E-Mail, Unternehmen, Anliegen, Nachricht, Sprache, Zeitpunkt, Zustellstatus) und der Rate-Limit-Zähler (HMAC der gekürzten Herkunftsadresse, Schlüssel täglich überschrieben, liegt in derselben Datenbank) | personenbezogene Daten der Anfragenden; Rate-Limit-Werte sind mit dem Schlüssel des Tages rückrechenbar, also pseudonymisiert (Datenschutzprüfung DS-03) | wie oben | wie oben | nein | offen. Zu klären: Datenbankserver von außen erreichbar (daher eigener Benutzer), Backup-Frist |
| SMTP-Postfach des Hosters (Versandkonto des Formulars) | Versand der Anfrage an das Vertriebspostfach über PHPMailer, SMTP mit TLS (`ssl` oder `starttls`) und Anmeldung | Formularinhalte in der Mail (Name, E-Mail, Unternehmen, Anliegen, Sprache, Eingangszeit, Nachricht; `Reply-To` = eingegebene Adresse); keine IP, kein Nutzeragent; keine Mail an die eingegebene Adresse; keine Kopie im Ordner „Gesendet“ (kein IMAP) | Deutschland (laut Anbieter, unbestätigt) | wie oben | nein | offen. Zu klären: Absenderdomain, SPF/DKIM/DMARC, Weiterleitung des Postfachs, Aufbewahrung der gesendeten Mails |
| Domain-Registrar und DNS | Namensauflösung | keine Inhaltsdaten | unbekannt (F-02) | – | unbekannt | offen |
| Empfängerpostfach des Vertriebs | Eingang der Anfragen; dazu das Postfach, an das der Cron des Hosters die Ausgabe von `purge.php` und `retry.php` mailt (nur Anzahlen) | Formularinhalte | unbekannt (F-06). Liegt das Postfach bei einem anderen Anbieter oder wird weitergeleitet, kommt dieser Anbieter hier hinzu. | offen | zu prüfen | offen |

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
| GitHub (Repository, Actions) | Quelltext, Tests, Build (`ci.yml`), Integrationstests im Container (`integration.yml`), wöchentlicher Ablaufwarnlauf für `security.txt` (`security-txt.yml`), Deploy (`deploy.yml`, manuell, geschützte Umgebung) | Quelltext; Deploy-Zugang (SSH-Schlüssel, Host, `.htpasswd` der Vorschau) als Secrets. Artefakte: `e2e-diagnose` und `integration-diagnose` nur bei Fehlschlag, 7 Tage (Zugriffsprotokoll des Testservers, Compose-Protokolle, Playwright-Traces, nur Testdaten mit `example.com` und Dokumentationsnetzen); `release-package` 14 Tage (Build ohne `config.php`) | keine Leads, keine Logs des Betriebs, keine Kundendaten im Repository oder in CI-Läufen: der Deploy liest weder Datenbank noch Protokolle, der Rauchtest sendet keine Formulardaten (Datenschutzprüfung P-41 bis P-43). Ort der gehosteten Runner nicht festgelegt. Standort und Vertrag von GitHub vom Auftraggeber zu bewerten (offen, Q-09) |
| npm-Registry | Abhängigkeiten zum Build | keine personenbezogenen | Lockfile, Prüfung im CI |
| Packagist / PHPMailer (Bibliothek) | `phpmailer/phpmailer` ^7 für den SMTP-Versand, `composer.lock` im Repository, `composer audit` im CI; `vendor/` kommt fertig mit dem Release-Paket | keine; die Bibliothek läuft im eigenen PHP-Prozess auf dem Webspace. **Kein Auftragsverarbeiter**, weil sie keine Daten an den Bibliotheksautor übermittelt | LGPL-2.1-Lizenz des Pakets vor Auslieferung prüfen; Composer lädt nur zum Bau, nicht zur Laufzeit |
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
Gespräch mit der Datenschutzberatung. Was der Code heute tatsächlich tut,
steht im Datenfluss-Inventar der Datenschutzprüfung (`docs/qa/2026-11-datenschutz.md` §3).

| Daten | Ort | Vorschlag | Verfahren und Stand |
|---|---|---|---|
| Kontaktanfragen | MariaDB beim Hoster | Löschung 30 Tage nach Eingang (`retention_days` = 30, entschieden 2026-11-19) | stündlicher Cronjob `bin/purge.php` löscht nach Frist ab `created_at`, unabhängig davon, ob ein Vertragsverhältnis entsteht (die Anfrage liegt dann im Postfach bzw. beim Vertrieb); `held` und `not_delivered` werden nie automatisch gelöscht, bis zugestellt oder von Hand erledigt; `pending` wird nach Frist gelöscht, auch wenn nie zugestellt (DS-05); fehlt `retention_days` in `config.php`, lehnt `Config` die Datei ab (DS-09, Ä-42) |
| Rate-Limit-Zähler | MariaDB | HMAC der Herkunftsadresse (IPv6 auf /64, zusätzlich /48); Zähler gelten eine Stunde | gelöscht bei jedem POST und im stündlichen Cronjob, sobald das Fenster vorbei ist: höchstens etwa 2 h 17 min nach Fensterbeginn, wenn der Cron läuft |
| Rate-Limit-Schlüssel | MariaDB (`rate_limit_key`) | überschrieben einmal je UTC-Tag; Vorschlag der Prüfung: je Stundenfenster (DS-03) | beim ersten Gebrauch eines neuen Tages (Anfrage oder Cronjob), mit Cron bis 00:17 UTC |
| Anwendungsprotokoll (`log_path`), `purge.log`, `retry.log` | Dateien außerhalb des Webroots | Frist offen; Vorschlag wie Kontaktanfragen | keine Rotation (DS-04); enthalten nur Ereignisse, Lead-IDs und Anzahlen |
| Cron-Mails | Postfach des Betreibers | nach interner Regel | nur Anzahlen |
| E-Mails im Vertriebspostfach | Postfach | nach interner Regel des Auftraggebers | vom Auftraggeber zu beschreiben |
| Zugriffslogs | Hoster | kürzeste einstellbare Frist, IP-Adressen gekürzt, falls einstellbar | Einstellung im Hetzner-Konto (F-09) |
| Backups des Hosters | Hoster | Frist des Hosters; gelöschte Leads verschwinden mit Ablauf der Backups | in der Datenschutzerklärung berücksichtigen |
| CI-Artefakte (nur Testdaten) | GitHub | 7 Tage (Diagnose), 14 Tage (Release-Paket) | `retention-days` in den Workflows |

Auskunft, Berichtigung und Löschung auf Anfrage: Vorschlag für den Betreiber
mit SQL-Anweisungen in `docs/qa/2026-11-datenschutz.md` §7.

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
- Aufbewahrungsfrist der Anfragen: entschieden, 30 Tage ab Eingang (2026-11-19). Offen bleibt
  die Frist der Protokolldateien (gilt derzeit ebenfalls 30 Tage) und den Umgang mit `held`/`not_delivered`
  (Datenschutzprüfung Q-05).
- Frage an den Auftraggeber: Backup-Frist des Hosters für Webspace und
  Datenbank (Q-07).
- Frage an den Auftraggeber: Wird das Vertriebspostfach weitergeleitet (auch
  in Drittländer) oder in ein CRM übernommen, und ist die Strecke vom
  Versandserver zum Postfach verschlüsselt (Q-06, Q-08)?
