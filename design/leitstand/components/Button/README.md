# Button

Ein Knopf löst genau eine Handlung aus und sagt im Wortlaut, was geschieht.

**Sie liefern:** die Beschriftung, das Ziel (`href`) oder die Aktion (`button`), die Variante.

- `rt-btn--primary`: genau einer je Bildschirmhöhe. Auf Marketingseiten ist das „30 Tage testen“.
- `rt-btn--secondary`: die zweite Handlung daneben, in der Regel „Live-Demo“.
- `rt-btn--quiet`: Handlungen ohne Gewicht in der Kopfzeile („Anmelden“) und neben Formularknöpfen.
- `rt-btn--lg`: nur im Seitenanfang und im Abschlussband.

Regeln:

- Beschriftung als Verb oder feste Wendung der App: „Konto anlegen“, „Absenden“, nie „Mehr erfahren“ oder „Los geht’s“.
- Höhe mindestens `target-min` (44 px). Nie schmaler als das Wort plus zweimal `space-5`.
- Ein Knopf, der zur App oder zur Demo führt, ist ein Link (`a`), kein `button`.
- Deaktiviert nur während des Sendens; die Beschriftung wechselt dann zu „Wird gesendet …“.
- Kein Symbol vor der Beschriftung, kein Verlauf, kein Schatten.
