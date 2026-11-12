# Text of the page “Topology and impact” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/product/topology-impact/` (German: `/produkt/topologie-impact/`, text in `docs/copy/produkt-topologie-impact-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** Topology and outage simulation – Reticora
- **Description:** Topology from LLDP, racks with front and rear, the power chain up to the UPS
  and an outage simulation that understands power and cluster redundancy.

## Opening

- **Heading (h1):** What depends on what, and what goes down with it?
- **Lead:** From the observations Reticora derives how your devices are connected and
  powered. From that, the outage simulation calculates which CIs, customers
  and sites an outage hits. [C-31, C-52]
- **Buttons:** “Live demo” (primary button), “Try for 30 days”
- **Network schematic:** outage simulation (`TopologyStage`, `lang="en"`), as on the home page.

## 1. Topology as a graph

- **Heading:** Topology as a graph
- **Text:** When a device reports a neighbor over LLDP, a `connected_to` relationship is
  created. [C-31] Added to that are the dependencies between CIs: what runs on
  what, what draws power from what, what belongs to a cluster. The topology
  shows all of it as a graph; the color of a dot stands for the status of the
  CI. Up to 2,000 nodes you see the whole network; above that you first choose
  a site or type. [C-55]
- **Image:** S-04, “Fig. 1 · Topology: CIs as a graph, the color shows the status.”

## 2. Outage simulation with redundancy

- **Heading:** Outage simulation with redundancy
- **Text:** Select one or more CIs and let them fail. Reticora follows the relationships
  and shows what is affected. Power (`powered_by`) and clusters
  (`member_of_cluster`) count as redundant: a server with two power supplies
  on two PDUs only fails once both PDUs have failed. With `hosted_on`,
  `runs_on` and `depends_on` a single failed provider is enough. [C-09, C-50]
- **Image:** S-06, “Fig. 2 · Outage simulation in the topology.”
- **Above the table:** **Example** (the same nine CIs as in the network schematic):
- **Table** “Example outages in the network schematic”:

| Outage | affected | protected by redundancy |
|---|---|---|
| `pdu-a` | `sw-access-01` | `srv-01`, `srv-02` |
| `pdu-a` and `pdu-b` | both servers, switch, NAS, both VMs (6) | – |
| `usv-01` | both PDUs and everything behind them (8) | – |
| `srv-01` | `vm-app-01` | – |

## 3. Who is affected

- **Heading:** Who is affected
- **Text:** The impact analysis does not stop at devices. It lists the affected CIs,
  customers, sites and services and shows which CI is a single point of
  failure for a service. [C-52] Anything reached only through a network
  connection (`connected_to`) is listed separately as “possibly affected”: it
  is not certain that the outage hits these CIs, and they are not counted.
  [C-50] For a maintenance window you calculate several CIs at once. [C-66]
- **Link:** “Maintenance windows in operations” → `/produkt/betrieb/` (English page)

## 4. The power chain back to the source

- **Heading:** The power chain back to the source
- **Text:** Reticora models power supply as a chain: device, PDU, UPS, source. [C-51]
  This lets the outage simulation answer questions such as “What stays on
  while UPS B is being serviced?”. The collector reads the values of UPSs and
  PDUs itself and shows them as history on the CI. [C-01, C-63]

## 5. Provenance and verification state of every relationship

- **Heading:** Provenance and verification state of every relationship
- **Text:** Relationships have provenance too. Each one carries its source, a confidence
  and a verification state: unverified or confirmed. A neighbor from LLDP has
  a confidence of 1.0. Without LLDP, Reticora uses the switch’s forwarding
  table at 0.6. Unconfirmed edges from discovery disappear after 7 days or
  five times the scope interval, whichever is longer. Discovery never deletes
  edges you create by hand, and it does not recreate edges you remove. [C-53]

## 6. Racks with front and rear

- **Heading:** Racks with front and rear
- **Text:** The rack view shows the occupancy per rack unit, on the front and on the
  rear. When you mount a device, Reticora checks whether it fits the height
  and whether the space on that side is free. [C-10, C-54]
- **Image:** S-05, “Fig. 3 · Rack, front.”

## Closing

- Closing band as on all pages: “Try Reticora with your own network for 30 days.” with “Try for 30 days” (primary button), “Live demo”, “Contact”; below it “Offer for businesses only.”
