import type { PageContent, Translation } from '../../types';

/** Verbatim from docs/copy/en/produkt-api-en.md. A link to a public API reference follows only once one exists (F-15). */
export const api: Translation<PageContent> = {
  meta: {
    title: 'REST API, webhooks and export – Reticora',
    description:
      'REST API described in OpenAPI with additive changes, errors per RFC 7807 and fixed rate limits. Signed webhooks, CSV and DATEV export, import with a dry run.',
  },
  hero: {
    title: 'A REST API with fixed rules.',
    lead:
      'The REST API under `/api/v1` is fully described in OpenAPI. Changes are additive only. Reticora announces any removal at least 12 months in advance. [C-11, C-71]',
    actions: ['trial', 'demo'],
  },
  sections: [
    {
      id: 'grundsaetze',
      title: 'Principles',
      lead: 'These rules apply to every endpoint under `/api/v1`.',
      blocks: [
        {
          kind: 'specs',
          items: [
            { term: 'Description', value: 'OpenAPI, complete [C-11]' },
            { term: 'Changes', value: 'additive only; deprecation with a `Sunset` header, at least 12 months in advance [C-71]' },
            { term: 'Errors', value: 'RFC 7807 with `trace_id` [C-71]' },
            { term: 'Retries', value: 'idempotent for 24 h [C-71]' },
            { term: 'Concurrent updates', value: 'protected by `ETag` [C-71]' },
            { term: 'Lists', value: 'cursor, 50 entries per page, at most 200; filters, sorting, field selection, full-text `q` [C-71]' },
          ],
        },
      ],
    },
    {
      id: 'anmeldung',
      title: 'Authentication and rate limits',
      blocks: [
        {
          kind: 'split',
          paras: [
            'Programs authenticate with an API key in the `X-API-Key` header. A key starts with `rk_live_`, belongs to a user or a service account and is stored only as a hash. Keys rotate with an overlap so that your integration keeps working during the switch. [C-11, C-75] A key sees only what its role may see, down to the individual field. [C-33, C-89]',
          ],
          side: {
            kind: 'code',
            title: 'GET /api/v1/cis',
            code: '# All CIs whose name contains “core”, 50 per page\ncurl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50" \\\n  -H "X-API-Key: rk_live_…"',
          },
        },
        {
          kind: 'specs',
          title: 'Rate limits',
          items: [
            { term: 'per key or session', value: '600 requests per minute [C-38, C-72]' },
            { term: 'per organization', value: '6,000 requests per minute [C-72]' },
            { term: 'before sign-in, per IP address', value: '20 requests per minute [C-72]' },
          ],
        },
      ],
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      blocks: [
        {
          kind: 'figure',
          paras: [
            'Subscribe to events instead of polling the API. Every delivery is signed with HMAC-SHA256; your receiver verifies the signature with the shared secret. If a delivery fails, Reticora retries it at increasing intervals from 30 seconds to 6 hours. After that it goes to the dead-letter queue, and the subscription is deactivated. [C-73] Field permissions apply in webhooks too. [C-89] Reticora does not accept targets in private networks or at metadata services. [C-81]',
          ],
          shot: { id: 'S-15', caption: 'Webhooks: subscriptions, delivery history and dead-letter queue.' },
        },
      ],
    },
    {
      id: 'export-import',
      title: 'Export and import',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'The CSV export runs in the background. It writes UTF-8 with BOM and semicolons so that the file opens correctly in spreadsheet programs, contains only the fields you are allowed to see, and includes a manifest. The download URL is valid for 15 minutes. For accounting there is the DATEV export (Standard and above). When importing, you map the columns with a saved profile and run a dry run first. [C-74, C-11]',
          ],
        },
      ],
    },
    {
      id: 'massenaenderungen',
      title: 'Bulk changes',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'A bulk change covers up to 500 IDs. With 100 IDs or more, it runs as a background job and delivers a report of which entries could not be changed. [C-76]',
          ],
        },
      ],
    },
  ],
};
