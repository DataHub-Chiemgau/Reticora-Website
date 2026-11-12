# Text of the page “API” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/product/api/` (German: `/produkt/api/`, text in `docs/copy/produkt-api-de.md`) |
| Rules | `content-plan.md` §1, §6; `brand-strategy.md` §4; app terms per `content-plan.md` §6.3 (US spelling) |

Every statement with a number or a security reference names its entry in the
claim register (`content-plan.md` §7) in square brackets; on the page it
becomes an “Evidence” disclosure. Layout notes, building blocks and the
claim-register changes are documented in the German version only.

## Page head

- **Browser title:** REST API, webhooks and export – Reticora
- **Description:** REST API described in OpenAPI with additive changes, errors per RFC 7807 and
  fixed rate limits. Signed webhooks, CSV and DATEV export, import with a dry
  run.

## Opening

- **Heading (h1):** A REST API with fixed rules.
- **Lead:** The REST API under `/api/v1` is fully described in OpenAPI. Changes are
  additive only. Anything that goes away, Reticora announces at least 12
  months in advance. [C-11, C-71]
- **Buttons:** “Try for 30 days” (primary button), “Live demo”

## 1. Principles

- **Heading:** Principles
- **Lead:** These rules apply to every endpoint under `/api/v1`.
- **Key figures:**

| Label | Value | Claim |
|---|---|---|
| Description | OpenAPI, complete | C-11 |
| Changes | additive only; deprecation with a `Sunset` header, at least 12 months in advance | C-71 |
| Errors | RFC 7807 with `trace_id` | C-71 |
| Retries | idempotent for 24 h | C-71 |
| Concurrent updates | protected by `ETag` | C-71 |
| Lists | cursor, 50 entries per page, at most 200; filters, sorting, field selection, full-text `q` | C-71 |

## 2. Authentication and rate limits

- **Heading:** Authentication and rate limits
- **Text:** Programs authenticate with an API key in the `X-API-Key` header. A key
  starts with `rk_live_`, belongs to a user or a service account and is stored
  only as a hash. Keys rotate with an overlap so that your integration keeps
  working during the switch. [C-11, C-75] A key sees only what its role may
  see, down to the individual field. [C-33, C-89]
- **Code sample**, header `GET /api/v1/cis`:

```
# All CIs whose name contains “core”, 50 per page
curl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50" \
  -H "X-API-Key: rk_live_…"
```

- **Key figures “Rate limits”:**

| Label | Value | Claim |
|---|---|---|
| per key or session | 600 requests per minute | C-38, C-72 |
| per organization | 6,000 requests per minute | C-72 |
| before sign-in, per IP address | 20 requests per minute | C-72 |

## 3. Webhooks

- **Heading:** Webhooks
- **Text:** Subscribe to events instead of polling the API. Every delivery is signed
  with HMAC-SHA256; your receiver verifies the signature with the shared
  secret. If a delivery fails, Reticora retries it at increasing intervals
  from 30 seconds to 6 hours. After that it goes to the dead-letter queue, and
  the subscription is deactivated. [C-73] Field permissions apply in webhooks
  too. [C-89] Reticora does not accept targets in private networks or at
  metadata services. [C-81]
- **Image:** S-15, “Fig. 1 · Webhooks: subscriptions, delivery history and dead-letter
  queue.”

## 4. Export and import

- **Heading:** Export and import
- **Text:** The CSV export runs in the background. It writes UTF-8 with BOM and
  semicolons so that the file opens correctly in spreadsheet programs,
  contains only the fields you are allowed to see, and includes a manifest.
  The download URL is valid for 15 minutes. For accounting there is the DATEV
  export (Standard and above). When importing, you map the columns with a
  saved profile and run a dry run first. [C-74, C-11]

## 5. Bulk changes

- **Heading:** Bulk changes
- **Text:** A bulk change covers up to 500 IDs. From 100 IDs it runs as a background job
  and delivers a report of which entries could not be changed. [C-76]

## Closing

- Closing band as on all pages: “Try Reticora with your own network for 30 days.” with “Try for 30 days” (primary button), “Live demo”, “Contact”; below it “Offer for businesses only.”
