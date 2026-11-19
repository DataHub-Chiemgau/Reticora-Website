# Text of the page “Operations” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/product/operations/` (German: `/produkt/betrieb/`, text in `docs/copy/produkt-betrieb-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** Operations – tickets, SLAs, monitoring, workflows
- **Description:** Tickets with SLA and business calendar on the affected CI, monitoring with
  alert rules, workflows and forms, maintenance windows with the affected
  customers.

## Opening

- **Heading (h1):** Incident, ticket, maintenance: on the CI, not next to it.
- **Lead:** Service desk and network operations work on the same inventory as discovery.
  A ticket knows its CI, an alert its device, a maintenance window its
  customers.
- **Buttons:** “Live demo” (primary button), “Try for 30 days”

## 1. Tickets with SLA

- **Heading:** Tickets with SLA
- **Text:** Every ticket has a number that is unique within your organization, a
  reference to the affected CI or another object, and attachments. You create
  a ticket straight from a review when resolving it needs work on site. [C-62]
  SLAs are calculated with a business calendar that you define for the
  organization or for individual customers (Standard and above). [C-37, C-62]
- **Image:** S-11, “Fig. 1 · Ticket with SLA.”

## 2. Monitoring and alert rules

- **Heading:** Monitoring and alert rules
- **Text:** The collector also reads reachability, interface counters and the values of
  UPSs and PDUs. Reticora shows them as history on the CI and keeps them for
  400 days. [C-63] An alert rule names metric, condition, threshold, duration
  and severity. When it fires, it creates a ticket, a webhook or a
  notification (Pro and above). [C-64] Notifications go out by email, with
  quiet hours, digests and deduplication. [C-90]
- **Image:** S-12, “Fig. 2 · Monitoring: metrics and alert rules.”

## 3. Workflows and forms

- **Heading:** Workflows and forms
- **Text:** You build recurring processes in the click builder, without writing code. A
  workflow starts on an event, manually or on a schedule, and runs actions:
  create a ticket, send a webhook, notify, set a field, request an approval.
  Whatever a workflow writes carries the provenance “workflow” with rank 92
  and leaves your overrides in place. Forms are versioned and show or hide
  fields depending on the answers (Pro and above). [C-65]
- **Above the table:** **Examples** (use cases from the product description, not customer
  projects):
- **Table** “Example workflows”:

| Process | Building blocks |
|---|---|
| Hand over a device | Form, signature, set field [C-65] |
| Approve a purchase order | Form, approval, ticket [C-65] |
| Announce maintenance | Schedule, notification [C-65] |

## 4. Maintenance windows

- **Heading:** Maintenance windows
- **Text:** A maintenance window has a start, an end and the CIs being worked on.
  Reticora derives from them which customers are affected. Beforehand, you let
  these CIs fail together in the outage simulation and see what goes down with
  them and what stays up thanks to redundancy. [C-66, C-09]
- **Link:** “Outage simulation” → `/produkt/topologie-impact/` (English page)

## Closing

- Closing band as on all pages: “Try Reticora on your own network for 30 days.” with “Try for 30 days” (primary button), “Live demo”, “Contact”; below it “Offer for businesses only.”
