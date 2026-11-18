# Betrieb: Auskunft, Berichtigung und Löschung auf Anfrage

Vorgehen für den Betreiber, wenn eine Person nach Art. 15 bis 17 DSGVO wissen will, welche Daten aus dem Kontaktformular
gespeichert sind, oder ihre Berichtigung oder Löschung verlangt. Übernommen aus dem Datenschutz-Prüfprotokoll
(`docs/qa/2026-11-datenschutz.md`, Abschnitt 7, Mangel DS-06) und auf den Stand nach der Behebung gebracht (stündlicher
Rate-Limit-Schlüssel, Tagesprotokolle).

**Dies ist ein technischer Vorschlag, keine Rechtsauskunft.** Fristen, Form der Antwort, Identitätsprüfung und wer die Anfragen
bearbeitet, legt der Auftraggeber fest (Datenschutzprotokoll Q-12). Die SQL-Anweisungen beziehen sich auf
`backend/sql/001_init.sql`.

## Wo es Daten zu einer Person geben kann

| Ort | Suche möglich? |
|---|---|
| Tabelle `lead` | ja, über `email` (und `name`, `company`) |
| Vertriebspostfach, Versandkonto, CRM | ja, im Mailprogramm; außerhalb der Website |
| Tabellen `rate_limit`, `rate_limit_key` | nein: keine Adresse gespeichert. Eine Zuordnung wäre nur mit der IP-Adresse und dem Schlüssel desselben Stundenfensters möglich; Schlüssel und Zähler sind nach höchstens etwa zwei Stunden weg (Spec Ä-36). |
| Anwendungsprotokoll (`lead-JJJJ-MM-TT.log`), `purge-…`, `retry-…` im Ordner von `log_path` | nur Lead-IDs: nach der ID aus `lead` suchen. Tagesdateien werden nach `retention_days` gelöscht (Spec Ä-40). |
| Zugriffsprotokolle und Backups des Hosters | über den Hoster |

## Verbindung

Per SSH (Port 222) auf dem Hosting-Konto, Zugangsdaten aus `~/reticora-config/config.php`; das Passwort nie auf der
Befehlszeile übergeben:

```
mariadb -h <host aus db.dsn> -u <db.user> -p <dbname aus db.dsn>
```

## Auskunft (Art. 15)

```sql
SELECT id, created_at, lang, name, email, company, topic, message, delivery
FROM lead
WHERE LOWER(email) = LOWER('person@example.com')
ORDER BY created_at;
```

Ohne Treffer zusätzlich nach dem Namen suchen (Treffer vor der Auskunft auf Zugehörigkeit prüfen):

```sql
SELECT id, created_at, email, company FROM lead WHERE name LIKE '%Nachname%';
```

`created_at` ist UTC. `topic` ist ein Schlüssel (`demo` = Vorführung, `enterprise`, `security` = Sicherheit und Datenschutz,
`other` = Sonstiges). `delivery`: `delivered` (an den Vertrieb gemailt), `held` (zurückgehalten, noch nicht gemailt),
`not_delivered` (Versand gescheitert), `pending` (Versand lief oder ist abgebrochen).

Ausgabe als Datei: `mariadb … --batch -e "<SELECT …>" > auskunft.tsv`, die Datei nach dem Versand löschen. Danach die
Protokolle nach den IDs durchsuchen:

```
grep -E 'id=(17|23)( |$)|lead=(17|23) ' ~/reticora-config/lead-*.log
```

## Berichtigung (Art. 16)

```sql
UPDATE lead SET email = 'neu@example.com' WHERE id = 17;
```

## Löschung (Art. 17)

Zuerst prüfen, dann löschen, dann prüfen:

```sql
SELECT id, created_at, delivery FROM lead WHERE LOWER(email) = LOWER('person@example.com');
DELETE FROM lead WHERE id IN (17, 23);
SELECT COUNT(*) FROM lead WHERE LOWER(email) = LOWER('person@example.com');
```

Steht ein Lead auf `held`, `not_delivered` oder `pending`, gibt es davon (noch) keine Mail im Postfach; vor dem Löschen klären,
ob die Anfrage noch beantwortet werden soll. Mails im Vertriebspostfach und im CRM getrennt löschen. Kopien in Backups des
Hosters verschwinden erst mit deren Ablauf (Datenschutzprotokoll Q-07). Zeilen im Anwendungsprotokoll enthalten nur IDs; sie
verlieren mit dem Löschen des Leads den Bezug und werden mit ihrer Tagesdatei nach `retention_days` gelöscht.

## Testanfragen nach der Abnahme (Phase 8)

Die IDs der Testanfragen beim Absenden notieren und gezielt löschen (`DELETE FROM lead WHERE id IN (…)`), nicht über Muster in
`email`.

## Nachweis

Datum, Anliegen und erledigte Schritte außerhalb des Repositorys festhalten, ohne die Daten selbst zu kopieren.
