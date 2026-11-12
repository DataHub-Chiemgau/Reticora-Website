<?php

// Vorlage. Kopieren nach config.php, AUSSERHALB des Webroots ablegen und jeden Wert mit AENDERN ersetzen
// (sonst lehnt Config die Datei ab). config.php nie ins Repository einchecken.
return [
    // Origin-Prüfung (Spec §6.1) und Message-ID-Domain.
    'site_url' => 'https://www.reticora.de',

    // Direkte Kontaktadresse, wird auf der Hinweisseite bei Serverfehler/zu vielen Anfragen gezeigt.
    'contact_email' => 'kontakt@example.com',

    // Aufbewahrungsfrist der Anfragen in Tagen. Vorschlag 90; vom Auftraggeber festzulegen und zu bestätigen.
    'retention_days' => 90,

    // Rate-Limit (Spec §6.2, Ä-07): je Herkunft und Stunde (Standard 5, erlaubt 1–100) und angenommene Anfragen
    // insgesamt je Stunde (Standard 60, erlaubt 1–1000). Werte außerhalb werden auf die Grenze gesetzt.
    // 'rate_limit' => ['max' => 5, 'global_max' => 60],

    // Vorlagen der Kontaktseite (contact.de.html, contact.en.html, form-texts.json) aus dem Build.
    // Standard: templates/ neben vendor/ und src/.
    // 'templates_dir' => '/pfad/ausserhalb/des/webroots/templates',

    'db' => [
        // Eigener Datenbankbenutzer mit zufälligem Passwort (Spec Ä-11: der Datenbankserver ist von außen erreichbar).
        'dsn' => 'mysql:host=localhost;dbname=AENDERN;charset=utf8mb4',
        'user' => 'AENDERN',
        'pass' => 'AENDERN',
    ],

    'mail' => [
        'transport' => 'smtp',            // 'smtp' im Betrieb; 'file' nur für lokale Tests und nur mit allow_insecure
        'host' => 'smtp.example.com',
        'port' => 465,                    // 465 = implizites TLS ('ssl'), 587 = 'starttls'
        'encryption' => 'ssl',            // 'ssl' oder 'starttls'; 'none' nur mit allow_insecure
        'user' => 'versand@example.com',  // Anmeldung ist Pflicht
        'pass' => 'AENDERN',
        'helo_name' => 'www.example.com',
        'timeout' => 10,                  // Sekunden je Verbindungsaufbau und Lesevorgang
        'deadline' => 15,                 // Sekunden höchstens für eine Antwort des Servers
        'from_address' => 'versand@example.com',
        'from_name' => 'Reticora Website',
        'to_address' => 'vertrieb@example.com',   // Vertriebspostfach (einziger Empfänger, Spec Ä-09)
        // 'allow_insecure' => true,      // NUR Tests: erlaubt 'none', fehlende Anmeldung und transport 'file'
        // 'file_path' => '/tmp/reticora-mails.jsonl',
    ],

    // Fehlerprotokoll (ohne Formularinhalte, ohne IP). Außerhalb des Webroots.
    'log_path' => '',
];
