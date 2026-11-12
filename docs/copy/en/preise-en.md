# Text of the page “Pricing” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/pricing/` (German: `/preise/`) |
| Rules | `content-plan.md` §6.1, §6.2, §6.3 (Paket → Plan); `compliance-matrix.md` B-02, I-03; answers only from `README.md` §14 and the decisions W-E in `project-brief.md` |

Every statement with a number names its entry in the claim register
(`content-plan.md` §7) in square brackets. Prices, limits and the plan
matrix exist only in `src/data/pricing.ts` (`PLANS`, `FEATURES`, `EXTRAS`,
`BETA`); the page reads them from there and formats them for English with
`src/lib/format.ts` (`€49`, `€1,190`, `€0.05`, `20%`). All prices net,
excl. VAT. Plan names stay unchanged: Essentials, Standard, Pro, Enterprise
Shared, Enterprise Local.

## Page head

- **Browser title:** Pricing and plans – Reticora CMDB
- **Description:** Essentials from €49 per month, plus Standard, Pro and
  Enterprise. Features, limits, additional charges and a 30-day trial.
  Prices excl. VAT, for businesses only.

## Intro

- **Heading (h1):** Plans and pricing
- **Lead:** Every plan includes CMDB, discovery, topology, racks and API.
  You pay monthly or yearly in advance. Prices excl. VAT.
- **Line below:** Offer for businesses only.

## 1. The plans

- **Heading:** The plans
- **Table** (values from `PLANS`): name, short description (`summary.en`),
  prices, limits. [C-21]

| Field | Wording |
|---|---|
| Column heads | “Plan”, “per month”, “per year”, “first beta year”, “CIs”, “Collectors”, “Users” |
| Monthly price | “€{price}”; for Enterprise “from €{price}” |
| Yearly price | “€{yearly price}”; for Enterprise “on request” |
| First beta year | “€{beta yearly price}”; for Enterprise “–” |
| Limits | “up to {n}” CIs; collectors and users as a number, for Enterprise “unlimited” |
| Note | “excl. VAT” |
| Button Essentials, Standard, Pro | “Try for 30 days” |
| Button Enterprise | “Get in touch” (topic “Enterprise”) |

- **Values for checking** (from `PLANS`, never typed in):

| Plan | per month | per year | first beta year | CIs | Collectors | Users | Claim |
|---|---|---|---|---|---|---|---|
| Essentials | €49 | €490 | €441 | 500 | 2 | 5 | C-21 |
| Standard | €119 | €1,190 | €1,071 | 2,500 | 5 | 25 | C-21 |
| Pro | €299 | €2,990 | €2,691 | 10,000 | 20 | 100 | C-21 |
| Enterprise Shared | from €999 | on request | – | 50,000 | unlimited | unlimited | C-21, C-92 |
| Enterprise Local | from €1,999 | on request | – | 50,000 | unlimited | unlimited | C-21, C-92 |

- **Notice band right next to the prices:** **Beta discount:** 20% in the
  first six months, 10% in the following six months, then the full price.
  If you pay yearly, the price in the column “first beta year” applies in
  the first year. [C-21]

## 2. Features by plan

- **Heading:** Features by plan
- **Table:** rows from `FEATURES` (`label.en`), one column per plan. [C-21]
  Storage values in English format: 1,000 MiB, 10,000 MiB, 50,000 MiB, ∞.
- **Legend:** “✓ included · – not included · ∞ unlimited · Add-on: can be
  added to any plan, price on request”
- **Hint on narrow screens:** “The table scrolls sideways.”
- **Caption:** Features by plan. Enterprise Shared and Enterprise Local
  differ in how they are operated. [C-21]
- **Evidence per row with numbers:** Document storage [C-60].

## 3. Additional charges

- **Heading:** Additional charges
- **Key values:**

| Term | Value | Claim |
|---|---|---|
| per CI above the plan limit | €0.05 per month | C-94 |
| per monitoring service | €0.03 per month | C-94 |
| IGA and AI assistant add-ons | on request | – |

- **Line below:** All amounts excl. VAT.

## 4. The trial

- **Heading:** Try for 30 days
- **Text:** The trial covers the Standard scope for up to 100 CIs. You
  create an account, confirm your email address and set up an authenticator
  app at your first sign-in. After the trial your CMDB is kept for 30 days;
  if you do not choose a plan by then, it is deleted. [C-22]
- **Button:** “Try for 30 days” (primary)

## 5. Questions

- **Heading:** Questions about pricing and plans
- **Form:** always-open list (question in bold, answer below), so that all
  answers appear in print.

| Question | Answer | Claim |
|---|---|---|
| What counts as a CI? | A CI is an entry in the CMDB: a device, a virtual machine, a service. The limit counts every CI of your organization that is not deleted, across all customers, whether discovery created it or a person. | C-86 |
| What happens above the limit? | Each CI above your plan’s limit costs €0.05 per month. If discovery finds a new device above the limit, Reticora does not discard it: it waits in the review inbox as an “Unlicensed CI” until it can be added. | C-94, C-87 |
| What happens after the trial? | Your CMDB is kept for 30 days after the trial ends. If you choose a plan within that time, you keep working with all your data; otherwise it is deleted. | C-22 |
| What happens if I switch to a smaller plan? | You lose no data. CIs above the new plan’s limit are charged as additional CIs. Features the new plan does not include are locked; their data is kept. | C-22, C-94 |
| How does the beta discount work? | In the first six months you pay 20% less, in the following six months 10% less, then the full price. If you pay yearly in advance, the price in the column “first beta year” applies in the first year. | C-21 |
| What is the difference between Enterprise Shared and Enterprise Local? | Enterprise Shared runs in the cloud on separate infrastructure. Enterprise Local is hosted by you; the price includes all work for it. | C-92 |
| What do IGA and the AI assistant cost? | Both add-ons can be added to any plan. The price is available on request. | – |
| Can private individuals buy Reticora? | No. The offer is for businesses only. All prices are exclusive of VAT. | – |

## Closing

- **Heading:** Try Reticora with your own network for 30 days.
- **Buttons:** “Try for 30 days” (primary), “Live demo”, “Contact”
- **Line below:** Offer for businesses only.
