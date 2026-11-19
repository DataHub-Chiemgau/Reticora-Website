import type { PageContent, Translation } from '../../types';

/** Verbatim from docs/copy/en/produkt-betrieb-en.md. */
export const betrieb: Translation<PageContent> = {
  meta: {
    title: 'Operations – tickets, SLAs, monitoring, workflows',
    description:
      'Tickets with SLA and business calendar on the affected CI, monitoring with alert rules, workflows and forms, maintenance windows with the affected customers.',
  },
  hero: {
    title: 'Incident, ticket, maintenance: on the CI, not next to it.',
    lead:
      'Service desk and network operations work on the same inventory as discovery. A ticket knows its CI, an alert its device, a maintenance window its customers.',
    actions: ['demo', 'trial'],
  },
  sections: [
    {
      id: 'tickets',
      title: 'Tickets with SLA',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Every ticket has a number that is unique within your organization, a reference to the affected CI or another object, and attachments. You create a ticket straight from a review when resolving it needs work on site. [C-62] SLAs are calculated with a business calendar that you define for the organization or for individual customers (Standard and above). [C-37, C-62]',
          ],
          shot: { id: 'S-11', caption: 'Ticket with SLA.' },
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Monitoring and alert rules',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'The collector also reads reachability, interface counters and the values of UPSs and PDUs. Reticora shows them as history on the CI and keeps them for 400 days. [C-63] An alert rule names metric, condition, threshold, duration and severity. When it fires, it creates a ticket, a webhook or a notification (Pro and above). [C-64] Notifications go out by email, with quiet hours, digests and deduplication. [C-90]',
          ],
          shot: { id: 'S-12', caption: 'Monitoring: metrics and alert rules.' },
        },
      ],
    },
    {
      id: 'workflows',
      title: 'Workflows and forms',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'You build recurring processes in the click builder, without writing code. A workflow starts on an event, manually or on a schedule, and runs actions: create a ticket, send a webhook, notify, set a field, request an approval. Whatever a workflow writes carries the provenance “workflow” with rank 92 and leaves your overrides in place. Forms are versioned and show or hide fields depending on the answers (Pro and above). [C-65]',
          ],
        },
        {
          kind: 'table',
          label: 'Example workflows',
          caption: '**Examples** (use cases from the product description, not customer projects):',
          rowHeader: 'flow',
          columns: [
            { key: 'flow', head: 'Process' },
            { key: 'parts', head: 'Building blocks' },
          ],
          rows: [
            { flow: 'Hand over a device', parts: 'Form, signature, set field [C-65]' },
            { flow: 'Approve a purchase order', parts: 'Form, approval, ticket [C-65]' },
            { flow: 'Announce maintenance', parts: 'Schedule, notification [C-65]' },
          ],
        },
      ],
    },
    {
      id: 'wartungsfenster',
      title: 'Maintenance windows',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'A maintenance window has a start, an end and the CIs being worked on. Reticora derives from them which customers are affected. Beforehand, you let these CIs fail together in the outage simulation and see what goes down with them and what stays up thanks to redundancy. [C-66, C-09]',
          ],
        },
        { kind: 'link', link: { label: 'Outage simulation', href: '/produkt/topologie-impact/' } },
      ],
    },
  ],
};
