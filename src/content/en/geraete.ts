import type { Action, LinkRef, Rich } from '../types';
import type { geraete as De } from '../de/geraete';
import type { Translation } from '../types';

/** Text of the page “Devices”, verbatim from docs/copy/en/geraete-en.md. The table comes from src/data/devices.ts. */
export const geraete: Translation<typeof De> = {
  meta: {
    title: 'Supported devices and protocols – Reticora',
    description:
      'Which switches, routers, firewalls, servers, NAS, UPSs and PDUs the collector recognizes, over which protocols, and what happens to unknown devices.',
  },
  hero: {
    title: 'Is your device recognized?',
    lead: 'The collector ships with profiles for common network, server, storage and power devices. The table lists each device family with the protocols Reticora uses to recognize and read it. [C-08]' as Rich,
    actions: ['trial', 'demo'] as Action[],
  },
  familien: {
    id: 'familien',
    title: 'Device families',
    tableLabel: 'Device families with vendor and protocols',
    categories: { network: 'Network', server: 'Server and virtualization', storage: 'Storage', power: 'Power' },
    jump: 'Jump to a category',
    groupId: 'kategorie',
    heads: { vendor: 'Vendor', family: 'Family', protocols: 'Protocols' },
    note: 'Vendor names are trademarks of their owners and appear here only to describe compatibility.',
    claim: 'C-08' as `C-${string}`,
  },
  erkennung: {
    id: 'erkennung',
    title: 'How the collector recognizes a device',
    text: 'For every device it finds, the collector works in a fixed order: first the SNMP response (sysObjectID and description), then Redfish (vendor and model of the server controller), then the banner of a service such as SSH. It also takes the vendor prefix from the MAC address. The first matching profile sets type, vendor and model. [C-40]' as Rich,
    link: { label: 'Protocols and discovery workflow', href: '/produkt/discovery/' } as LinkRef,
  },
  unbekannt: {
    id: 'unbekannt',
    title: 'What happens to unknown devices',
    text: 'If no profile matches, Reticora still creates the device, as a generic device. The MAC address names the vendor, and an “Unclassified device” review waits in the review inbox. You set the type on the CI and resolve the review. [C-40, C-49] Discovery later raises a generic device to a specific type; it never changes any other type, such as one you set. [C-91]' as Rich,
  },
  profile: {
    id: 'profile',
    title: 'Adding profiles',
    text: 'A profile is a declarative file: how to recognize a device and which values the collector queries. The collector loads additional or changed profiles from a directory, without you waiting for a new release. [C-88] If a family is missing for you, write to us.' as Rich,
    link: { label: 'Contact', href: '/kontakt/' } as LinkRef,
  },
};
