# ContactForm

Das Kontaktformular fragt fünf Angaben ab: Name, geschäftliche E-Mail-Adresse, Unternehmen, Anliegen und eine freiwillige Nachricht.

**Sie liefern:** das Ziel (`/api/lead.php`), die Sprache und den Hinweis zur Datenverarbeitung, dessen Wortlaut vom Anbieter kommt.

- Keine weiteren Felder: kein Telefon, keine Position, keine Unternehmensgröße, kein Newsletter-Häkchen.
- Jedes Feld hat ein sichtbares `label`. Platzhaltertext ersetzt kein Label.
- Das Formular sendet ohne JavaScript. Der Server prüft jede Eingabe; die Prüfung im Browser ist nur Komfort.
- Fehler: Zusammenfassung über dem Formular mit Sprungmarken, dazu der Fehlertext unter dem Feld, verbunden über `aria-describedby`, Feld mit `aria-invalid="true"`. Der Text sagt, was fehlt und wie es richtig aussieht.
- Erfolg: eigene Seite `/kontakt/danke/`; mit JavaScript zusätzlich die Meldung an Ort und Stelle (`role="status"`).
- Ein unsichtbares Köderfeld und eine Zeitfalle wehren Spam ab. Kein Captcha eines Dritten.
- Feldhöhe mindestens `target-min`, Umriss in `control`, im Fehlerfall in `danger`.
- Die Vorschau zeigt Fehler und Erfolg gleichzeitig, damit beide Zustände sichtbar sind. Auf der Website erscheint immer nur einer.
