# Text of the page “Accessibility” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/accessibility/` (German: `/barrierefreiheit/`), theme “Document” |
| Rules | verifiable statements only; no declaration of conformity with BFSG, BITV or WCAG; contact channel as a placeholder |

The statements concern the website, not the application. They rest on the
tests in `tests/` (axe-core in the browser tests, keyboard tests) and on the
contrast values in `design-system.md` §3.1. No claim from the product
register is needed here; the source is this repository. Check before
go-live: do axe and the keyboard tests pass on every page of the sitemap?
BFSG (German Accessibility Strengthening Act) and BITV (German accessible IT
regulation) are named only as context; this page makes no legal statement.

## Page head

- **Browser title:** Accessibility – Reticora
- **Description:** How we test this website for accessibility, which
  contrast ratios apply, which limitations are known and how you can send us
  feedback.

## Intro

- **Heading (h1):** Accessibility of this website
- **Lead:** This page states what we test on this website, with what result
  and where there are limits. The statements apply to the website, not to
  the Reticora application.
- **As of:** November 12, 2026

## 1. How we test

- **Heading:** How we test
- **List:**
  - Every page is tested automatically with axe-core on every change. As of
    today: no findings. [C-97]
  - Tested with the keyboard and operable: the menu, the expandable evidence
    notes, the outage simulation and the contact form. [C-98]
  - In addition to the points in the schematic, the outage simulation has a
    toggle button per CI and a result line that screen readers announce.

## 2. Contrast

- **Heading:** Contrast
- **Text:** The colors are chosen so that text reaches a contrast ratio of
  at least 4.5:1 and outlines of controls at least 3:1. The values are
  calculated with the WCAG 2 formula. [C-95]
- **Table** (values from `design-system.md` §3.1; the themes are named
  “Leitstand” and “Dokument” internally):

| Pair | dark theme “Control room” | light theme “Document” | Minimum |
|---|---|---|---|
| Text on page background | 16.0:1 | 15.7:1 | 4.5:1 |
| Lead text and descriptions on page background | 8.3:1 | 6.4:1 | 4.5:1 |
| Hints and captions on page background | 6.4:1 | 5.0:1 | 4.5:1 |
| Accent color on page background | 9.0:1 | 5.0:1 | 4.5:1 |
| Outline of controls on page background | 3.9:1 | 3.1:1 | 3.0:1 |

- **Below the table:** The values come from our design specification and are
  calculated by us, not checked by a third party. [C-95]

## 3. Motion and display

- **Heading:** Motion and display
- **Text:** Motion only occurs in response to an action and lasts at most
  150 ms. If your system is set to reduce motion, it is dropped entirely. [C-96]
  In “Forced colors” mode (such as the Windows contrast themes), buttons,
  network schematic and outage simulation take on the system colors; failed
  and affected CIs remain distinguishable. [C-99] Color never carries a message on
  its own: states are also labeled in words, the network schematic has a result line.

## 4. Known limitations

- **Heading:** Known limitations
- **List:**
  - The images of the application are still placeholders. Each placeholder
    states in text what will be shown later.
  - Schematics such as the network schematic are simplified. Their content
    is also available as text next to them: the result line names every
    affected CI.

## 5. Feedback to us

- **Heading:** Feedback to us
- **Text:** Have you come across a barrier? Write to us: “[Contact for
  accessibility feedback: details from the provider]” (placeholder with
  `data-placeholder`).
