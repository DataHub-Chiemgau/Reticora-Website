import type { Action, Rich, ShotRef } from '../types';
import type { demo as De } from '../de/demo';
import type { Translation } from '../types';

/** Text of the page “Live demo”, verbatim from docs/copy/en/demo-en.md. The credentials come from src/data/links.ts (LINKS). */
export const demo: Translation<typeof De> = {
  meta: {
    title: 'Live demo – try Reticora',
    description:
      'Open the Reticora demo with the shared login. Three things to try: simulate an outage, view provenance, resolve a review.',
  },
  hero: {
    title: 'Live demo',
    lead: 'The demo is a separate instance of Reticora with sample data. You do not need an account: sign in with the login below and try whatever interests you.',
  },
  zugang: {
    id: 'zugang',
    title: 'Demo login',
    labels: { address: 'Address', user: 'User', password: 'Password' },
    notice: {
      lead: 'Shared account.',
      text: 'All demo visitors use the same account and see what others enter. Do not enter real data: no names, no addresses, no credentials, nothing from your network or your customers’ networks.',
    },
    open: 'Open demo',
  },
  probieren: {
    id: 'ausprobieren',
    title: 'Three things to try',
    items: [
      {
        title: 'Simulate an outage',
        text: 'Open “Topology”, select a PDU or UPS and click “Simulate outage”. The affected CIs are shown in gray. Servers connected to two power paths appear under “Protected by redundancy”. Add a second CI and see how the picture changes. [C-09]' as Rich,
        shot: { id: 'S-06', caption: 'Outage simulation in the topology.' } as ShotRef,
      },
      {
        title: 'View the provenance of a field',
        text: 'Open a CI, then the provenance of one of its fields, such as the serial number. You see source, rank, time of observation and why this value applies. [C-03]' as Rich,
        shot: { id: 'S-02', caption: 'Provenance of a field in the CI view.' } as ShotRef,
      },
      {
        title: 'Resolve a review',
        text: 'Open the review inbox and select an entry. Observation and CI appear side by side. Decide: merge, create new, accept or discard. [C-30]' as Rich,
        shot: { id: 'S-03', caption: 'Review inbox: observation and CI compared.' } as ShotRef,
      },
    ],
  },
  closing: {
    id: 'abschluss',
    title: 'Prefer your own network?',
    text: 'In the trial you connect a collector to your network and see your own devices, for 30 days on the Standard plan with up to 100 CIs. [C-22]' as Rich,
    actions: ['trial', 'contact'] as Action[],
  },
};
