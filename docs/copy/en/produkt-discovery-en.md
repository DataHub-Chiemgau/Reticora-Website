# Text of the page “Discovery” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/product/discovery/` (German: `/produkt/discovery/`, text in `docs/copy/produkt-discovery-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** Discovery – how Reticora reads your network
- **Description:** A collector in your network records devices over SNMP, SSH and Redfish and
  connects outbound only. Sweep every 24 h, polling every 15 min.

## Opening

- **Heading (h1):** Your inventory comes from your network, not from a spreadsheet.
- **Lead:** A collector in your network finds the devices, queries them over SNMP, SSH
  and Redfish and delivers the results to Reticora. You decide which networks
  it scans. [C-01]
- **Buttons:** “Try for 30 days” (primary button), “Live demo”
- **Status strip:**

| Label | Value | Claim |
|---|---|---|
| Sweep | every 24 h | C-26 |
| Poll | every 15 min, configurable down to 5 min | C-26 |
| Buffer | up to 24 h | C-27 |
| Connection | outbound only · 443, 4222 | C-02 |

## 1. The collector in your network

- **Heading:** The collector in your network
- **Text:** You install the collector as a Docker image, as a virtual machine (OVA) or
  with the Windows installer. [C-28] On its first connection you enter an
  enrollment code that is valid for 24 hours. With it the collector receives
  its own certificate for 90 days and renews it by itself. [C-41] It opens
  every connection outbound: HTTPS on port 443 and NATS with mTLS on port
  4222. Your network needs no inbound rule, no VPN and no port forwarding.
  [C-02, C-77]
- **Key figures:**

| Label | Value | Claim |
|---|---|---|
| Delivery | Docker image, OVA, Windows installer | C-28 |
| Enrollment code | valid for 24 h, single use | C-41 |
| Certificate | 90 days, renews itself once 60% of its lifetime has passed | C-41 |
| Heartbeat | every 60 s; offline after 5 min without a report | C-42 |
| Updates | signed only, stable and beta channels, with rollback | C-42 |

- **Figure:** schematic “Connection direction”. Caption: “Fig. 1 · The collector connects
  outbound: HTTPS 443 and NATS with mTLS 4222. Schematic drawing.” [C-02]

## 2. Scopes: you decide what gets scanned

- **Heading:** Scopes: you decide what gets scanned
- **Text:** After enrollment the collector reports the networks it sits in and suggests
  them as scopes. Each suggestion appears as a review in the review inbox;
  scanning only starts once you confirm it. [C-29, C-49] A scope defines a
  CIDR, a single host or an address range including its VRF, plus schedule,
  credentials and plugins. [C-43] Because subnets are unique per VRF, address
  ranges in different VRFs may overlap. [C-85]
- **Image:** S-07, “Fig. 2 · Discovery: scopes and collector status.”
- **Image:** S-08, “Fig. 3 · Getting started: sign-up, verification, connect a collector,
  confirm scopes, first CIs.”

## 3. Sweep and polling: which protocol for what

- **Heading:** Sweep and polling: which protocol for what
- **Text:** The sweep finds what is reachable in a scope. The collector then queries
  each device over the protocol that suits it. All of these queries stay
  inside your network; only the result goes out. [C-39, C-01, C-77]
- **Table** “Protocols and what they are used for”:

| Protocol | Used for |
|---|---|
| ICMP, ARP, reverse DNS | Sweep: reachable addresses and their names; ICMP with at most 256 parallel requests [C-39] |
| Ports 22, 80, 443, 623, 5985, 8006 | Sweep, optional: hints at SSH, web interface, BMC, WinRM and Proxmox [C-39] |
| SNMP v2c and v3 | Switches, routers, firewalls, access points, UPSs, PDUs, NAS [C-01, C-08] |
| SSH | Linux, Proxmox VE, TrueNAS and commands on network devices [C-01, C-08] |
| Redfish | Server controllers: Dell iDRAC, HPE iLO, Lenovo XCC, Supermicro [C-01, C-08] |
| WMI, IPMI | supplementary, where the other methods are not enough [C-01] |
| NAS and power plugins | Values from NAS, UPSs and PDUs [C-01] |

## 4. Classification: what kind of device is this?

- **Heading:** Classification: what kind of device is this?
- **Text:** The collector checks every device it finds in a fixed order: first the SNMP
  response, then Redfish, then the service banner. It also uses the vendor
  part of the MAC address. If a profile matches, type, vendor and model are
  settled. If none matches, Reticora creates a generic device and opens a
  review. You set the type, and nothing is lost. [C-40, C-91] Profiles are
  declarative files; the collector loads new or changed profiles without a new
  release. [C-88]
- **Link:** “All supported devices” → `/geraete/` (English page)

## 5. Intervals, buffering and what stops responding

- **Heading:** Intervals, buffering and what stops responding
- **Text:** By default the sweep runs every 24 hours and polling over SNMP and Redfish
  every 15 minutes; you can go down to 5 minutes. [C-26] If the connection
  drops, the collector buffers for up to 24 hours and then delivers in the
  original order. [C-27] Every value carries the time it was observed, not the
  time it arrived. [C-47] A CI that has not been seen for three times the
  scope interval gets the status “unknown”; Reticora does not delete it. CIs
  created by hand are exempt. [C-44]

## 6. Credentials

- **Heading:** Credentials
- **Text:** Reticora stores credentials for SNMP, SSH and Redfish encrypted
  (AES-256-GCM). They travel to the collector over the mTLS channel and are
  additionally encrypted to the collector’s key. In plain text they exist only
  in memory, never on disk, in API responses or in logs. [C-13]
- **Link:** “More on security” → `/sicherheit/` (English page)

## Closing

- Closing band as on all pages: “Try Reticora with your own network for 30 days.” with “Try for 30 days” (primary button), “Live demo”, “Contact”; below it “Offer for businesses only.”
