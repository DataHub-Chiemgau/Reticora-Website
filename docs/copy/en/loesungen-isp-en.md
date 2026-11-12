# Text of the page “Solutions for ISPs” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/solutions/isp/` (German: `/loesungen/isp/`) |
| Rules | `content-plan.md` §1, §6 (work situations, no case studies), §6.3 (terms); `brand-strategy.md` §4 |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets. On the page it
becomes an evidence note. The situations are typical tasks in network
operations. They describe what the product does and do not tell a
customer’s story.

## Page head

- **Browser title:** Reticora for network operators (ISP)
- **Description:** A UPS alarm, a planned swap, many PoPs, a device back
  from repair: how network operators handle these tasks with Reticora.

## Intro

- **Heading (h1):** For network operators: inventory, dependencies and
  outage impact in one place.
- **Lead:** Four situations from running a network and how Reticora helps
  with each. They describe product features, not customer projects.
- **Buttons:** “Live demo” (primary), “Contact” (topic “Enterprise”)

Every situation has the same form: heading (the situation), text (how you
proceed), a feature line and claims.

## 1. A UPS in the PoP reports a fault

- **Heading:** A UPS in the PoP reports a fault.
- **Text:** Open the UPS in the topology and simulate its outage. Reticora
  follows the power chain through the PDUs to the devices and shows which
  CIs, customers and sites are affected. Servers with two power supplies on
  separate paths appear under “Protected by redundancy” as long as the
  second path is up. [C-09, C-50, C-51, C-52] From the analysis you create a
  ticket on the CI; the history of the UPS values is in the same CI.
  [C-62, C-63]
- **Features:** Outage simulation, Impact analysis, Power chain, Tickets,
  Monitoring
- **Figure:** S-06, “Fig. 1 · Outage simulation in the topology.”

## 2. An aggregation switch will be replaced next week

- **Heading:** An aggregation switch will be replaced next week.
- **Text:** Let the switch and everything that goes offline with it fail
  together. The impact analysis names the affected customers and services
  and lists separately what is reached only through a network connection
  and is therefore possibly affected. [C-52, C-50, C-66] Then you create a
  maintenance window with these CIs; Reticora derives the affected customers
  from it. [C-66]
- **Features:** Multiple failures, Impact analysis, Maintenance windows

## 3. Many PoPs, several vendors, no current list

- **Heading:** Many PoPs, several vendors, no current list.
- **Text:** Deploy a collector in each PoP. It suggests the networks it sits
  in, and you confirm the scopes, each with its VRF; identical address
  ranges in different VRFs stay separate. [C-29, C-43, C-85] The collector
  ships with profiles for Cisco, Juniper, Arista, MikroTik, FortiGate, UPSs
  and PDUs; anything unknown appears as a generic device in the review
  inbox. [C-08, C-40] The Enterprise plan covers up to 50,000 CIs and any
  number of collectors. [C-21]
- **Features:** Collector, Scopes with VRF, Device profiles, Review inbox
- **Link:** “Supported devices” → `/en/devices/`

## 4. A switch is swapped for a spare from stock

- **Heading:** A switch is swapped for a spare from stock.
- **Text:** You take the spare out of stock and book the faulty one as a
  “Repair” movement. [C-57] When discovery reports the new device, Reticora
  matches it using the keys in a fixed order: serial number, hardware UUID,
  MAC addresses, management IP with sysObjectID. Where observation and asset
  do not match, a “Serial number mismatch” review is created; Reticora does
  not silently create a second CI, and you decide. [C-45, C-49, C-56]
- **Features:** Stock, Identity matching, Review inbox, Asset

## Additional figure

- S-16, “Fig. 2 · Dashboard.” Placed next to situation 3.

## Closing

- **Heading:** Large inventory or your own infrastructure?
- **Text:** Enterprise Shared runs in the cloud on separate infrastructure;
  Enterprise Local is hosted by you, all work included. [C-92] Tell us how
  your network is built.
- **Buttons:** “Contact” (primary, topic “Enterprise”), “Live demo”, “Try for
  30 days”
- **Line below:** Offer for businesses only.
