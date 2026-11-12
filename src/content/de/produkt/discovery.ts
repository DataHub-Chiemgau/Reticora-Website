import type { PageContent } from '../../types';

/** Wörtlich aus docs/copy/produkt-discovery-de.md. */
export const DISCOVERY: PageContent = {
  meta: {
    title: 'Discovery – so liest Reticora Ihr Netz aus',
    description:
      'Ein Collector in Ihrem Netz erfasst Geräte über SNMP, SSH und Redfish und verbindet sich nur nach außen. Sweep alle 24 h, Abfrage alle 15 min.',
  },
  hero: {
    title: 'Ihr Bestand entsteht aus Ihrem Netz, nicht aus einer Tabelle.',
    lead:
      'Ein Collector in Ihrem Netz findet die Geräte, fragt sie über SNMP, SSH und Redfish ab und liefert die Ergebnisse an Reticora. Sie legen fest, welche Netze er durchsucht. [C-01]',
    actions: ['trial', 'demo'],
    strip: [
      { label: 'Sweep', value: 'alle 24 h', claim: 'C-26' },
      { label: 'Poll', value: 'alle 15 min, ab 5 min einstellbar', claim: 'C-26' },
      { label: 'Puffer', value: 'bis 24 h', claim: 'C-27' },
      { label: 'Verbindung', value: 'nur ausgehend · 443, 4222', claim: 'C-02' },
    ],
  },
  sections: [
    {
      id: 'collector',
      title: 'Der Collector in Ihrem Netz',
      blocks: [
        {
          kind: 'split',
          paras: [
            'Sie installieren den Collector als Docker-Image, als virtuelle Maschine (OVA) oder mit dem Windows-Installer. [C-28] Bei der ersten Verbindung geben Sie einen Enrollment-Code ein, der 24 Stunden gilt. Der Collector erhält damit ein eigenes Zertifikat für 90 Tage und erneuert es selbst. [C-41] Jede Verbindung baut er nach außen auf: HTTPS auf Port 443 und NATS mit mTLS auf Port 4222. In Ihrem Netz brauchen Sie keine eingehende Regel, kein VPN und keine Portweiterleitung. [C-02, C-77]',
          ],
          side: {
            kind: 'specs',
            items: [
              { term: 'Auslieferung', value: 'Docker-Image, OVA, Windows-Installer [C-28]' },
              { term: 'Enrollment-Code', value: 'gilt 24 h, nur einmal [C-41]' },
              { term: 'Zertifikat', value: '90 Tage, erneuert sich ab 60 % der Laufzeit [C-41]' },
              { term: 'Lebenszeichen', value: 'alle 60 s; offline nach 5 min ohne Meldung [C-42]' },
              { term: 'Updates', value: 'nur signiert, Kanäle stable und beta, mit Rollback [C-42]' },
            ],
          },
        },
        {
          kind: 'schema',
          caption: 'Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung. [C-02]',
        },
      ],
    },
    {
      id: 'scopes',
      title: 'Scopes: Sie bestimmen, was durchsucht wird',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Nach dem Enrollment meldet der Collector die Netze, in denen er steht, und schlägt sie als Scopes vor. Jeder Vorschlag erscheint als Review in der Review-Inbox; erst wenn Sie ihn bestätigen, wird durchsucht. [C-29, C-49] Ein Scope legt CIDR, einzelnen Host oder Adressbereich samt VRF fest, dazu Zeitplan, Zugangsdaten und Plugins. [C-43] Weil Subnetze je VRF eindeutig sind, dürfen sich Adressbereiche in verschiedenen VRFs überschneiden. [C-85]',
          ],
        },
        {
          kind: 'shots',
          shots: [
            { id: 'S-07', caption: 'Discovery: Scopes und Status der Collectors.' },
            { id: 'S-08', caption: 'Erste Schritte: Registrierung, Verifikation, Collector verbinden, Scopes bestätigen, erste CIs.' },
          ],
        },
      ],
    },
    {
      id: 'protokolle',
      title: 'Sweep und Abfrage: welche Protokolle wofür',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Der Sweep findet, was in einem Scope erreichbar ist. Danach fragt der Collector jedes Gerät über das Protokoll ab, das zu ihm passt. Alle diese Abfragen bleiben in Ihrem Netz; nach außen geht nur das Ergebnis. [C-39, C-01, C-77]',
          ],
        },
        {
          kind: 'table',
          label: 'Protokolle und ihr Einsatz',
          rowHeader: 'protocol',
          columns: [
            { key: 'protocol', head: 'Protokoll' },
            { key: 'use', head: 'Einsatz' },
          ],
          rows: [
            { protocol: 'ICMP, ARP, Reverse-DNS', use: 'Sweep: erreichbare Adressen und ihre Namen; ICMP mit höchstens 256 parallelen Anfragen [C-39]' },
            { protocol: 'Ports 22, 80, 443, 623, 5985, 8006', use: 'Sweep, auf Wunsch: Hinweis auf SSH, Weboberfläche, BMC, WinRM und Proxmox [C-39]' },
            { protocol: 'SNMP v2c und v3', use: 'Switches, Router, Firewalls, Access Points, USVs, PDUs, NAS [C-01, C-08]' },
            { protocol: 'SSH', use: 'Linux, Proxmox VE, TrueNAS und Kommandos auf Netzwerkgeräten [C-01, C-08]' },
            { protocol: 'Redfish', use: 'Server-Controller: Dell iDRAC, HPE iLO, Lenovo XCC, Supermicro [C-01, C-08]' },
            { protocol: 'WMI, IPMI', use: 'ergänzend, wo die übrigen Wege nicht reichen [C-01]' },
            { protocol: 'NAS- und Strom-Plugins', use: 'Werte von NAS, USVs und PDUs [C-01]' },
          ],
        },
      ],
    },
    {
      id: 'klassifikation',
      title: 'Klassifikation: Was ist das für ein Gerät?',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Der Collector prüft jedes gefundene Gerät in fester Reihenfolge: zuerst die Antwort auf SNMP, dann Redfish, dann das Banner des Dienstes. Dazu nimmt er die Herstellerkennung der MAC-Adresse. Passt ein Profil, stehen Typ, Hersteller und Modell fest. Passt keines, legt Reticora ein generisches Gerät an und öffnet ein Review. Sie setzen den Typ, und nichts geht verloren. [C-40, C-91] Die Profile sind beschreibende Dateien; neue oder geänderte Profile lädt der Collector ohne neue Version. [C-88]',
          ],
        },
        { kind: 'link', link: { label: 'Alle unterstützten Geräte', href: '/geraete/' } },
      ],
    },
    {
      id: 'takt',
      title: 'Takt, Puffer und was nicht mehr antwortet',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Standardmäßig läuft der Sweep alle 24 Stunden, die Abfrage über SNMP und Redfish alle 15 Minuten; Sie können bis auf 5 Minuten heruntergehen. [C-26] Reißt die Verbindung ab, puffert der Collector bis zu 24 Stunden und liefert danach in der ursprünglichen Reihenfolge nach. [C-27] Jeder Wert trägt den Zeitpunkt seiner Beobachtung, nicht den seiner Ankunft. [C-47] Ein CI, das seit dem Dreifachen des Scope-Intervalls nicht gesehen wurde, erhält den Status „unknown“; Reticora löscht es nicht. Von Hand angelegte CIs sind davon ausgenommen. [C-44]',
          ],
        },
      ],
    },
    {
      id: 'zugangsdaten',
      title: 'Zugangsdaten',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Zugangsdaten für SNMP, SSH und Redfish speichert Reticora verschlüsselt (AES-256-GCM). An den Collector gehen sie über den mTLS-Kanal und zusätzlich auf seinen Schlüssel verschlüsselt. Im Klartext existieren sie nur im Arbeitsspeicher, nie auf Datenträgern, in API-Antworten oder Logs. [C-13]',
          ],
        },
        { kind: 'link', link: { label: 'Mehr zur Sicherheit', href: '/sicherheit/' } },
      ],
    },
  ],
};
