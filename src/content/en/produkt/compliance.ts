import type { PageContent, Translation } from '../../types';

/** Verbatim from docs/copy/en/produkt-compliance-en.md. C-19: a reporting function, no certification, no guarantee of compliance. */
export const compliance: Translation<PageContent> = {
  meta: {
    title: 'Compliance and audit – Reticora',
    description:
      'Audit log with a hash chain, compliance rules per CI type with score and findings, reports for ISO 27001, NIS2 and KRITIS, IGA as an add-on.',
  },
  hero: {
    title: 'Evidence from the inventory, not from memory.',
    lead:
      'An auditor needs two things: a log in which nothing can change unnoticed, and rules that show where the inventory deviates. In Reticora both work on the same CIs.',
    actions: ['contact', 'demo'],
  },
  sections: [
    {
      id: 'audit-protokoll',
      title: 'Audit log with a hash chain',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Every change goes into your organization’s audit log. The entries are linked into a hash chain: if an entry is changed or removed afterwards, the chain breaks at that point. You verify the chain in the application or with the command-line tool `audit-verify`. [C-12, C-69] In addition, Reticora keeps a field history for every CI: who or which source set which value and when. [C-69, C-03]',
          ],
          shot: { id: 'S-14', caption: 'Audit log.' },
        },
        {
          kind: 'specs',
          items: [
            { term: 'Chain', value: 'per organization [C-12]' },
            { term: 'Verification', value: 'in the application and with `audit-verify` [C-69]' },
            { term: 'Audit log retention', value: '10 years [C-69]' },
            { term: 'Field history retention', value: '3 years [C-69]' },
            { term: 'Access by platform operations', value: 'separate log with a hash chain [C-82]' },
          ],
        },
      ],
    },
    {
      id: 'regeln-score',
      title: 'Compliance rules and score',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'A compliance rule applies to a CI type and checks its fields, for example whether all firewalls run a supported firmware version. You build the rule in the click builder and give it a severity, a category and a remediation hint. Reticora evaluates every CI: passed, failed or not applicable. This yields a score, overall and per CI type (Enterprise). [C-67]',
          ],
          shot: { id: 'S-13', caption: 'Compliance: rules, score and deviations.' },
        },
      ],
    },
    {
      id: 'befunde',
      title: 'Findings with the affected CIs',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Every failed rule becomes a finding. It names the rule, severity and category, the remediation hint and the affected CIs. Findings are sorted by severity so that the most important ones are at the top. [C-68]',
          ],
        },
      ],
    },
    {
      id: 'berichte',
      title: 'Reports for ISO 27001, NIS2 and KRITIS',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Reticora produces a report for your audit. It contains: the verification result of the audit chain, the score, findings by severity with the affected CIs, and the security features enabled in your organization. [C-68] KRITIS is the German framework for critical infrastructure. The report provides evidence for your audit. It does not replace the audit, and it does not certify compliance. [C-19]',
          ],
        },
      ],
    },
    {
      id: 'iga',
      title: 'IGA as an add-on',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'With the IGA add-on you manage permissions in connected systems: joiners, movers and leavers, access requests with approval, regular access reviews and drift detection. Corrections only run once a second person approves. Writing connectors run as a separate process with their own enrollment and the least privileges they need. [C-70] IGA can be added to any plan; the price is available on request.',
          ],
        },
        { kind: 'link', link: { label: 'Pricing and add-ons', href: '/preise/' } },
      ],
    },
  ],
  closing: {
    id: 'abschluss',
    title: 'Preparing for an audit?',
    text: 'Tell us what your audit requires. We will show you the audit log, rules and report using an example.',
    actions: ['contact', 'demo', 'trial'],
  },
};
