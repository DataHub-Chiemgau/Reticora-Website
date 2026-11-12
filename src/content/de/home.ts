import type { ClaimId } from '../../data/types';

/** Texte der Startseite, wörtlich aus docs/copy/startseite-de.md. Preise und Limits stehen in src/data/pricing.ts. */
export interface Row { term: string; value: string; claim: ClaimId }
export interface Item { title: string; text: string; claim: ClaimId }

export const HOME = {
  meta: {
    title: 'Reticora – die CMDB, die Ihr Netz selbst ausliest',
    description:
      'CMDB für ISPs und Netzwerk-MSPs: Ein Collector liest Ihr Netz aus, jedes Feld zeigt Quelle und Zeitpunkt. Mit Topologie, Racks und Ausfallsimulation.',
  },
  hero: {
    h1: 'Die CMDB, die Ihr Netz selbst ausliest und jeden Wert belegt.',
    lead: 'Ein Collector in Ihrem Netz erfasst Switches, Router, Server, USVs und Storage. Reticora gleicht die Beobachtungen ab und zeigt zu jedem Feld Quelle und Zeitpunkt. Für ISPs und Netzwerk-MSPs.',
    strip: [
      { label: 'Sweep', value: 'alle 24 h', claim: 'C-26' },
      { label: 'Poll', value: 'alle 15 min', claim: 'C-26' },
      { label: 'Puffer', value: 'bis 24 h', claim: 'C-27' },
      { label: 'Verbindung', value: 'nur ausgehend · 443, 4222', claim: 'C-02' },
      { label: 'Hosting', value: 'EU', claim: 'C-07' },
    ] as { label: string; value: string; claim: ClaimId }[],
  },
  ablauf: {
    title: 'So entsteht Ihr Bestand',
    lead: 'Vom Collector bis zum geprüften Eintrag sind es fünf Schritte. Sie tippen dabei kein Gerät ab.',
    steps: [
      { title: 'Collector verbinden', text: 'Sie installieren den Collector in Ihrem Netz und geben einen Enrollment-Code ein. Er baut die Verbindung selbst auf. Von außen greift niemand in Ihr Netz.', claim: 'C-02' },
      { title: 'Scopes bestätigen', text: 'Der Collector meldet seine lokalen Netze. Sie entscheiden, welche durchsucht werden.', claim: 'C-29' },
      { title: 'Auslesen', text: 'Ein Sweep findet die erreichbaren Geräte. Danach fragt der Collector sie über SNMP, SSH und Redfish ab.', claim: 'C-01' },
      { title: 'Abgleichen', text: 'Reticora erkennt, welche Beobachtung zu welchem Gerät gehört: an Seriennummer, Hardware-UUID, MAC-Adressen und Management-IP. Aus einem Gerät wird nie ein zweites CI.', claim: 'C-05' },
      { title: 'Prüfen', text: 'Was nicht eindeutig ist, landet in der Review-Inbox. Dort entscheiden Sie. Ohne Sie wird nichts verworfen.', claim: 'C-04' },
    ] as Item[],
    schemaCaption: 'Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung.',
  },
  vertrauen: {
    title: 'Daten, denen Sie trauen',
    lead: 'Eine CMDB nützt nur, wenn man ihr glaubt. Reticora sagt zu jedem Feld, woher der Wert stammt, und überschreibt nie, was Sie von Hand gesetzt haben.',
    herkunft: {
      title: 'Jedes Feld mit Herkunft',
      text: 'Zu jedem Feld sehen Sie die Quelle, ihren Rang, den Zeitpunkt der Beobachtung und den Grund, warum dieser Wert gilt.',
      claim: 'C-03' as ClaimId,
      caption: 'Herkunft eines Feldes in der CI-Ansicht.',
    },
    rang: {
      title: 'Rangfolge der Quellen',
      text: 'manuell 100 · Import 95 · Workflow 92 · Redfish 90 · Agent 85 · SNMP 80 · API 75 · WMI 70 · SSH 60 · Sweep 20.',
    },
    manuell: {
      title: 'Manuell gewinnt',
      text: 'Ein Override bleibt, bis Sie ihn aufheben. Meldet eine Quelle später etwas anderes, sehen Sie beide Werte nebeneinander und entscheiden.',
      claim: 'C-04' as ClaimId,
    },
    review: {
      title: 'Entscheiden statt aufräumen',
      text: 'Die Review-Inbox sammelt, was die Automatik nicht allein entscheiden darf: ein unbekanntes Gerät, eine mögliche Dublette, widersprüchliche Werte. Sie vergleichen Beobachtung und CI und entscheiden: zusammenführen, neu anlegen, übernehmen oder verwerfen.',
      claim: 'C-30' as ClaimId,
      caption: 'Review-Inbox: Beobachtung und CI im Vergleich.',
    },
  },
  zusammenhang: {
    title: 'Sehen, was zusammenhängt',
    lead: 'Aus den Beobachtungen entsteht ein Bild Ihres Netzes: wer mit wem verbunden ist, was wo im Rack steckt und was betroffen ist, wenn ein Gerät ausfällt.',
    topologie: { title: 'Topologie', text: 'Nachbarschaften aus LLDP und die Abhängigkeiten zwischen CIs als Graph.', claim: 'C-31' as ClaimId, caption: 'Topologie: Beziehungen zwischen CIs als Graph.' },
    racks: { title: 'Racks', text: 'Die Belegung je Höheneinheit, Vorder- und Rückseite.', claim: 'C-10' as ClaimId, caption: 'Rack, Vorderseite.' },
    ausfall: {
      title: 'Ausfallsimulation',
      text: 'Lassen Sie ein oder mehrere CIs ausfallen und sehen Sie, was betroffen ist. Geräte mit zweiter Stromversorgung zählen erst, wenn beide Wege ausfallen.',
      claim: 'C-09' as ClaimId,
      caption: 'Ausfallsimulation in der Topologie.',
    },
  },
  kunden: {
    title: 'Für mehrere Kunden gebaut',
    lead: 'Organisation, Kunde, Standort: Der Arbeitsbereich steht immer im Kopf der Anwendung. Wer nur einen Kunden betreut, sieht nur dessen Daten.',
    specs: [
      { term: 'Ebenen', value: 'Organisation → Kunde → Standort', claim: 'C-32' },
      { term: 'Trennung', value: 'in der Datenbank erzwungen', claim: 'C-06' },
      { term: 'Rollen', value: 'mit Geltungsbereich je Kunde, Standort oder Team', claim: 'C-33' },
      { term: 'Zweiter Faktor', value: 'Pflicht für Administratoren', claim: 'C-34' },
    ] as Row[],
    caption: 'Der Arbeitsbereich: Organisation, Kunde, Standort.',
  },
  mehr: {
    title: 'Mehr als ein Inventar',
    lead: 'Auf demselben Bestand arbeiten auch Service-Desk, Lager und Compliance. Es gibt nur einen Bestand, also nichts abzugleichen.',
    items: [
      { term: 'Assets und Verträge', value: 'Kaufdaten, Zuweisung mit Unterschrift, Verträge und Dokumente am Gerät.', claims: ['C-35'] },
      { term: 'Lager und Inventur', value: 'Bestand, Bewegungen und Inventur mit Etiketten und Barcode.', claims: ['C-36'] },
      { term: 'Tickets', value: 'Tickets mit SLA und Geschäftskalender, direkt am betroffenen CI.', claims: ['C-37'] },
      { term: 'Monitoring', value: 'Erreichbarkeit, Interface-Zähler, USV- und PDU-Werte als Verlauf am CI; Alarmregeln lösen Tickets und Benachrichtigungen aus.', claims: ['C-24'] },
      { term: 'Workflows und Formulare', value: 'Übergaben, Genehmigungen und wiederkehrende Abläufe, ohne zu programmieren.', claims: ['C-24'] },
      { term: 'Compliance', value: 'Regeln, Befunde und ein Audit-Protokoll mit Hash-Kette.', claims: ['C-12', 'C-24'] },
    ] as { term: string; value: string; claims: ClaimId[] }[],
  },
  api: {
    title: 'Für Menschen und für Maschinen',
    lead: 'Die REST-API ist vollständig in OpenAPI beschrieben. Änderungen kommen nur hinzu. Was entfällt, wird mindestens zwölf Monate vorher angekündigt.',
    leadClaim: 'C-11' as ClaimId,
    codeTitle: 'GET /api/v1/cis',
    specs: [
      { term: 'Anmeldung', value: 'API-Schlüssel im Kopf X-API-Key', claim: 'C-11' },
      { term: 'Webhooks', value: 'signiert mit HMAC-SHA256', claim: 'C-11' },
      { term: 'Export', value: 'CSV und DATEV', claim: 'C-11' },
      { term: 'Limit', value: '600 Anfragen je Minute und Schlüssel', claim: 'C-38' },
    ] as Row[],
  },
  sicherheit: {
    title: 'Sicherheit, die man nachprüfen kann',
    lead: 'Was Ihre Informationssicherheit zuerst fragt, steht hier. Die Einzelheiten stehen auf der Seite „Sicherheit“.',
    items: [
      { term: 'Verbindung', value: 'Der Collector verbindet sich nach außen. Reticora öffnet keine Verbindung in Ihr Netz.', claim: 'C-02' },
      { term: 'Zugangsdaten', value: 'verschlüsselt gespeichert (AES-256-GCM); im Klartext nur im Arbeitsspeicher, nie auf Datenträgern, in API-Antworten oder Logs', claim: 'C-13' },
      { term: 'Trennung', value: 'Row-Level Security auf den Mandantentabellen', claim: 'C-06' },
      { term: 'Protokoll', value: 'Audit-Protokoll mit Hash-Kette je Organisation, prüfbar von der Kommandozeile', claim: 'C-12' },
      { term: 'Datenstandort', value: 'Daten, Backups, Logs und Suchindex in der EU', claim: 'C-07' },
    ] as Row[],
    link: 'Zur Seite Sicherheit',
  },
  geraete: {
    title: 'Erkennt, was in Ihren Racks steht',
    lead: 'Reticora bringt Profile für verbreitete Netzwerk-, Server-, Storage- und Stromgeräte mit. Was es nicht kennt, legt es als generisches Gerät an und fragt Sie.',
    leadClaim: 'C-08' as ClaimId,
    list: [
      { term: 'Netzwerk', value: 'Cisco Catalyst, ISR, ASR, ASA und Firepower · Aruba CX und ProCurve · Ubiquiti UniFi · MikroTik · FortiGate · OPNsense und pfSense' },
      { term: 'Server und Virtualisierung', value: 'Dell iDRAC · HPE iLO · Lenovo XCC · Supermicro BMC · VMware ESXi · Proxmox VE · Windows Server · Linux' },
      { term: 'Storage', value: 'Synology · QNAP · TrueNAS' },
      { term: 'Strom', value: 'USVs von APC und Eaton · PDUs von APC und Raritan' },
    ],
    note: 'Herstellernamen sind Marken ihrer Inhaber und stehen hier nur zur Beschreibung der Kompatibilität.',
    link: 'Alle unterstützten Geräte',
  },
  pakete: {
    title: 'Pakete und Preise',
    lead: 'Alle Pakete enthalten CMDB, Discovery, Topologie, Racks und API. Preise im Monat, zzgl. MwSt.',
    label: 'Preise und CI-Limits je Paket',
    heads: { plan: 'Paket', summary: 'Kurzbeschreibung', cis: 'CIs', price: 'im Monat' },
    betaLead: 'Beta-Rabatt:',
    beta: (first: number, next: number) => `${first} % in den ersten sechs Monaten, ${next} % in den folgenden sechs Monaten, danach der volle Preis.`,
    link: 'Alle Preise und Funktionen',
  },
  abschluss: {
    title: 'Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.',
    text: 'Der Test umfasst den Standard-Umfang für bis zu 100 CIs. Sie legen ein Konto an, bestätigen Ihre E-Mail-Adresse und richten bei der ersten Anmeldung eine Authenticator-App ein. Nach dem Test bleibt Ihre CMDB 30 Tage erhalten.',
    claim: 'C-22' as ClaimId,
  },
} as const;
