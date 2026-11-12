# Text of the page “Solutions for MSPs” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/solutions/msp/` (German: `/loesungen/msp/`) |
| Rules | `content-plan.md` §1, §6 (work situations, no case studies), §6.3 (terms); `brand-strategy.md` §4 |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets. On the page it
becomes an evidence note. The situations are typical tasks of a managed
service provider. They describe what the product does and do not tell a
customer’s story.

## Page head

- **Browser title:** Reticora for managed service providers (MSP)
- **Description:** Onboard a new customer, grant rights per customer, keep
  identical address ranges apart, track contracts and SLAs: how MSPs work
  with Reticora.

## Intro

- **Heading (h1):** For MSPs: every customer separate, all in one CMDB.
- **Lead:** Organization, Customer, Site: in Reticora you work for all
  customers in one application, and the data stays separated down to the
  database. Four everyday situations show how. [C-32, C-06]
- **Buttons:** “Live demo” (primary), “Try for 30 days”

Every situation has the same form: heading (the situation), text (how you
proceed), a feature line and claims.

## 1. A new customer comes on board

- **Heading:** A new customer comes on board.
- **Text:** You create the customer and its sites. In the customer’s network
  you install a collector and enter the enrollment code, which is valid for
  24 hours. The collector only connects outbound; the customer needs no
  inbound firewall rule. [C-32, C-41, C-02, C-77] It suggests the networks
  it sits in; you confirm the scopes, and the first CIs appear under the
  right customer. [C-29]
- **Features:** Customers and sites, Collector, Scopes
- **Figure:** S-18, “Fig. 1 · The workspace: Organization, Customer, Site.”

## 2. A technician looks after only two customers

- **Heading:** A technician looks after only two customers.
- **Text:** You give them a role scoped to these two customers; roles can
  also be limited to sites or teams. They then see only those customers’
  data – in the interface, in the API, in search and in exports.
  [C-33, C-84, C-93] The database itself enforces the separation, through
  row-level security on the tenant tables. [C-06] Fields they should not
  see, such as purchase prices, you hide with field permissions. [C-89]
- **Features:** Scoped roles, Row-level security, Field permissions
- **Figure:** S-17, “Fig. 2 · Permissions.”

## 3. Two customers use the same private network

- **Heading:** Two customers use the same private network.
- **Text:** Both customers have `192.168.1.0/24`. You assign their scopes to
  different VRFs; subnets are unique per VRF, so the addresses do not get in
  each other’s way. [C-43, C-85] Reticora always identifies devices within
  one customer: a switch at customer A is never merged with a switch at
  customer B, even if name and address are the same. [C-45]
- **Features:** Scopes with VRF, Identity matching per customer

## 4. A customer asks about contracts, warranties and SLAs

- **Heading:** A customer asks about contracts, warranties and SLAs.
- **Text:** Contracts and suppliers are linked to the inventory, and
  Reticora warns before they expire. Invoices and warranty documents are
  attached to the asset as documents. [C-61, C-60] SLAs are calculated with
  this customer’s business calendar, not yours. [C-62] For the customer you
  export a CSV file that contains only fields you are allowed to see. [C-74]
- **Features:** Contracts, Documents, SLAs, Export
- **Additional figure:** S-16, “Fig. 3 · Dashboard.”

## Closing

- **Heading:** Take a look with sample data.
- **Text:** The live demo shows Reticora with sample data, no account
  needed. Or try it for 30 days with your own network.
- **Buttons:** “Live demo” (primary), “Try for 30 days”, “Contact”
- **Line below:** Offer for businesses only.
