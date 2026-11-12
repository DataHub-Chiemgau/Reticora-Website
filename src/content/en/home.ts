import type { ClaimId } from '../../data/types';
import type { Translation } from '../types';
import type { home as HomeDe } from '../de/home';

/** Home page text, verbatim from docs/copy/en/startseite-en.md. Prices and limits come from src/data/pricing.ts. */
export const home: Translation<typeof HomeDe> = {
  meta: {
    title: 'Reticora – the CMDB that reads your network itself',
    description:
      'CMDB for ISPs and network MSPs: a collector reads your network, and every field shows its source and time. With topology, racks and outage simulation.',
  },
  hero: {
    h1: 'The CMDB that reads your network itself and backs every value with its source.',
    lead: 'A collector in your network records switches, routers, servers, UPSs and storage. Reticora reconciles the observations and shows the source and time for every field. For ISPs and network MSPs.',
    strip: [
      { label: 'Sweep', value: 'every 24 h', claim: 'C-26' },
      { label: 'Poll', value: 'every 15 min', claim: 'C-26' },
      { label: 'Buffer', value: 'up to 24 h', claim: 'C-27' },
      { label: 'Connection', value: 'outbound only · 443, 4222', claim: 'C-02' },
      { label: 'Hosting', value: 'EU', claim: 'C-07' },
    ] as { label: string; value: string; claim: ClaimId }[],
  },
  ablauf: {
    title: 'How your inventory comes together',
    lead: 'It takes five steps from the collector to a reviewed entry. You never type in a device by hand.',
    steps: [
      { title: 'Connect the collector', text: 'You install the collector in your network and enter an enrollment code. The collector opens the connection itself. Nobody reaches into your network from outside.', claim: 'C-02' },
      { title: 'Confirm scopes', text: 'The collector reports its local networks. You decide which of them it scans.', claim: 'C-29' },
      { title: 'Collect', text: 'A sweep finds the reachable devices. The collector then queries them over SNMP, SSH and Redfish.', claim: 'C-01' },
      { title: 'Reconcile', text: 'Reticora works out which observation belongs to which device: by serial number, hardware UUID, MAC addresses and management IP. One device never becomes a second CI.', claim: 'C-05' },
      { title: 'Review', text: 'Anything ambiguous goes to the review inbox, where you decide. Nothing is discarded without you.', claim: 'C-04' },
    ],
    schemaCaption: 'The collector connects outbound: HTTPS 443 and NATS with mTLS 4222. Schematic drawing.',
  },
  vertrauen: {
    title: 'Data you can trust',
    lead: 'A CMDB is only useful if people believe it. Reticora tells you for every field where the value comes from, and never overwrites what you set by hand.',
    herkunft: {
      title: 'Provenance for every field',
      text: 'For every field you see the source, its rank, the time of the observation and the reason why this value applies.',
      claim: 'C-03',
      caption: 'Provenance of a field in the CI view.',
    },
    rang: {
      title: 'Source ranking',
      text: 'manual 100 · import 95 · workflow 92 · Redfish 90 · agent 85 · SNMP 80 · API 75 · WMI 70 · SSH 60 · sweep 20.',
    },
    manuell: {
      title: 'Manual wins',
      text: 'An override stays until you remove it. If a source later reports something else, you see both values side by side and decide.',
      claim: 'C-04',
    },
    review: {
      title: 'Decide instead of cleaning up',
      text: 'The review inbox collects what automation may not decide on its own: an unknown device, a probable duplicate, conflicting values. You compare observation and CI and decide: merge, create new, accept or discard.',
      claim: 'C-30',
      caption: 'Review inbox: observation and CI compared.',
    },
  },
  zusammenhang: {
    title: 'See how things connect',
    lead: 'The observations add up to a picture of your network: what is connected to what, what sits where in the rack, and what is affected when a device fails.',
    topologie: { title: 'Topology', text: 'Neighbors from LLDP and the dependencies between CIs as a graph.', claim: 'C-31', caption: 'Topology: relationships between CIs as a graph.' },
    racks: { title: 'Racks', text: 'Occupancy per rack unit, front and rear.', claim: 'C-10', caption: 'Rack, front.' },
    ausfall: {
      title: 'Outage simulation',
      text: 'Let one or more CIs fail and see what is affected. Devices with a second power supply only count once both paths have failed.',
      claim: 'C-09',
      caption: 'Outage simulation in the topology.',
    },
  },
  kunden: {
    title: 'Built for many customers',
    lead: 'Organization, customer, site: the current workspace is always shown in the app header. Someone who looks after a single customer sees only that customer’s data.',
    specs: [
      { term: 'Levels', value: 'Organization → Customer → Site', claim: 'C-32' },
      { term: 'Separation', value: 'enforced in the database', claim: 'C-06' },
      { term: 'Roles', value: 'scoped to a customer, site or team', claim: 'C-33' },
      { term: 'Second factor', value: 'mandatory for administrators', claim: 'C-34' },
    ],
    caption: 'The workspace: organization, customer, site.',
  },
  mehr: {
    title: 'More than an inventory',
    lead: 'Service desk, warehouse and compliance work on the same inventory. There is only one inventory, so there is nothing to reconcile.',
    items: [
      { term: 'Assets and contracts', value: 'Purchase data, signed assignments, contracts and documents on the device.', claims: ['C-35'] },
      { term: 'Stock and stocktakes', value: 'Stock levels, movements and stocktakes with labels and barcodes.', claims: ['C-36'] },
      { term: 'Tickets', value: 'Tickets with SLA and business calendar, right on the affected CI.', claims: ['C-37'] },
      { term: 'Monitoring', value: 'Reachability, interface counters, UPS and PDU values as history on the CI; alert rules trigger tickets and notifications.', claims: ['C-24'] },
      { term: 'Workflows and forms', value: 'Handovers, approvals and recurring processes, without writing code.', claims: ['C-24'] },
      { term: 'Compliance', value: 'Rules, findings and an audit log with a hash chain.', claims: ['C-12', 'C-24'] },
    ],
  },
  api: {
    title: 'For people and for machines',
    lead: 'The REST API is fully described in OpenAPI. Changes are additive only. Reticora announces any removal at least twelve months in advance.',
    leadClaim: 'C-11',
    codeTitle: 'GET /api/v1/cis',
    codeComment: '# All CIs whose name contains “core”',
    specs: [
      { term: 'Authentication', value: 'API key in the X-API-Key header', claim: 'C-11' },
      { term: 'Webhooks', value: 'signed with HMAC-SHA256', claim: 'C-11' },
      { term: 'Export', value: 'CSV and DATEV', claim: 'C-11' },
      { term: 'Rate limit', value: '600 requests per minute per key', claim: 'C-38' },
    ],
  },
  sicherheit: {
    title: 'Security you can verify',
    lead: 'The first questions your security team will ask are answered here. The details are on the Security page.',
    items: [
      { term: 'Connection', value: 'The collector connects outbound. Reticora opens no connection into your network.', claim: 'C-02' },
      { term: 'Credentials', value: 'stored encrypted (AES-256-GCM); in plain text only in memory, never on disk, in API responses or in logs', claim: 'C-13' },
      { term: 'Separation', value: 'row-level security on the tenant tables', claim: 'C-06' },
      { term: 'Audit log', value: 'audit log with a hash chain per organization, verifiable from the command line', claim: 'C-12' },
      { term: 'Data location', value: 'data, backups, logs and search index in the EU', claim: 'C-07' },
    ],
    link: 'Go to the Security page',
  },
  geraete: {
    title: 'Recognizes what is in your racks',
    lead: 'Reticora ships with profiles for common network, server, storage and power devices. Anything it does not know, it creates as a generic device and asks you.',
    leadClaim: 'C-08',
    list: [
      { term: 'Network', value: 'Cisco Catalyst, ISR, ASR, ASA and Firepower · Aruba CX and ProCurve · Ubiquiti UniFi · MikroTik · FortiGate · OPNsense and pfSense' },
      { term: 'Servers and virtualization', value: 'Dell iDRAC · HPE iLO · Lenovo XCC · Supermicro BMC · VMware ESXi · Proxmox VE · Windows Server · Linux' },
      { term: 'Storage', value: 'Synology · QNAP · TrueNAS' },
      { term: 'Power', value: 'UPSs from APC and Eaton · PDUs from APC and Raritan' },
    ],
    note: 'Vendor names are trademarks of their respective owners and appear here only to describe compatibility.',
    link: 'All supported devices',
  },
  pakete: {
    title: 'Plans and pricing',
    lead: 'Every plan includes CMDB, discovery, topology, racks and API. Prices per month, excl. VAT.',
    label: 'Prices and CI limits per plan',
    heads: { plan: 'Plan', cis: 'CIs', price: 'per month' },
    priceFrom: (price: string) => `from ${price}`,
    betaLead: 'Beta discount:',
    beta: (first: number, next: number) => `${first}% for the first six months, ${next}% for the following six months, then the full price.`,
    link: 'All prices and features',
  },
  abschluss: {
    title: 'Try Reticora on your own network for 30 days.',
    text: 'The trial includes the Standard plan for up to 100 CIs. You create an account, confirm your email address and set up an authenticator app when you first sign in. After the trial your CMDB is kept for 30 days.',
    claim: 'C-22',
  },
};
