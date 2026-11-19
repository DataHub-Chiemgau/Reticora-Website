import type { PageContent, Translation } from '../../types';

/** Verbatim from docs/copy/en/produkt-discovery-en.md. */
export const discovery: Translation<PageContent> = {
  meta: {
    title: 'Discovery – how Reticora reads your network',
    description:
      'A collector in your network records devices over SNMP, SSH and Redfish and connects outbound only. Sweep every 24 h, polling every 15 min.',
  },
  hero: {
    title: 'Your inventory comes from your network, not from a spreadsheet.',
    lead:
      'A collector in your network finds the devices, queries them over SNMP, SSH and Redfish and delivers the results to Reticora. You decide which networks it scans. [C-01]',
    actions: ['trial', 'demo'],
    strip: [
      { label: 'Sweep', value: 'every 24 h', claim: 'C-26' },
      { label: 'Poll', value: 'every 15 min, configurable down to 5 min', claim: 'C-26' },
      { label: 'Buffer', value: 'up to 24 h', claim: 'C-27' },
      { label: 'Connection', value: 'outbound only · 443, 4222', claim: 'C-02' },
    ],
  },
  sections: [
    {
      id: 'collector',
      title: 'The collector in your network',
      blocks: [
        {
          kind: 'split',
          paras: [
            'You install the collector as a Docker image, as a virtual machine (OVA) or with the Windows installer. [C-28] On its first connection you enter an enrollment code that is valid for 24 hours. With it the collector receives its own certificate for 90 days and renews it by itself. [C-41] It opens every connection outbound: HTTPS on port 443 and NATS with mTLS on port 4222. Your network needs no inbound rule, no VPN and no port forwarding. [C-02, C-77]',
          ],
          side: {
            kind: 'specs',
            items: [
              { term: 'Delivery', value: 'Docker image, OVA, Windows installer [C-28]' },
              { term: 'Enrollment code', value: 'valid for 24 h, single use [C-41]' },
              { term: 'Certificate', value: '90 days, renews itself once 60% of its lifetime has passed [C-41]' },
              { term: 'Heartbeat', value: 'every 60 s; offline after 5 min without a report [C-42]' },
              { term: 'Updates', value: 'signed only, stable and beta channels, with rollback [C-42]' },
            ],
          },
        },
        {
          kind: 'schema',
          caption: 'The collector connects outbound: HTTPS 443 and NATS with mTLS 4222. Schematic drawing. [C-02]',
        },
      ],
    },
    {
      id: 'scopes',
      title: 'Scopes: you decide what gets scanned',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'After enrollment the collector reports the networks it sits in and suggests them as scopes. Each suggestion appears as a review in the review inbox; scanning only starts once you confirm it. [C-29, C-49] A scope defines a CIDR, a single host or an address range including its VRF, plus schedule, credentials and plugins. [C-43] Because subnets are unique per VRF, address ranges in different VRFs may overlap. [C-85]',
          ],
        },
        {
          kind: 'shots',
          shots: [
            { id: 'S-07', caption: 'Discovery: scopes and collector status.' },
            { id: 'S-08', caption: 'Getting started: sign-up, verification, connect a collector, confirm scopes, first CIs.' },
          ],
        },
      ],
    },
    {
      id: 'protokolle',
      title: 'Sweep and polling: which protocol for what',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'The sweep finds what is reachable in a scope. The collector then queries each device over the protocol that suits it. All of these queries stay inside your network; only the result goes out. [C-39, C-01, C-77]',
          ],
        },
        {
          kind: 'table',
          label: 'Protocols and what they are used for',
          rowHeader: 'protocol',
          columns: [
            { key: 'protocol', head: 'Protocol' },
            { key: 'use', head: 'Used for' },
          ],
          rows: [
            { protocol: 'ICMP, ARP, reverse DNS', use: 'Sweep: reachable addresses and their names; ICMP with at most 256 parallel requests [C-39]' },
            { protocol: 'Ports 22, 80, 443, 623, 5985, 8006', use: 'Sweep, optional: hints at SSH, web interface, BMC, WinRM and Proxmox [C-39]' },
            { protocol: 'SNMP v2c and v3', use: 'Switches, routers, firewalls, access points, UPSs, PDUs, NAS [C-01, C-08]' },
            { protocol: 'SSH', use: 'Linux, Proxmox VE, TrueNAS and commands on network devices [C-01, C-08]' },
            { protocol: 'Redfish', use: 'Server controllers: Dell iDRAC, HPE iLO, Lenovo XCC, Supermicro [C-01, C-08]' },
            { protocol: 'WMI, IPMI', use: 'supplementary, where the other methods are not enough [C-01]' },
            { protocol: 'NAS and power plugins', use: 'Values from NAS, UPSs and PDUs [C-01]' },
          ],
        },
      ],
    },
    {
      id: 'klassifikation',
      title: 'Classification: what kind of device is this?',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'The collector checks every device it finds in a fixed order: first the SNMP response, then Redfish, then the service banner. It also uses the vendor part of the MAC address. If a profile matches, type, vendor and model are settled. If none matches, Reticora creates a generic device and opens a review. You set the type, and nothing is lost. [C-40, C-91] Profiles are declarative files; the collector loads new or changed profiles without a new release. [C-88]',
          ],
        },
        { kind: 'link', link: { label: 'All supported devices', href: '/geraete/' } },
      ],
    },
    {
      id: 'takt',
      title: 'Intervals, buffering and what stops responding',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'By default the sweep runs every 24 hours and polling over SNMP and Redfish every 15 minutes; you can go down to 5 minutes. [C-26] If the connection drops, the collector buffers for up to 24 hours and then delivers in the original order. [C-27] Every value carries the time it was observed, not the time it arrived. [C-47] A CI that has not been seen for three times the scope interval gets the status “unknown”; Reticora does not delete it. CIs created by hand are exempt. [C-44]',
          ],
        },
      ],
    },
    {
      id: 'zugangsdaten',
      title: 'Credentials',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Reticora stores credentials for SNMP, SSH and Redfish encrypted (AES-256-GCM). They travel to the collector over the mTLS channel and are additionally encrypted to the collector’s key. In plain text they exist only in memory, never on disk, in API responses or in logs. [C-13]',
          ],
        },
        { kind: 'link', link: { label: 'More on security', href: '/sicherheit/' } },
      ],
    },
  ],
};
