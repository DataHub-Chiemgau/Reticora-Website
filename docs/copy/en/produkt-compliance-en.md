# Text of the page “Compliance” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/product/compliance/` (German: `/produkt/compliance/`, text in `docs/copy/produkt-compliance-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** Compliance and audit – Reticora
- **Description:** Audit log with a hash chain, compliance rules per CI type with score and
  findings, reports for ISO 27001, NIS2 and KRITIS, IGA as an add-on.

## Opening

- **Heading (h1):** Evidence from the inventory, not from memory.
- **Lead:** An auditor needs two things: a log in which nothing can change unnoticed,
  and rules that show where the inventory deviates. In Reticora both work on
  the same CIs.
- **Buttons:** “Contact” (primary button), “Live demo”

## 1. Audit log with a hash chain

- **Heading:** Audit log with a hash chain
- **Text:** Every change goes into your organization’s audit log. The entries are linked
  into a hash chain: if an entry is changed or removed afterwards, the chain
  breaks at that point. You verify the chain in the application or with the
  command-line tool `audit-verify`. [C-12, C-69] In addition, Reticora keeps a
  field history for every CI: who or which source set which value and when.
  [C-69, C-03]
- **Image:** S-14, “Fig. 1 · Audit log.”
- **Key figures:**

| Label | Value | Claim |
|---|---|---|
| Chain | per organization | C-12 |
| Verification | in the application and with `audit-verify` | C-69 |
| Audit log retention | 10 years | C-69 |
| Field history retention | 3 years | C-69 |
| Access by platform operations | separate log with a hash chain | C-82 |

## 2. Compliance rules and score

- **Heading:** Compliance rules and score
- **Text:** A compliance rule applies to a CI type and checks its fields, for example
  whether all firewalls run a supported firmware version. You build the rule
  in the click builder and give it a severity, a category and a remediation
  hint. Reticora evaluates every CI: passed, failed or not applicable. This
  yields a score, overall and per CI type (Enterprise). [C-67]
- **Image:** S-13, “Fig. 2 · Compliance: rules, score and deviations.”

## 3. Findings with the affected CIs

- **Heading:** Findings with the affected CIs
- **Text:** Every failed rule becomes a finding. It names the rule, severity and
  category, the remediation hint and the affected CIs. Findings are sorted by
  severity so that the most important ones are at the top. [C-68]

## 4. Reports for ISO 27001, NIS2 and KRITIS

- **Heading:** Reports for ISO 27001, NIS2 and KRITIS
- **Text:** Reticora produces a report for your audit. It contains: the verification
  result of the audit chain, the score, findings by severity with the affected
  CIs, and the security features enabled in your organization. [C-68] KRITIS
  is the German framework for critical infrastructure. The report provides
  evidence for your audit. It does not replace the audit, and it does not
  certify compliance. [C-19]

## 5. IGA as an add-on

- **Heading:** IGA as an add-on
- **Text:** With the IGA add-on you manage permissions in connected systems: joiners,
  movers and leavers, access requests with approval, regular access reviews
  and drift detection. Corrections only run once a second person approves.
  Writing connectors run as a separate process with their own enrollment and
  the least privileges they need. [C-70] IGA can be added to any plan; the
  price is available on request.
- **Link:** “Pricing and add-ons” → `/preise/` (English page)

## Closing

- **Heading:** Preparing for an audit?
- **Text:** Tell us what your audit requires. We will show you the audit log, rules and
  report using an example.
- **Buttons:** “Contact” (primary button), “Live demo”, “Try for 30 days”
- **Line below:** Offer for businesses only.
