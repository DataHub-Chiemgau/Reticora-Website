import type { PageContent, Translation } from '../../types';

/** Verbatim from docs/copy/en/produkt-topologie-impact-en.md. */
export const topologieImpact: Translation<PageContent> = {
  meta: {
    title: 'Topology and outage simulation – Reticora',
    description:
      'Topology from LLDP, racks with front and rear, the power chain up to the UPS and an outage simulation that understands power and cluster redundancy.',
  },
  hero: {
    title: 'What depends on what, and what goes down with it?',
    lead:
      'From the observations Reticora derives how your devices are connected and powered. From that, the outage simulation calculates which CIs, customers and sites an outage hits. [C-31, C-52]',
    actions: ['demo', 'trial'],
    topology: true,
  },
  sections: [
    {
      id: 'topologie',
      title: 'Topology as a graph',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'When a device reports a neighbor over LLDP, a `connected_to` relationship is created. [C-31] Added to that are the dependencies between CIs: what runs on what, what draws power from what, what belongs to a cluster. The topology shows all of it as a graph; the color of a dot stands for the status of the CI. Up to 2,000 nodes you see the whole network; above that you first choose a site or type. [C-55]',
          ],
          shot: { id: 'S-04', caption: 'Topology: CIs as a graph, the color shows the status.' },
        },
      ],
    },
    {
      id: 'ausfallsimulation',
      title: 'Outage simulation with redundancy',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Select one or more CIs and let them fail. Reticora follows the relationships and shows what is affected. Power (`powered_by`) and clusters (`member_of_cluster`) count as redundant: a server with two power supplies on two PDUs only fails once both PDUs have failed. With `hosted_on`, `runs_on` and `depends_on` a single failed provider is enough. [C-09, C-50]',
          ],
          shot: { id: 'S-06', caption: 'Outage simulation in the topology.' },
        },
        {
          kind: 'table',
          label: 'Example outages in the network schematic',
          caption: '**Example** (the same nine CIs as in the network schematic):',
          rowHeader: 'fail',
          columns: [
            { key: 'fail', head: 'Outage' },
            { key: 'hit', head: 'affected' },
            { key: 'safe', head: 'protected by redundancy' },
          ],
          rows: [
            { fail: '`pdu-a`', hit: '`sw-access-01`', safe: '`srv-01`, `srv-02`' },
            { fail: '`pdu-a` and `pdu-b`', hit: 'both servers, switch, NAS, both VMs (6)', safe: '–' },
            { fail: '`usv-01`', hit: 'both PDUs and everything behind them (8)', safe: '–' },
            { fail: '`srv-01`', hit: '`vm-app-01`', safe: '–' },
          ],
        },
      ],
    },
    {
      id: 'betroffen',
      title: 'Who is affected',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'The impact analysis does not stop at devices. It lists the affected CIs, customers, sites and services and shows which CI is a single point of failure for a service. [C-52] Anything reached only through a network connection (`connected_to`) is listed separately as “possibly affected”: it is not certain that the outage hits these CIs, and they are not counted. [C-50] For a maintenance window you calculate several CIs at once. [C-66]',
          ],
        },
        { kind: 'link', link: { label: 'Maintenance windows', href: '/produkt/betrieb/' } },
      ],
    },
    {
      id: 'stromkette',
      title: 'The power chain back to the source',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Reticora models power supply as a chain: device, PDU, UPS, source. [C-51] This lets the outage simulation answer questions such as “What stays on while UPS B is being serviced?”. The collector reads the values of UPSs and PDUs itself and shows them as history on the CI. [C-01, C-63]',
          ],
        },
      ],
    },
    {
      id: 'herkunft-beziehung',
      title: 'Provenance and verification state of every relationship',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Relationships have provenance too. Each one carries its source, a confidence and a verification state: unverified or confirmed. A neighbor from LLDP has a confidence of 1.0. Without LLDP, Reticora uses the switch’s forwarding table at 0.6. Unconfirmed edges from discovery disappear after 7 days or five times the scope interval, whichever is longer. Discovery never deletes edges you create by hand, and it does not recreate edges you remove. [C-53]',
          ],
        },
      ],
    },
    {
      id: 'racks',
      title: 'Racks with front and rear',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'The rack view shows the occupancy per rack unit, on the front and on the rear. When you mount a device, Reticora checks whether it fits the height and whether the space on that side is free. [C-10, C-54]',
          ],
          shot: { id: 'S-05', caption: 'Rack, front.', ratio: '4x5' },
        },
      ],
    },
  ],
};
