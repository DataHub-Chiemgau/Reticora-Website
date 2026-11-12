import type { Action, LinkRef, Rich, ShotRef } from '../types';
import type { PlaceholderRef, sicherheit as De } from '../de/sicherheit';
import type { Translation } from '../types';

/** Text of the page “Security”, verbatim from docs/copy/en/sicherheit-en.md. C-16, C-17 and certifications are not mentioned. */
export const sicherheit: Translation<typeof De> = {
  meta: {
    title: 'Security and privacy – Reticora',
    description:
      'Deployment models, connection direction and ports, tenant separation in the database, encrypted credentials, MFA, audit chain and data residency in the EU.',
  },
  hero: {
    title: 'What your security team wants to know.',
    lead: 'This page answers the questions of an initial assessment: where the data is stored, which connections exist, how customers are separated, who signs in and how, and what is logged. Every statement has evidence.',
    actions: ['contact', 'demo'] as Action[],
    topic: 'security',
  },
  modelle: {
    id: 'betriebsmodelle',
    title: 'Deployment models',
    label: 'Deployment models by plan',
    columns: [
      { key: 'model', head: 'Model' },
      { key: 'plans', head: 'Plans' },
      { key: 'where', head: 'Where Reticora runs' },
    ],
    rows: [
      { model: 'Cloud', plans: 'Essentials, Standard, Pro', where: 'in the EU; the collector runs in your network [C-07, C-02]' },
      { model: 'Enterprise Shared', plans: 'Enterprise Shared', where: 'in the cloud on separate infrastructure [C-92]' },
      { model: 'Enterprise Local', plans: 'Enterprise Local', where: 'hosted by you; the price includes all work for it [C-92]' },
    ] as Record<string, Rich>[],
  },
  ports: {
    id: 'verbindungen',
    title: 'Connections and ports',
    text: 'The collector opens every connection itself, outbound, to fixed hostnames. Reticora never opens a connection into your network; you need no inbound rule, no VPN and no port forwarding. A proxy is possible for HTTPS; port 4222 needs a direct connection because the collector authenticates there with its certificate. [C-02, C-77]' as Rich,
    label: 'Connections and ports of the collector',
    columns: [
      { key: 'direction', head: 'Direction' },
      { key: 'port', head: 'Port' },
      { key: 'purpose', head: 'Purpose' },
    ],
    rows: [
      { direction: 'Collector → Reticora', port: '443/TCP, HTTPS', purpose: 'Enrollment with a one-time code, updates [C-02, C-41]' },
      { direction: 'Collector → Reticora', port: '4222/TCP, NATS with mTLS', purpose: 'Discovery results, metrics, heartbeats, credentials [C-02, C-77]' },
      { direction: 'Collector → devices in your network', port: 'ICMP, ARP, 22, 80, 443, 161/UDP, 623, 5985, 8006', purpose: 'Discovery; does not leave your network [C-39, C-77]' },
    ] as Record<string, Rich>[],
    schemaCaption: 'The collector connects outbound: HTTPS 443 and NATS with mTLS 4222. Schematic.',
    collectorTitle: 'Collector',
    collector: [
      { term: 'Enrollment code', value: 'valid for 24 h, single use [C-41]' },
      { term: 'Certificate', value: '90 days, renews itself; can be revoked [C-41]' },
      { term: 'Channel', value: 'its own only; revoked certificates and deactivated collectors are rejected [C-77]' },
      { term: 'Updates', value: 'signed only [C-42]' },
    ] as { term: string; value: Rich }[],
  },
  trennung: {
    id: 'trennung',
    title: 'Separation of customers',
    text: 'The database itself enforces the separation between organizations, customers, sites and teams: row-level security on the tenant tables, metric time series through dedicated views. [C-06] The application connects with a role that has no superuser rights and no `BYPASSRLS`; reads and writes check the same conditions. [C-78] An automated test checks the separation across all access paths. [C-93]' as Rich,
  },
  schluessel: {
    id: 'zugangsdaten',
    title: 'Credentials and keys',
    text: 'Reticora stores the credentials for your devices encrypted (AES-256-GCM, with one data key per organization). They travel to the collector over the mTLS channel and are additionally encrypted to the collector’s key. In plain text they exist only in memory, never on disk, in API responses or in logs. [C-13, C-80]' as Rich,
    specs: [
      { term: 'Session signing keys', value: 'rotated every 90 days [C-80]' },
      { term: 'Data key per organization', value: 'rotated yearly [C-80]' },
      { term: 'Master key', value: 'rewrapped without downtime [C-80]' },
      { term: 'API keys', value: 'stored only as a hash, rotation with overlap [C-75]' },
    ] as { term: string; value: Rich }[],
  },
  anmeldung: {
    id: 'anmeldung',
    title: 'Sign-in and permissions',
    text: 'Sign-in uses OIDC with PKCE; a session token is valid for 15 minutes. You connect your own identity provider per organization. Invitations are valid for 7 days, and deactivation takes effect immediately. [C-79] A second factor is mandatory for administrators. [C-34] Roles apply to the organization, a customer, a site or a team; every endpoint is mapped to a permission, and without a mapping access is denied. [C-33, C-84] Field permissions extend to the API, search, export and webhooks. [C-89] URLs for webhooks and imports may not point to private networks or metadata services. [C-81]' as Rich,
    shot: { id: 'S-17', caption: 'Permissions.' } as ShotRef,
  },
  protokoll: {
    id: 'protokoll',
    title: 'Audit log and operator access',
    text: 'The audit log is built as a hash chain per organization; you verify it in the application or with `audit-verify`. It is kept for 10 years. [C-12, C-69] Platform operations staff work with personal identities and a second factor. Every use of the break-glass access raises an alarm, and these accesses are recorded in a separate log with a hash chain. [C-82]' as Rich,
    shot: { id: 'S-14', caption: 'Audit log.' } as ShotRef,
  },
  datenschutz: {
    id: 'datenschutz',
    title: 'Privacy and data residency',
    text: 'Data, backups, logs and search index are kept in the EU. [C-07] Personal data is kept in a separate vault; everywhere else only placeholder IDs appear. Deletion works by destroying the key, without breaking the audit chain. [C-14] You can export your organization in full; deleting the organization takes effect after a 30-day grace period. [C-83] The AI assistant add-on processes data in the EU or self-hosted, does not train on your data and is switched on per organization. [C-20]' as Rich,
    links: [
      { label: 'Subprocessors', href: '/subprozessoren/' },
      { label: 'Privacy policy', href: '/datenschutz/' },
    ] as LinkRef[],
    placeholder: { key: 'sicherheit-auftragsverarbeitung', text: '[Data processing agreement: details from the provider]' } as PlaceholderRef,
  },
  lieferkette: {
    id: 'lieferkette',
    title: 'Supply chain and uploads',
    text: 'Release artifacts are signed, and every release comes with an SBOM. The collector installs only signed updates. [C-15, C-42] Uploaded documents are scanned for malware before the first download; until then the download is blocked. [C-60]' as Rich,
  },
  melden: {
    id: 'luecke-melden',
    title: 'Report a vulnerability',
    before: 'If you have found a vulnerability, please write to us directly: “',
    placeholder: { key: 'sicherheit-meldeweg', text: '[Reporting channel for vulnerabilities: address from the provider]' } as PlaceholderRef,
    after: '”.',
  },
  closing: {
    id: 'abschluss',
    title: 'Does your assessment need more?',
    text: 'Tell us which questions are still open.' as Rich,
    actions: ['contact', 'demo', 'trial'] as Action[],
    topic: 'security',
  },
};
