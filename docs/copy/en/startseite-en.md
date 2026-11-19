# Text of the home page (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/` (German: `/`, text in `docs/copy/startseite-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** Reticora – the CMDB that reads your network itself
- **Description:** CMDB for ISPs and network MSPs: a collector reads your network, and every
  field shows its source and time. With topology, racks and outage simulation.

## 1. Opening

- **Heading (h1):** The CMDB that reads your network itself and backs every value with its
  source.
- **Lead:** A collector in your network records switches, routers, servers, UPSs and
  storage. Reticora reconciles the observations and shows the source and time
  for every field. For ISPs and network MSPs.
- **Buttons:** “Try for 30 days” (primary button), “Live demo”
- **Line below the buttons:** Offer for businesses only.
- **Network schematic:** outage simulation, initial state `pdu-a` failed.
- **Status strip:**

| Label | Value | Claim |
|---|---|---|
| Sweep | every 24 h | C-26 |
| Poll | every 15 min | C-26 |
| Buffer | up to 24 h | C-27 |
| Connection | outbound only · 443, 4222 | C-02 |
| Hosting | EU | C-07 |

## 2. How your inventory comes together

- **Heading:** How your inventory comes together
- **Lead:** It takes five steps from the collector to a reviewed entry. You never type
  in a device by hand.
- **Steps:**

| No. | Title | Text | Claim |
|---|---|---|---|
| 1 | Connect the collector | You install the collector in your network and enter an enrollment code. The collector opens the connection itself. Nobody reaches into your network from outside. | C-02 |
| 2 | Confirm scopes | The collector reports its local networks. You decide which of them it scans. | C-29 |
| 3 | Collect | A sweep finds the reachable devices. The collector then queries them over SNMP, SSH and Redfish. | C-01 |
| 4 | Reconcile | Reticora works out which observation belongs to which device: by serial number, hardware UUID, MAC addresses and management IP. One device never becomes a second CI. | C-05 |
| 5 | Review | Anything ambiguous goes to the review inbox, where you decide. Nothing is discarded without you. | C-04 |

- **Figure:** schematic “Connection direction”. Caption: “Fig. 1 · The collector connects
  outbound: HTTPS 443 and NATS with mTLS 4222. Schematic drawing.”

## 3. Data you can trust

- **Heading:** Data you can trust
- **Lead:** A CMDB is only useful if people believe it. Reticora tells you for every
  field where the value comes from, and never overwrites what you set by hand.

| Title | Text | Image | Claim |
|---|---|---|---|
| Provenance for every field | For every field you see the source, its rank, the time of the observation and the reason why this value applies. | S-02, “Fig. 2 · Provenance of a field in the CI view.” | C-03; evidence with the source ranking |
| Manual wins | An override stays until you remove it. If a source later reports something else, you see both values side by side and decide. | – | C-04 |
| Decide instead of cleaning up | The review inbox collects what automation may not decide on its own: an unknown device, a probable duplicate, conflicting values. You compare observation and CI and decide: merge, create new, accept or discard. | S-03, “Fig. 3 · Review inbox: observation and CI compared.” | C-30 |

- **Evidence “Source ranking”:** manual 100 · import 95 · workflow 92 · Redfish 90 · agent 85 · SNMP 80 · API
  75 · WMI 70 · SSH 60 · sweep 20.

## 4. See how things connect

- **Heading:** See how things connect
- **Lead:** The observations add up to a picture of your network: what is connected to
  what, what sits where in the rack, and what is affected when a device fails.

| Title | Text | Image | Claim |
|---|---|---|---|
| Topology | Neighbors from LLDP and the dependencies between CIs as a graph. | S-04, “Fig. 4 · Topology: relationships between CIs as a graph.” | C-31 |
| Racks | Occupancy per rack unit, front and rear. | S-05, “Fig. 5 · Rack, front.” | C-10 |
| Outage simulation | Let one or more CIs fail and see what is affected. Devices with a second power supply only count once both paths have failed. | S-06, “Fig. 6 · Outage simulation in the topology.” | C-09 |

## 5. Built for many customers

- **Heading:** Built for many customers
- **Lead:** Organization, customer, site: the current workspace is always shown in the app
  header. Someone who looks after a single customer sees only that customer’s
  data.
- **Key figures:**

| Label | Value | Claim |
|---|---|---|
| Levels | Organization → Customer → Site | C-32 |
| Separation | enforced in the database | C-06 |
| Roles | scoped to a customer, site or team | C-33 |
| Second factor | mandatory for administrators | C-34 |

- **Image:** S-18, “Fig. 7 · The workspace: organization, customer, site.”

## 6. More than an inventory

