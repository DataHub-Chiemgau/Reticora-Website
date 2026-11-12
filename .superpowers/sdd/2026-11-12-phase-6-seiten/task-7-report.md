# Task 7 Report: Kontaktseite, Dankeseite, Formular-Insel

Status: DONE_WITH_CONCERNS. Commit "Kontaktformular und Dankeseite".

## Gebaut
- `/kontakt/`, `/kontakt/danke/` (noindex): `src/views/{Contact,Thanks}.astro`, dünne Seiten, Texte aus `src/content/de/kontakt.ts` (wörtlich aus `kontakt-de.md`), Formulartexte/Fehlertexte in `ui(lang).form` (de und en), Platzhaltertexte in `ui.placeholders`.
- Bausteine: `Field.astro` (Label, Hilfetext, Fehlerplatz mit `aria-describedby`, `aria-invalid` setzt die Insel), `ErrorSummary.astro` (`role="alert"`, `tabindex=-1`, Fokus), `Placeholder.astro` (`data-placeholder`, `.rt-placeholder`, auch von Task 8 genutzt).
- Insel `src/islands/form.ts`: 2001 Byte minifiziert (Test ≤ 3 KB). Token beim Laden und alle 100 min neu (Token gilt 2 h; sonst würde eine lange offene Seite stillschweigend verworfen), `fetch` + `Accept: application/json`, 200 -> Dankeseite (Pfad aus `data-thanks`), 422 -> Feldfehler + Zusammenfassung mit Fokus, 429/5xx/Netz -> Meldung mit direktem Kontakt (SITE oder Platzhalter) und Fokus, Knopf wieder frei. `?fehler=`/`?error=`: nur Codes, die als `<li data-code>` im Dokument stehen, Text per `textContent`. Alle Texte stehen serverseitig im HTML (`#form-msgs`, `[data-notice]`), das JS enthält keine Texte. Ohne JS: normales POST, bei Fehler `#fehler` per `:target`.
- `LINKS.lead = '/api/lead.php'` (einzige Adresse der eigenen Domain; `data.test.ts` angepasst).
- Backend (erlaubte Minimaländerung): `rate_limit.max` (Standard 5, Werte < 1 -> 5), 2 PHPUnit-Tests, README, config.example. PHPUnit: OK (115 tests, 398 assertions).
- Test-Server: `start.sh` startet zwei `php -S`-Instanzen (8081 "main" mit `rate_limit.max=100000`, 8082 "limit" mit Standardlimit), je eigene SQLite-DB, Datei-Transport, Secret, `site_url=http://127.0.0.1:8080`, alles unter `$TMPDIR/reticora-e2e` (wird beim Ende gelöscht; Tests lesen es). Apache: `mod_proxy`/`mod_proxy_http` nur in der Testkonfiguration, `/api/lead.php` -> 8081, `/api-limit/lead.php` -> 8082 (nur für den Limit-Test), `ProxyPreserveHost On`, `Origin` bleibt unverändert. Ohne PHP (oder ohne pdo_sqlite/mbstring, Proxy-Module) bricht das Skript mit klarer Meldung ab. `ci.yml` unverändert: PHP-Setup steht schon vor dem e2e-Schritt.
- `public/.htaccess`: CSP hatte `form-action 'self'` und `connect-src 'self'` schon; neu: `/backend/…` und Dateien/Ordner mit führendem Punkt (außer `.well-known`) -> 403; die index.html-Regel nutzt `%1` statt `$1` (nötig, damit sie auch in `/en/` mit `RewriteOptions Inherit` stimmt).

## Tests
`tests/e2e/contact.spec.ts` (28 Tests je Browser): Seite/Felder/autocomplete/Optionen, Köderfeld-Attribute, direkter Kontakt, Dankeseite; Erfolg mit JS (Anfrage in SQLite, Mail in Datei), Tastaturweg bis Dankeseite (Köderfeld wird übersprungen), leeres Formular (Zusammenfassung, Fokus, Links, aria-invalid, Aufräumen), 7 Feldfehler (name/company too_long+invalid, email invalid+too_long, message too_long), Anliegen leer, Köderfeld gefüllt, Absenden unter 3 s, 429/500/Abbruch, `?fehler=` mit Einschleusungsversuch, unbekannte Codes; ohne JS: Erfolg, Server-Fehler (Redirect `/kontakt/?fehler=name.too_long#fehler`, `#fehler` sichtbar, nichts aus der Eingabe in der Adresse); Token-Endpunkt, Origin-Durchreichung (fremd 403, eigene 200), Rate-Limit (nur Chromium, eigene Instanz), axe (Ausgang, Fehlerzustand, Serverfehlermeldung), keine fremden Hosts/Konsolenfehler/CSP-Verstöße/Cookies. Hilfsfunktion `tests/e2e/helpers/backend.ts` (liest SQLite über PHP/PDO; kein `sqlite3`-CLI nötig). `server.spec.ts` (CSP, /backend/, Dotfiles) folgt im Commit von Task 8.
- Ergebnisse siehe Task-8-Bericht (gemeinsamer Lauf der ganzen Kette).

## Abweichungen vom Textdokument / Hinweise
- Backend kennt nur `topic.invalid` (kein `topic.required`): leeres Anliegen zeigt in der Insel den Text „required“, bei Rücksprung ohne JS nur die allgemeine Zeile (die Zusammenfassung aus `?fehler=…` zeigt dann den Text von `topic.invalid`).
- Kein Text im Dokument für `message.invalid` und `lang.invalid`: `message.invalid` = „Bitte verwenden Sie keine Steuerzeichen.“ (eigene Formulierung, UI-Text); `lang.invalid` zeigt die Insel als allgemeine Serverfehler-Meldung (tritt nie auf, `lang` ist immer gesetzt).
- Bei `email.too_long`: Test bestätigt den Code gegen das echte Backend.
- Zusammenfassungs-Überschrift ist ein `<p>` (leere, verborgene `h2` verletzt html-validate).
- Zeitfalle: Absenden unter 3 s nach dem Laden wird still verworfen (Backend-Entwurf); Tests warten 3,3 s.
- Danke-Seite ohne `Cta` (Textdokument sieht eigene Weiter-Knöpfe vor); Kontaktseite endet ebenfalls ohne `Cta` (Formular ist das Ziel).
- Rate-Limit-Test läuft nur in Chromium (Zähler je Herkunft, geteilt); robust gegen CI-Retry.

## Concerns
- Die laufende Test-Apache-Instanz (Port 8080) wird von Playwright wiederverwendet; ein von früher übrig gebliebener Server hat keine PHP-Instanzen. Die Prüfkette muss einen frischen Start nutzen.
