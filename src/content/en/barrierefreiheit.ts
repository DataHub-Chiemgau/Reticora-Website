import type { barrierefreiheit as De } from '../de/barrierefreiheit';
import type { Translation } from '../types';

/** Text of the page “Accessibility”, verbatim from docs/copy/en/barrierefreiheit-en.md.
 *  The contact channel at the end is a placeholder (`ui(lang).placeholders.a11yContact`). */
export const barrierefreiheit: Translation<typeof De> = {
  meta: {
    title: 'Accessibility – Reticora',
    description: 'How we test this website for accessibility, which contrast ratios apply, which limitations are known and how you can send us feedback.',
  },
  hero: {
    h1: 'Accessibility of this website',
    lead: 'This page states what we test on this website, with what result and where there are limits. The statements apply to the website, not to the Reticora application.',
    asOf: 'November 12, 2026',
  },
  pruefen: {
    title: 'How we test',
    items: [
      'Every page is tested automatically with axe-core on every change. As of today: no findings.',
      'Tested with the keyboard and operable: the menu, the expandable evidence notes, the outage simulation and the contact form.',
      'In addition to the points in the schematic, the outage simulation has a toggle button per CI and a result line that screen readers announce.',
    ],
  },
  kontraste: {
    title: 'Contrast',
    text: 'The colors are chosen so that text reaches a contrast ratio of at least 4.5:1 and outlines of controls at least 3:1. The values are calculated with the WCAG 2 formula.',
    label: 'Contrast ratios by color theme',
    heads: { pair: 'Pair', dark: 'dark theme “Control room”', light: 'light theme “Document”', min: 'Minimum' },
    rows: [
      { pair: 'Text on page background', dark: '16.0:1', light: '15.7:1', min: '4.5:1' },
      { pair: 'Lead text and descriptions on page background', dark: '8.3:1', light: '6.4:1', min: '4.5:1' },
      { pair: 'Hints and captions on page background', dark: '6.4:1', light: '5.0:1', min: '4.5:1' },
      { pair: 'Accent color on page background', dark: '9.0:1', light: '5.0:1', min: '4.5:1' },
      { pair: 'Outline of controls on page background', dark: '3.9:1', light: '3.1:1', min: '3.0:1' },
    ],
  },
  bewegung: {
    title: 'Motion and display',
    text: 'Motion only occurs in response to an action and lasts at most 150 ms. If “Reduce motion” is set in the system, it is dropped entirely. In “Forced colors” mode (such as the Windows contrast themes), buttons, network schematic and outage simulation take on the system colors; failed and affected CIs remain distinguishable. Color never carries a message on its own: states have a word, the network schematic has a result line.',
  },
  grenzen: {
    title: 'Known limitations',
    items: [
      'The images of the application are still placeholders. Each placeholder states in text what will be shown later.',
      'Schematics such as the network schematic are simplified. Their content is also available as text next to them: the result line names every affected CI.',
    ],
  },
  hinweise: {
    title: 'Feedback to us',
    text: 'Have you come across a barrier? Write to us:',
  },
};