- **Heading:** More than an inventory
- **Lead:** Service desk, warehouse and compliance work on the same inventory. There is
  only one inventory, so there is nothing to reconcile.
- **List** (term and one sentence, no cards):

| Term | Sentence | Claim |
|---|---|---|
| Assets and contracts | Purchase data, signed assignments, contracts and documents on the device. | C-35 |
| Stock and stocktakes | Stock levels, movements and stocktakes with labels and barcodes. | C-36 |
| Tickets | Tickets with SLA and business calendar, right on the affected CI. | C-37 |
| Monitoring | Reachability, interface counters, UPS and PDU values as history on the CI; alert rules trigger tickets and notifications. | C-24 |
| Workflows and forms | Handovers, approvals and recurring processes, without writing code. | C-24 |
| Compliance | Rules, findings and an audit log with a hash chain. | C-12, C-24 |

## 7. For people and for machines

- **Heading:** For people and for machines
- **Lead:** The REST API is fully described in OpenAPI. Changes are additive only.
  Reticora announces any removal at least twelve months in advance.
  [C-11]
- **Code sample**, header `GET /api/v1/cis`:

```
# All CIs whose name contains “core”
curl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50" \
  -H "X-API-Key: rk_live_…"
```

- **Key figures:**

| Label | Value | Claim |
|---|---|---|
| Authentication | API key in the X-API-Key header | C-11 |
| Webhooks | signed with HMAC-SHA256 | C-11 |
| Export | CSV and DATEV | C-11 |
| Rate limit | 600 requests per minute per key | C-38 |

## 8. Security you can verify

- **Heading:** Security you can verify
- **Lead:** The first questions your security team will ask are answered here. The details
  are on the Security page.
- **Key figures**, each with evidence:

| Label | Value | Claim |
|---|---|---|
| Connection | The collector connects outbound. Reticora opens no connection into your network. | C-02 |
| Credentials | stored encrypted (AES-256-GCM); in plain text only in memory, never on disk, in API responses or in logs | C-13 |
| Separation | row-level security on the tenant tables | C-06 |
| Audit log | audit log with a hash chain per organization, verifiable from the command line | C-12 |
| Data location | data, backups, logs and search index in the EU | C-07 |

- **Link:** “Go to the Security page” → `/en/security/`

## 9. Recognizes what is in your racks

- **Heading:** Recognizes what is in your racks
- **Lead:** Reticora ships with profiles for common network, server, storage and power
  devices. Anything it does not know, it creates as a generic device and asks
  you. [C-08]
- **List** (text, no logos):
  - **Network:** Cisco Catalyst, ISR, ASR, ASA and Firepower · Aruba CX and ProCurve · Ubiquiti UniFi · MikroTik · FortiGate · OPNsense and pfSense
  - **Servers and virtualization:** Dell iDRAC · HPE iLO · Lenovo XCC · Supermicro BMC · VMware ESXi · Proxmox VE · Windows Server · Linux
  - **Storage:** Synology · QNAP · TrueNAS
  - **Power:** UPSs from APC and Eaton · PDUs from APC and Raritan
- **Note:** Vendor names are trademarks of their respective owners and appear here only
  to describe compatibility.
- **Link:** “All supported devices” → `/en/devices/`

## 10. Plans and pricing

- **Heading:** Plans and pricing
- **Lead:** Every plan includes CMDB, discovery, topology, racks and API. Prices per
  month, excl. VAT.
- **Table** (values from `src/data/pricing.ts`, formatted with `src/lib/format.ts` for English):

| Plan | Summary | CIs | per month |
|---|---|---|---|
| Essentials | CMDB, discovery, topology, racks, API, assets, tickets | 500 | €49 |
| Standard | plus stock, stocktakes, labels, signatures, SLAs, DATEV export | 2,500 | €119 |
| Pro | plus monitoring, workflows, forms, purchase orders | 10,000 | €299 |
| Enterprise Shared | plus compliance and endpoint agent, in the cloud on separate infrastructure | 50,000 | from €999 |
| Enterprise Local | hosted by you, all work included | 50,000 | from €1,999 |

- **Notice band:** **Beta discount:** 20% for the first six months, 10% for the following six months, then the full price.
- **Line below:** Offer for businesses only.
- **Link:** “All prices and features” → `/en/pricing/`

## 11. Closing

- **Heading:** Try Reticora on your own network for 30 days.
- **Text:** The trial includes the Standard plan for up to 100 CIs. You create an
  account, confirm your email address and set up an authenticator app when you
  first sign in. After the trial your CMDB is kept for 30 days. [C-22]
- **Buttons:** “Try for 30 days” (primary button), “Live demo”, “Contact”
- **Line below:** Offer for businesses only.
