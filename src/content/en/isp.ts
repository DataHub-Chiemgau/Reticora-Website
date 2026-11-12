import type { SolutionContent } from '../solution';
import { PLANS } from '../../data/pricing';
import { grouped } from '../../lib/format';

const ent = PLANS.find((p) => p.id === 'enterprise-shared')!;

/** Text of the page “Solutions for ISPs”, verbatim from docs/copy/en/loesungen-isp-en.md. Numbers from src/data/pricing.ts. */
export const isp: SolutionContent = {
  meta: {
    title: 'Reticora for network operators (ISP)',
    description:
      'A UPS alarm, a planned swap, many PoPs, a device back from repair: how network operators handle these tasks with Reticora.',
  },
  hero: {
    title: 'For network operators: inventory, dependencies and outage impact in one place.',
    lead: 'Four situations from running a network and how Reticora helps with each. They describe product features, not customer projects.',
    actions: ['demo', 'contact'],
    topic: 'enterprise',
  },
  situations: [
    {
      id: 'usv-stoerung',
      title: 'A UPS in the PoP reports a fault.',
      text: [
        'Open the UPS in the topology and simulate its outage. Reticora follows the power chain through the PDUs to the devices and shows which CIs, customers and sites are affected. Servers with two power supplies on separate paths appear under “Protected by redundancy” as long as the second path is up. [C-09, C-50, C-51, C-52] From the analysis you create a ticket on the CI; the history of the UPS values is in the same CI. [C-62, C-63]',
      ],
      features: ['Outage simulation', 'Impact analysis', 'Power chain', 'Tickets', 'Monitoring'],
      shot: { id: 'S-06', caption: 'Outage simulation in the topology.' },
    },
    {
      id: 'switch-tausch',
      title: 'An aggregation switch will be replaced next week.',
      text: [
        'Let the switch and everything that goes offline with it fail together. The impact analysis names the affected customers and services and lists separately what is reached only through a network connection and is therefore possibly affected. [C-52, C-50, C-66] Then you create a maintenance window with these CIs; Reticora derives the affected customers from it. [C-66]',
      ],
      features: ['Multiple failures', 'Impact analysis', 'Maintenance windows'],
    },
    {
      id: 'viele-pops',
      title: 'Many PoPs, several vendors, no current list.',
      text: [
        `Deploy a collector in each PoP. It suggests the networks it sits in, and you confirm the scopes, each with its VRF; identical address ranges in different VRFs stay separate. [C-29, C-43, C-85] The collector ships with profiles for Cisco, Juniper, Arista, MikroTik, FortiGate, UPSs and PDUs; anything unknown appears as a generic device in the review inbox. [C-08, C-40] The Enterprise plan covers up to ${grouped(ent.limits.cis, 'en')} CIs and any number of collectors. [C-21]`,
      ],
      features: ['Collector', 'Scopes with VRF', 'Device profiles', 'Review inbox'],
      shot: { id: 'S-16', caption: 'Dashboard.' },
      link: { label: 'Supported devices', href: '/geraete/' },
    },
    {
      id: 'ersatzgeraet',
      title: 'A switch is swapped for a spare from stock.',
      text: [
        'You take the spare out of stock and record the faulty one as a “Repair” movement. [C-57] When discovery reports the new device, Reticora matches it using the keys in a fixed order: serial number, hardware UUID, MAC addresses, management IP with sysObjectID. Where observation and asset do not match, a “Serial number mismatch” review is created; Reticora does not silently create a second CI, and you decide. [C-45, C-49, C-56]',
      ],
      features: ['Stock', 'Identity matching', 'Review inbox', 'Asset'],
    },
  ],
  closing: {
    id: 'abschluss',
    title: 'Large inventory or your own infrastructure?',
    text: 'Enterprise Shared runs in the cloud on separate infrastructure; Enterprise Local is hosted by you, all work included. [C-92] Tell us how your network is built.',
    actions: ['contact', 'demo', 'trial'],
    topic: 'enterprise',
  },
};
