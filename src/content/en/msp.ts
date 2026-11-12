import type { SolutionContent } from '../solution';

/** Text of the page “Solutions for MSPs”, verbatim from docs/copy/en/loesungen-msp-en.md. */
export const msp: SolutionContent = {
  meta: {
    title: 'Reticora for managed service providers (MSP)',
    description:
      'Onboard a new customer, grant rights per customer, keep identical address ranges apart, track contracts and SLAs: how MSPs work with Reticora.',
  },
  hero: {
    title: 'For MSPs: every customer separate, all in one CMDB.',
    lead: 'Organization, Customer, Site: in Reticora you work for all customers in one application, and the data stays separated down to the database. Four everyday situations show how. [C-32, C-06]',
    actions: ['demo', 'trial'],
  },
  situations: [
    {
      id: 'neuer-kunde',
      title: 'A new customer comes on board.',
      text: [
        'You create the customer and its sites. In the customer’s network you install a collector and enter the enrollment code, which is valid for 24 hours. The collector only connects outbound; the customer needs no inbound firewall rule. [C-32, C-41, C-02, C-77] It suggests the networks it sits in; you confirm the scopes, and the first CIs appear under the right customer. [C-29]',
      ],
      features: ['Customers and sites', 'Collector', 'Scopes'],
      shot: { id: 'S-18', caption: 'The workspace: Organization, Customer, Site.' },
    },
    {
      id: 'zwei-kunden',
      title: 'A technician looks after only two customers.',
      text: [
        'You give them a role scoped to these two customers; roles can also be limited to sites or teams. They then see only those customers’ data – in the interface, in the API, in search and in exports. [C-33, C-84, C-93] The database itself enforces the separation, through row-level security on the tenant tables. [C-06] Fields they should not see, such as purchase prices, you hide with field permissions. [C-89]',
      ],
      features: ['Scoped roles', 'Row-level security', 'Field permissions'],
      shot: { id: 'S-17', caption: 'Permissions.' },
    },
    {
      id: 'gleiches-netz',
      title: 'Two customers use the same private network.',
      text: [
        'Both customers have `192.168.1.0/24`. You assign their scopes to different VRFs; subnets are unique per VRF, so the addresses do not get in each other’s way. [C-43, C-85] Reticora always identifies devices within one customer: a switch at customer A is never merged with a switch at customer B, even if name and address are the same. [C-45]',
      ],
      features: ['Scopes with VRF', 'Identity matching per customer'],
    },
    {
      id: 'vertraege-slas',
      title: 'A customer asks about contracts, warranties and SLAs.',
      text: [
        'Contracts and suppliers are linked to the inventory, and Reticora warns before they expire. Invoices and warranty documents are attached to the asset as documents. [C-61, C-60] SLAs are calculated with this customer’s business calendar, not yours. [C-62] For the customer you export a CSV file that contains only fields you are allowed to see. [C-74]',
      ],
      features: ['Contracts', 'Documents', 'SLAs', 'Export'],
      shot: { id: 'S-16', caption: 'Dashboard.' },
    },
  ],
  closing: {
    id: 'abschluss',
    title: 'Take a look with sample data.',
    text: 'The live demo shows Reticora with sample data, no account needed. Or try it for 30 days with your own network.',
    actions: ['demo', 'trial', 'contact'],
  },
};
