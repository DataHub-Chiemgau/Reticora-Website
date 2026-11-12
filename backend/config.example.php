<?php

// Vorlage. Kopieren nach config.php, AUSSERHALB des Webroots ablegen und Werte eintragen.
// config.php nie ins Repository einchecken.
return [
    // Origin-Prüfung (Spec §6.1) und Message-ID-Domain.
    'site_url' => 'https://www.reticora.de',

    // Direkte Kontaktadresse, wird auf der Hinweisseite bei Serverfehler/zu vielen Anfragen gezeigt.
    'contact_email' => 'kontakt@example.com',

    // HMAC-Schlüssel (Zeitfalle, Rate-Limit-Tagesschlüssel). Mindestens 32 Zufallszeichen, z. B. `openssl rand -hex 32`.
    'secret' => 'AENDERN-mindestens-32-zufaellige-zeichen-AENDERN',

    // Aufbewahrungsfrist der Anfragen in Tagen. Vorschlag 90; vom Auftraggeber festzulegen und zu bestätigen.
    'retention_days' => 90,

    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=DBNAME;charset=utf8mb4',
        'user' => 'DBUSER',
        'pass' => 'DBPASS',
    ],

    'mail' => [
        'transport' => 'smtp',            // 'smtp' im Betrieb; 'file' nur für lokale Tests (schreibt Personendaten in Datei)
        'host' => 'smtp.example.com',
        'port' => 465,                    // 465 = implizites TLS ('ssl'), 587 = 'starttls'
        'encryption' => 'ssl',
        'user' => 'versand@example.com',
        'pass' => 'SMTPPASS',
        'helo_name' => 'www.example.com',
        'timeout' => 10,
        'from_address' => 'versand@example.com',
        'from_name' => 'Reticora Website',
        'to_address' => 'vertrieb@example.com',   // Vertriebspostfach
        // 'file_path' => '/tmp/reticora-mails.jsonl',
    ],

    // Signatur der Bestätigungsmail je Sprache. Bewusst leer: Die gesetzlich erforderlichen Angaben
    // (Firma, Anschrift, Vertretungsberechtigte, Registereintrag, USt-IdNr.) liefert der Anbieter.
    'signature' => [
        'de' => '',
        'en' => '',
    ],

    // Fehlerprotokoll (ohne Formularinhalte, ohne IP). Außerhalb des Webroots.
    'log_path' => '',
];
