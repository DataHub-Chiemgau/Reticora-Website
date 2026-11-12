import type { PageContent } from '../../types';

/** Wörtlich aus docs/copy/produkt-api-de.md. Ein Verweis auf eine öffentliche API-Referenz folgt erst, wenn es sie gibt (F-15). */
export const API: PageContent = {
  meta: {
    title: 'REST-API, Webhooks und Export – Reticora',
    description:
      'REST-API nach OpenAPI mit additiven Änderungen, Fehlern nach RFC 7807 und festen Limits. Signierte Webhooks, CSV- und DATEV-Export, Import mit Probelauf.',
  },
  hero: {
    title: 'Eine REST-API mit festen Regeln.',
    lead:
      'Die REST-API unter `/api/v1` ist vollständig in OpenAPI beschrieben. Änderungen kommen nur hinzu. Was entfällt, kündigt Reticora mindestens 12 Monate vorher an. [C-11, C-71]',
    actions: ['trial', 'demo'],
  },
  sections: [
    {
      id: 'grundsaetze',
      title: 'Grundsätze',
      lead: 'Diese Regeln gelten für jeden Endpunkt unter `/api/v1`.',
      blocks: [
        {
          kind: 'specs',
          items: [
            { term: 'Beschreibung', value: 'OpenAPI, vollständig [C-11]' },
            { term: 'Änderungen', value: 'nur additiv; Abkündigung mit `Sunset`-Header, mindestens 12 Monate vorher [C-71]' },
            { term: 'Fehler', value: 'RFC 7807 mit `trace_id` [C-71]' },
            { term: 'Wiederholung', value: 'idempotent für 24 h [C-71]' },
            { term: 'Gleichzeitige Änderungen', value: 'Schutz per `ETag` [C-71]' },
            { term: 'Listen', value: 'Cursor, 50 Einträge je Seite, höchstens 200; Filter, Sortierung, Auswahl der Felder, Volltext `q` [C-71]' },
          ],
        },
      ],
    },
    {
      id: 'anmeldung',
      title: 'Anmeldung und Limits',
      blocks: [
        {
          kind: 'split',
          paras: [
            'Programme melden sich mit einem API-Schlüssel im Kopf `X-API-Key` an. Ein Schlüssel beginnt mit `rk_live_`, gehört einem Nutzer oder einem Service-Account und wird nur als Hash gespeichert. Schlüssel rotieren mit Überlappung, damit Ihre Integration beim Wechsel nicht ausfällt. [C-11, C-75] Ein Schlüssel sieht nur, was seine Rolle sehen darf, bis auf das einzelne Feld. [C-33, C-89]',
          ],
          side: {
            kind: 'code',
            title: 'GET /api/v1/cis',
            code: '# Alle CIs, deren Name „core“ enthält, 50 je Seite\ncurl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50" \\\n  -H "X-API-Key: rk_live_…"',
          },
        },
        {
          kind: 'specs',
          title: 'Limits',
          items: [
            { term: 'je Schlüssel oder Sitzung', value: '600 Anfragen je Minute [C-38, C-72]' },
            { term: 'je Organisation', value: '6.000 Anfragen je Minute [C-72]' },
            { term: 'vor der Anmeldung, je IP-Adresse', value: '20 Anfragen je Minute [C-72]' },
          ],
        },
      ],
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Abonnieren Sie Ereignisse, statt die API abzufragen. Jede Zustellung ist mit HMAC-SHA256 signiert; Ihr Empfänger prüft die Signatur mit dem gemeinsamen Geheimnis. Schlägt eine Zustellung fehl, wiederholt Reticora sie mit wachsendem Abstand von 30 Sekunden bis 6 Stunden. Danach landet sie in der Dead-Letter-Queue, und das Abonnement wird deaktiviert. [C-73] Auch in Webhooks gelten die Feldrechte. [C-89] Ziele in privaten Netzen oder bei Metadaten-Diensten nimmt Reticora nicht an. [C-81]',
          ],
          shot: { id: 'S-15', caption: 'Webhooks: Abonnements, Zustellverlauf und Dead-Letter-Queue.' },
        },
      ],
    },
    {
      id: 'export-import',
      title: 'Export und Import',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Der CSV-Export läuft im Hintergrund. Er schreibt UTF-8 mit BOM und Semikolon, damit die Datei in Tabellenprogrammen richtig aufgeht, enthält nur die Felder, die Sie sehen dürfen, und legt ein Manifest bei. Die Adresse zum Herunterladen gilt 15 Minuten. Für die Buchhaltung gibt es den DATEV-Export (ab Standard). Beim Import ordnen Sie die Spalten über ein gespeichertes Profil zu und starten zuerst einen Probelauf. [C-74, C-11]',
          ],
        },
      ],
    },
    {
      id: 'massenaenderungen',
      title: 'Massenänderungen',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Eine Massenänderung umfasst bis 500 IDs. Ab 100 IDs läuft sie als Job im Hintergrund und liefert einen Bericht, welche Einträge nicht geändert werden konnten. [C-76]',
          ],
        },
      ],
    },
  ],
};
