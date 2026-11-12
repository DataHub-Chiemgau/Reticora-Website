import type { SolutionContent } from '../solution';

/** Texte der Seite „Lösungen für MSPs“, wörtlich aus docs/copy/loesungen-msp-de.md. */
export const MSP: SolutionContent = {
  meta: {
    title: 'Reticora für Managed-Service-Provider (MSP)',
    description:
      'Neuen Kunden aufnehmen, Rechte je Kunde vergeben, gleiche Adressbereiche trennen, Verträge und SLAs im Blick: So arbeiten MSPs mit Reticora.',
  },
  hero: {
    title: 'Für MSPs: jeder Kunde getrennt, alle in einer CMDB.',
    lead: 'Organisation, Kunde, Standort: In Reticora arbeiten Sie für alle Kunden in einer Anwendung, und die Daten bleiben bis in die Datenbank getrennt. Vier Situationen aus dem Alltag zeigen, wie. [C-32, C-06]',
    actions: ['demo', 'trial'],
  },
  situations: [
    {
      id: 'neuer-kunde',
      title: 'Ein neuer Kunde kommt dazu.',
      text: [
        'Sie legen den Kunden und seine Standorte an. Im Netz des Kunden installieren Sie einen Collector und geben den Enrollment-Code ein, der 24 Stunden gilt. Der Collector verbindet sich nur nach außen; beim Kunden ist keine eingehende Regel in der Firewall nötig. [C-32, C-41, C-02, C-77] Er schlägt die Netze vor, in denen er steht; Sie bestätigen die Scopes, und die ersten CIs erscheinen beim richtigen Kunden. [C-29]',
      ],
      features: ['Kunden und Standorte', 'Collector', 'Scopes'],
      shot: { id: 'S-18', caption: 'Der Arbeitsbereich: Organisation, Kunde, Standort.' },
    },
    {
      id: 'zwei-kunden',
      title: 'Ein Techniker betreut nur zwei Kunden.',
      text: [
        'Sie geben ihm eine Rolle mit Geltungsbereich auf diese beiden Kunden; Rollen lassen sich auch auf Standorte oder Teams begrenzen. Er sieht dann nur deren Daten – in der Oberfläche, in der API, in der Suche und im Export. [C-33, C-84, C-93] Die Trennung erzwingt die Datenbank selbst, per Row-Level Security auf den Mandantentabellen. [C-06] Felder, die er nicht sehen soll, etwa Kaufpreise, blenden Sie über Feldrechte aus. [C-89]',
      ],
      features: ['Rollen mit Geltungsbereich', 'Row-Level Security', 'Feldrechte'],
      shot: { id: 'S-17', caption: 'Berechtigungen.' },
    },
    {
      id: 'gleiches-netz',
      title: 'Zwei Kunden nutzen dasselbe private Netz.',
      text: [
        'Beide Kunden haben `192.168.1.0/24`. Sie ordnen ihre Scopes verschiedenen VRFs zu; Subnetze sind je VRF eindeutig, also kommen sich die Adressen nicht in die Quere. [C-43, C-85] Geräte erkennt Reticora immer innerhalb eines Kunden: Ein Switch bei Kunde A wird nie mit einem Switch bei Kunde B zusammengeführt, auch wenn Name und Adresse gleich sind. [C-45]',
      ],
      features: ['Scopes mit VRF', 'Identitätsabgleich je Kunde'],
    },
    {
      id: 'vertraege-slas',
      title: 'Ein Kunde fragt nach Verträgen, Garantien und SLAs.',
      text: [
        'Verträge und Lieferanten hängen am Bestand, Reticora warnt vor dem Ablauf. Rechnungen und Garantiebelege liegen als Dokumente am Asset. [C-61, C-60] SLAs rechnen mit dem Geschäftskalender dieses Kunden, nicht mit Ihrem. [C-62] Für den Kunden exportieren Sie eine CSV-Datei, die nur Felder enthält, die Sie sehen dürfen. [C-74]',
      ],
      features: ['Verträge', 'Dokumente', 'SLAs', 'Export'],
      shot: { id: 'S-16', caption: 'Dashboard.' },
    },
  ],
  closing: {
    id: 'abschluss',
    title: 'Sehen Sie es sich mit Beispieldaten an.',
    text: 'Die Live-Demo zeigt Reticora mit Beispieldaten, ohne Konto. Oder testen Sie 30 Tage mit Ihrem eigenen Netz.',
    actions: ['demo', 'trial', 'contact'],
  },
};
