# Text of the page “Administration” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/product/administration/` (German: `/produkt/verwaltung/`, text in `docs/copy/produkt-verwaltung-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** Administration – assets, stock, stocktakes, contracts
- **Description:** Assets with assignment and signature, stock down to the bin, stocktakes by
  barcode, contracts and documents – on the same inventory as your CMDB.

## Opening

- **Heading (h1):** Commercial data on the same device as the technical data.
- **Lead:** Discovery knows what runs in the network. Administration knows what it cost,
  who has it and where the spare is. In Reticora that is one inventory, not
  two lists.
- **Buttons:** “Live demo” (primary button), “Try for 30 days”

## 1. Asset and CI: separate and linked

- **Heading:** Asset and CI: separate and linked
- **Text:** The CI describes what a device does in the network. The asset describes the
  physical item: serial number, location, lifecycle, purchase data. The two
  are separate and can be linked. What the asset holds, the CI only displays.
  If discovery reports a different serial number than the asset, you get a
  review instead of a silent change. [C-56, C-35, C-49]
- **Image:** S-09, “Fig. 1 · Asset with assignment.”

## 2. Assignment, reservation, disposal

- **Heading:** Assignment, reservation, disposal
- **Text:** You assign an asset to a person or a team and have the handover signed
  (Standard and above). You reserve devices in advance and, at the end,
  document disposal according to DIN 66399, the German standard for destroying
  data media. [C-61, C-35]

## 3. Stock down to the bin

- **Heading:** Stock down to the bin
- **Text:** Stock is organized into warehouse, zone, shelf and bin. For consumables such
  as patch cables or transceivers, Reticora keeps the stock level per bin and
  warns at the minimum stock level. Every movement – receipt, transfer,
  assignment, return, repair, disposal – is recorded in a history that cannot
  be changed afterwards. [C-57, C-36] Internal purchase orders are approved by
  a second person (Pro and above). [C-58]

## 4. Stocktakes with barcodes

- **Heading:** Stocktakes with barcodes
- **Text:** You print labels with barcodes, start a stocktake and record the stock by
  scanning. Reticora shows the differences from the expected count; once
  completed, the stocktake is locked (Standard and above). [C-59, C-36]
- **Image:** S-10, “Fig. 2 · Stocktake.”

## 5. Contracts and documents

- **Heading:** Contracts and documents
- **Text:** Suppliers and contracts are linked to the inventory; Reticora warns before a
  contract expires. [C-61] Documents – delivery notes, warranties, handover
  records – have versions and can be linked to CIs, assets, assignments,
  tickets, locations, stocktakes and disposals. Every new version is scanned
  for malware before its first download; until then the download is blocked.
  [C-60]
- **Table** “Document storage per plan”:

| Plan | Document storage |
|---|---|
| Essentials | 1,000 MiB [C-60] |
| Standard | 10,000 MiB [C-60] |
| Pro | 50,000 MiB [C-60] |
| Enterprise | unlimited [C-60] |

## 6. Export for accounting

- **Heading:** Export for accounting
- **Text:** For accounting, Reticora exports in DATEV format (Standard and above), the
  format used by German accounting software. The CSV export contains only the
  fields the person exporting is allowed to see. [C-11, C-74]

## Closing

- Closing band as on all pages: “Try Reticora with your own network for 30 days.” with “Try for 30 days” (primary button), “Live demo”, “Contact”; below it “Offer for businesses only.”
