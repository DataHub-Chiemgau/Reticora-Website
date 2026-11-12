# Text of the page “Live demo” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/demo/` (German: `/demo/`), `noindex` like the German page |
| Rules | `content-plan.md` §2, §6 (live demo), §6.3 (terms); credentials only from `src/data/links.ts` (`LINKS`) |

The credentials never appear in the text; they come from `LINKS.demo`,
`LINKS.demoUser` and `LINKS.demoPassword`. The labels of the app
(“Topology”, “Simulate outage”, “Affected CIs”, “Protected by redundancy”,
“Review inbox”) follow `content-plan.md` §6.3 and the English app UI.

## Page head

- **Browser title:** Live demo – try Reticora
- **Description:** Open the Reticora demo with the shared login. Three
  things to try: simulate an outage, view provenance, decide a review.

## Intro

- **Heading (h1):** Live demo
- **Lead:** The demo is a separate instance of Reticora with sample data.
  You do not need an account: sign in with the login below and try whatever
  interests you.

## 1. Login

- **Heading:** Demo login
- **Key value list** with a copy button per row:

| Label | Value |
|---|---|
| Address | `LINKS.demo` |
| User | `LINKS.demoUser` |
| Password | `LINKS.demoPassword` |

- **Copy button:** label “Copy”, after the click “Copied”; accessible name
  “Copy {label}”. Without JavaScript the buttons are left out; the values
  stay selectable.
- **Notice** (notice band, above the button): **Shared account.** All demo
  visitors use the same account and see what others enter. Do not enter
  real data: no names, no addresses, no credentials, nothing from your
  network or your customers’ networks.
- **Button:** “Open demo” (primary) → `LINKS.demo`

## 2. Three things to try

- **Heading:** Three things to try

### 2.1 Simulate an outage

- **Title:** Simulate an outage
- **Text:** Open “Topology”, select a PDU or UPS and click “Simulate
  outage”. The affected CIs are shown in gray. Servers connected to two
  power paths appear under “Protected by redundancy”. Add a second CI and
  see how the picture changes. [C-09]
- **Figure:** S-06, “Fig. 1 · Outage simulation in the topology.”

### 2.2 View the provenance of a field

- **Title:** View the provenance of a field
- **Text:** Open a CI and there the provenance of a field, such as the
  serial number. You see source, rank, time of observation and why this
  value applies. [C-03]
- **Figure:** S-02, “Fig. 2 · Provenance of a field in the CI view.”

### 2.3 Decide a review

- **Title:** Decide a review
- **Text:** Open the review inbox and select an entry. Observation and CI
  appear side by side. Decide: merge, create new, accept or dismiss. [C-30]
- **Figure:** S-03, “Fig. 3 · Review inbox: observation and CI compared.”

## Closing

- **Heading:** Prefer your own network?
- **Text:** In the trial you connect a collector to your network and see
  your own devices, for 30 days at Standard scope with up to 100 CIs. [C-22]
- **Buttons:** “Try for 30 days” (primary), “Contact”
- **Line below:** Offer for businesses only.
