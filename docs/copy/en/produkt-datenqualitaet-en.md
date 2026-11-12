# Text of the page “Data quality” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/product/data-quality/` (German: `/produkt/datenqualitaet/`, text in `docs/copy/produkt-datenqualitaet-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** Data quality – every value with its provenance
- **Description:** How Reticora identifies a device unambiguously, which source wins and why
  manual values stay. With source ranks, provenance per field and the review
  inbox.

## Opening

- **Heading (h1):** One device, one CI. Every value with its source.
- **Lead:** Reticora merges observations from several sources into one CI – one entry in
  the CMDB. Fixed rules apply: which key identifies a device, which source
  wins and when a person decides. In the app this matching is called
  reconciliation.
- **Buttons:** “Try for 30 days” (primary button), “Live demo”

## 1. Five keys in a fixed order

- **Heading:** Five keys in a fixed order
- **Lead:** Before a value reaches a CI, Reticora settles which device it belongs to. It
  checks within one customer, key by key. [C-45]
- **Table** “The five keys for identifying a device”:

| No. | Key | Rule |
|---|---|---|
| 1 | Serial number | Placeholders such as “To be filled by O.E.M.” do not count. [C-45] |
| 2 | Hardware UUID | Known cloned UUIDs do not count; virtual machines also need a MAC address or hostname. [C-45] |
| 3 | MAC addresses | A unique intersection; locally administered addresses and VRRP, HSRP and CARP addresses do not count. [C-45] |
| 4 | Management IP and sysObjectID | only within the same VRF [C-45] |
| 5 | Hostname or FQDN | Never leads to an automatic merge, only to a “Probable duplicate” review. [C-05, C-49] |

- **Text:** This way one device never becomes a second CI, and two devices with the same
  name never silently become one. [C-05]

## 2. Which source wins

- **Heading:** Which source wins
- **Text:** If two sources report different values for the same field, the value from
  the higher-ranked source applies. A value is only applied if its observation
  is newer than that of the stored value. What counts is the time of
  observation, not the time of arrival. [C-46, C-47]
- **Table** “Source ranking”:

| Source | Rank |
|---|---|
| manual, override | 100 |
| import | 95 |
| workflow | 92 |
| Redfish | 90 |
| agent | 85 |
| SNMP | 80 |
| API, integration | 75 |
| WMI | 70 |
| SSH, NAS | 60 |
| sweep | 20 |

- **Below the table:** [C-46]
- **Text:** For every field the CI view shows the source, rank, time of observation and
  the reason why this value applies: manual override, highest-ranked source,
  value from the asset or value of the CI record. [C-03]
- **Image:** S-02, “Fig. 1 · Provenance of a field in the CI view.”

## 3. Manual wins

- **Heading:** Manual wins
- **Text:** Whatever you set by hand is an override. No source overwrites it, not even a
  workflow. [C-04, C-65] If a source later reports a different value, an
  “Override conflict” review is created. You see both values and decide
  whether your value stays. [C-47, C-49] Commercial data such as serial
  number, location and purchase data is held by the asset; the CI only
  displays it. [C-56]

## 4. The review inbox: three typical cases

- **Heading:** The review inbox: three typical cases
- **Lead:** The review inbox collects what automation may not decide on its own. You
  compare observation and CI side by side and decide: merge, create new,
  accept or discard. Nothing is discarded without your decision. [C-30, C-04]
- **Table** “Three typical cases in the review inbox”:

| Case | What Reticora shows | What you do |
|---|---|---|
| Unknown device | No profile matches. Reticora creates a generic device; the MAC address names the vendor. [C-40, C-91] | Set the type, resolve the review. |
| Possible duplicate | A new device has the same hostname as an existing CI, but the other keys do not match. [C-05, C-49] | Merge if it is the same device; otherwise create new. |
| Different serial number | Discovery reports a different serial number than the asset holds – for example after a mainboard swap. [C-49, C-56] | Accept or discard the value. |

- **Text:** **Other kinds of reviews:** ambiguous identity, conflicting values,
  resurrected device, duplicate IP address, unlicensed CI, suggested scope.
  [C-49]
- **Image:** S-03, “Fig. 2 · Review inbox: observation and CI compared.”

## 5. A merge can be undone

- **Heading:** A merge can be undone
- **Text:** When you merge two CIs, Reticora moves all references to the remaining CI;
  the old one redirects. If the merge turns out to be wrong, you undo it
  within 30 days. You can restore a deleted CI for 90 days. [C-48]

## 6. What is no longer seen

- **Heading:** What is no longer seen
- **Text:** A device that stops responding does not disappear. After three times the
  scope interval without being seen, the CI gets the status “unknown”. CIs
  created by hand stay as they are. [C-44] If discovery reports a device whose
  CI was deleted, Reticora does not simply create it again: the review inbox
  shows a “Resurrected device”, and you decide. [C-49]

## Closing

- Closing band as on all pages: “Try Reticora with your own network for 30 days.” with “Try for 30 days” (primary button), “Live demo”, “Contact”; below it “Offer for businesses only.”
