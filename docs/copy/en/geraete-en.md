# Text of the page “Devices” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/devices/` (German: `/geraete/`) |
| Rules | `content-plan.md` §1, §6, §6.3 (terms); `brand-strategy.md` §4–§5 (vendor names as text only) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets. The table comes
from `src/data/devices.ts` (derived from the product’s `collector/profiles`);
vendor and family names stay unchanged.

## Page head

- **Browser title:** Supported devices and protocols – Reticora
- **Description:** Which switches, routers, firewalls, servers, NAS, UPSs
  and PDUs the collector recognizes, over which protocols, and what happens
  to unknown devices.

## Intro

- **Heading (h1):** Is your device recognized?
- **Lead:** The collector ships with profiles for common network, server,
  storage and power devices. The table lists each device family with the
  protocols Reticora uses to recognize and read it. [C-08]
- **Buttons:** “Try for 30 days” (primary), “Live demo”

## 1. Device families

- **Heading:** Device families
- **Filter** (group of toggle buttons, label “Category”): “All”, “Network”,
  “Server and virtualization”, “Storage”, “Power”. Without JavaScript the
  whole table is shown, grouped by category.
- **Jump links without JavaScript** (navigation above the table, label
  “Jump to a category”): one anchor per category, “{Category} ({n})”, to
  the group in the table. With JavaScript the filter replaces them.
- **Table**, columns: “Vendor”, “Family”, “Protocols”. Values from
  `DEVICES`; categories: `network` = Network, `server` = Server and
  virtualization, `storage` = Storage, `power` = Power. [C-08]
- **Hint above the table on narrow screens:** “The table scrolls sideways.”
- **Filter result line** (live region): “{n} device families” or
  “1 device family”.
- **Caption:** Vendor names are trademarks of their owners and appear here
  only to describe compatibility.

## 2. How the collector recognizes a device

- **Heading:** How the collector recognizes a device
- **Text:** For every device it finds, the collector works in a fixed
  order: first the SNMP response (sysObjectID and description), then
  Redfish (vendor and model of the server controller), then the banner of a
  service such as SSH. It also takes the vendor prefix from the MAC address.
  The first matching profile sets type, vendor and model. [C-40]
- **Link:** “Protocols and discovery workflow” → `/en/product/discovery/`

## 3. What happens to unknown devices

- **Heading:** What happens to unknown devices
- **Text:** If no profile matches, Reticora still creates the device, as a
  generic device. The MAC address names the vendor, and an “Unclassified
  device” review waits in the review inbox. You set the type on the CI and
  resolve the review. [C-40, C-49] Discovery later raises a generic device to
  a specific type; it never changes any other type, such as one you set.
  [C-91]

## 4. Adding profiles

- **Heading:** Adding profiles
- **Text:** A profile is a declarative file: how to recognize a device and
  which values the collector queries. The collector loads additional or
  changed profiles from a directory, without you waiting for a new release.
  [C-88] If a family is missing for you, write to us.
- **Link:** “Contact” → `/en/contact/`

## Closing

- Closing band as on all pages: “Try for 30 days” (primary), “Live demo”,
  “Contact”; below it “Offer for businesses only.”
