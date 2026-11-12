import type { kontakt as De } from '../de/kontakt';
import type { Translation } from '../types';

/** Text of the pages “Contact” and “Thanks”, verbatim from docs/copy/en/kontakt-en.md.
 *  Labels, hints and error messages of the form are in `ui(lang).form`. */
export const kontakt: Translation<typeof De> = {
  meta: {
    title: 'Contact – Reticora',
    description: 'Demo, Enterprise, security and privacy or another question: write to us using the form. Offer for businesses only.',
  },
  hero: {
    h1: 'Contact',
    lead: 'Tell us what it is about. We will reply to your business email address.',
  },
  direct: { title: 'Provider', imprint: 'Legal notice' },
  danke: {
    meta: { title: 'Thank you – Reticora', description: 'Your message has reached us.' },
    h1: 'Thank you for your message.',
    text: 'Your inquiry has reached us. We will reply to the email address you provided.',
    demo: 'Open live demo',
    home: 'Go to the home page',
  },
};
