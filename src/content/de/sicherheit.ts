import type { Action, LinkRef, Rich, ShotRef } from '../types';

/** Texte der Seite „Sicherheit“, wörtlich aus docs/copy/sicherheit-de.md. Nicht genannt werden C-16, C-17 und Zertifizierungen. */
export interface PlaceholderRef { key: string; text: string }

export const sicherheit = {
  meta: {
    title: 'Sicherheit und Datenschutz – Reticora',
    description:
      'Betriebsmodelle, Verbindungsrichtung und Ports, Mandantentrennung in der Datenbank, verschlüsselte Zugangsdaten, MFA, Audit-Kette und Datenstandort EU.',
  },
  hero: {
    title: 'Was Ihre Informationssicherheit wissen will.',
    lead: 'Diese Seite beantwortet die Fragen einer Erstprüfung: wo die Daten liegen, welche Verbindungen es gibt, wie Kunden getrennt sind, wer sich wie anmeldet und was protokolliert wird. Jede Angabe hat einen Beleg.',
    actions: ['contact', 'demo'] as Action[],
    topic: 'security',
  },
  modelle: {
    id: 'betriebsmodelle',
    title: 'Betriebsmodelle',
    label: 'Betriebsmodelle nach Paket',
    columns: [
      { key: 'model', head: 'Modell' },
      { key: 'plans', head: 'Pakete' },
      { key: 'where', head: 'Wo Reticora läuft' },
    ],
    rows: [
      { model: 'Cloud', plans: 'Essentials, Standard, Pro', where: 'in der EU; der Collector läuft in Ihrem Netz [C-07, C-02]' },
      { model: 'Enterprise Shared', plans: 'Enterprise Shared', where: 'in der Cloud auf getrennter Infrastruktur [C-92]' },
      { model: 'Enterprise Local', plans: 'Enterprise Local', where: 'bei Ihnen gehostet; der Preis enthält alle Arbeiten dafür [C-92]' },
    ] as Record<string, Rich>[],
  },
  ports: {
    id: 'verbindungen',
    title: 'Verbindungen und Ports',
    text: 'Der Collector baut jede Verbindung selbst auf, nach außen, zu festen Hostnamen. Reticora öffnet nie eine Verbindung in Ihr Netz; Sie brauchen keine eingehende Regel, kein VPN und keine Portweiterleitung. Für HTTPS ist ein Proxy möglich; Port 4222 braucht eine direkte Verbindung, weil sich der Collector dort mit seinem Zertifikat ausweist. [C-02, C-77]' as Rich,
    label: 'Verbindungen und Ports des Collectors',
    columns: [
      { key: 'direction', head: 'Richtung' },
      { key: 'port', head: 'Port' },
      { key: 'purpose', head: 'Zweck' },
    ],
    rows: [
      { direction: 'Collector → Reticora', port: '443/TCP, HTTPS', purpose: 'Enrollment mit Einmal-Code, Updates [C-02, C-41]' },
      { direction: 'Collector → Reticora', port: '4222/TCP, NATS mit mTLS', purpose: 'Ergebnisse der Discovery, Metriken, Lebenszeichen, Zugangsdaten [C-02, C-77]' },
      { direction: 'Collector → Geräte in Ihrem Netz', port: 'ICMP, ARP, 22, 80, 443, 161/UDP, 623, 5985, 8006', purpose: 'Discovery; verlässt Ihr Netz nicht [C-39, C-77]' },
    ] as Record<string, Rich>[],
    schemaCaption: 'Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung.',
    collectorTitle: 'Collector',
    collector: [
      { term: 'Enrollment-Code', value: 'gilt 24 h, nur einmal [C-41]' },
      { term: 'Zertifikat', value: '90 Tage, erneuert sich selbst; Sperre per Widerruf [C-41]' },
      { term: 'Kanal', value: 'nur der eigene; gesperrte Zertifikate und deaktivierte Collectors werden abgewiesen [C-77]' },
      { term: 'Updates', value: 'nur signiert [C-42]' },
    ] as { term: string; value: Rich }[],
  },
  trennung: {
    id: 'trennung',
    title: 'Trennung der Kunden',
    text: 'Die Trennung zwischen Organisationen, Kunden, Standorten und Teams erzwingt die Datenbank selbst: Row-Level Security auf den Mandantentabellen, Metrik-Zeitreihen über eigene Sichten. [C-06] Die Anwendung greift mit einer Rolle ohne Superuser-Recht und ohne `BYPASSRLS` zu; Lesen und Schreiben prüfen dieselben Bedingungen. [C-78] Ein automatischer Test prüft die Trennung über alle Zugriffswege. [C-93]' as Rich,
  },
  schluessel: {
    id: 'zugangsdaten',
    title: 'Zugangsdaten und Schlüssel',
    text: 'Zugangsdaten für Ihre Geräte speichert Reticora verschlüsselt (AES-256-GCM, mit einem Datenschlüssel je Organisation). An den Collector gehen sie über den mTLS-Kanal und zusätzlich auf seinen Schlüssel verschlüsselt. Im Klartext existieren sie nur im Arbeitsspeicher, nie auf Datenträgern, in API-Antworten oder Logs. [C-13, C-80]' as Rich,
    specs: [
      { term: 'Signaturschlüssel der Sitzungen', value: 'Wechsel alle 90 Tage [C-80]' },
      { term: 'Datenschlüssel je Organisation', value: 'Wechsel jährlich [C-80]' },
      { term: 'Hauptschlüssel', value: 'neu verpackt ohne Ausfallzeit [C-80]' },
      { term: 'API-Schlüssel', value: 'nur als Hash gespeichert, Rotation mit Überlappung [C-75]' },
    ] as { term: string; value: Rich }[],
  },
  anmeldung: {
    id: 'anmeldung',
    title: 'Anmeldung und Rechte',
    text: 'Die Anmeldung läuft über OIDC mit PKCE; ein Sitzungstoken gilt 15 Minuten. Ihren eigenen Identity-Provider binden Sie je Organisation an. Einladungen gelten 7 Tage, eine Deaktivierung wirkt sofort. [C-79] Der zweite Faktor ist für Administratoren Pflicht. [C-34] Rollen gelten für die Organisation, einen Kunden, einen Standort oder ein Team; jeder Endpunkt ist einer Berechtigung zugeordnet, ohne Zuordnung wird verweigert. [C-33, C-84] Feldrechte wirken bis in API, Suche, Export und Webhooks. [C-89] Adressen für Webhooks und Importe dürfen nicht auf private Netze oder Metadaten-Dienste zeigen. [C-81]' as Rich,
    shot: { id: 'S-17', caption: 'Berechtigungen.' } as ShotRef,
  },
  protokoll: {
    id: 'protokoll',
    title: 'Protokoll und Zugriffe des Betriebs',
    text: 'Das Audit-Protokoll ist je Organisation als Hash-Kette aufgebaut; Sie prüfen es in der Anwendung oder mit `audit-verify`. Es wird 10 Jahre aufbewahrt. [C-12, C-69] Das Personal des Plattformbetriebs arbeitet mit persönlichen Identitäten und zweitem Faktor. Jede Nutzung des Notfallzugangs löst einen Alarm aus, und diese Zugriffe stehen in einem eigenen Protokoll mit Hash-Kette. [C-82]' as Rich,
    shot: { id: 'S-14', caption: 'Audit-Protokoll.' } as ShotRef,
  },
  datenschutz: {
    id: 'datenschutz',
    title: 'Datenschutz und Datenstandort',
    text: 'Daten, Backups, Logs und Suchindex liegen in der EU. [C-07] Personenbezogene Daten liegen in einem eigenen Tresor; überall sonst stehen nur Platzhalter-IDs. Gelöscht wird durch Vernichten des Schlüssels, ohne die Audit-Kette zu brechen. [C-14] Sie können Ihre Organisation vollständig exportieren; eine Löschung der Organisation wird nach 30 Tagen Karenz wirksam. [C-83] Das Add-on für den KI-Assistenten verarbeitet in der EU oder selbst betrieben, trainiert nicht mit Ihren Daten und wird je Organisation eingeschaltet. [C-20]' as Rich,
    links: [
      { label: 'Subprozessoren', href: '/subprozessoren/' },
      { label: 'Datenschutzerklärung', href: '/datenschutz/' },
    ] as LinkRef[],
    placeholder: { key: 'sicherheit-auftragsverarbeitung', text: '[Auftragsverarbeitung: Angabe vom Anbieter]' } as PlaceholderRef,
  },
  lieferkette: {
    id: 'lieferkette',
    title: 'Lieferkette und Uploads',
    text: 'Release-Artefakte sind signiert, zu jedem Release gibt es eine SBOM. Der Collector installiert nur signierte Updates. [C-15, C-42] Hochgeladene Dokumente werden vor dem ersten Download auf Schadsoftware geprüft; bis dahin ist der Download gesperrt. [C-60]' as Rich,
  },
  melden: {
    id: 'luecke-melden',
    title: 'Sicherheitslücke melden',
    before: 'Haben Sie eine Schwachstelle gefunden, schreiben Sie uns bitte direkt: „',
    placeholder: { key: 'sicherheit-meldeweg', text: '[Meldeweg für Sicherheitslücken: Adresse vom Anbieter]' } as PlaceholderRef,
    after: '“.',
  },
  closing: {
    id: 'abschluss',
    title: 'Ihre Prüfung braucht mehr?',
    text: 'Schreiben Sie uns, welche Fragen offen sind.' as Rich,
    actions: ['contact', 'demo', 'trial'] as Action[],
    topic: 'security',
  },
};
