# Text of the page “Security” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Address | `/en/security/` (German: `/sicherheit/`) |
| Rules | `content-plan.md` §1, §6, §6.3, §7 (C-16 and C-17 are not mentioned); `brand-strategy.md` §4; no legal texts |

Every statement with a number, a security or a privacy reference names its
entry in the claim register (`content-plan.md` §7) in square brackets. On
the page it becomes an evidence note. Not mentioned: penetration test
(C-16), availability, RPO and RTO (C-17), certifications.

## Page head

- **Browser title:** Security and privacy – Reticora
- **Description:** Deployment models, connection direction and ports, tenant
  separation in the database, encrypted credentials, MFA, audit chain and
  data residency in the EU.

## Intro

- **Heading (h1):** What your security team wants to know.
- **Lead:** This page answers the questions of an initial assessment: where
  the data is stored, which connections exist, how customers are separated,
  who signs in and how, and what is logged. Every statement has evidence.
- **Buttons:** “Contact” (primary, topic “Security and privacy”), “Live
  demo”

## 1. Deployment models

- **Heading:** Deployment models
- **Table:**

| Model | Plans | Where Reticora runs | Claim |
|---|---|---|---|
| Cloud | Essentials, Standard, Pro | in the EU; the collector runs in your network | C-07, C-02 |
| Enterprise Shared | Enterprise Shared | in the cloud on separate infrastructure | C-92 |
| Enterprise Local | Enterprise Local | hosted by you; the price includes all work for it | C-92 |

## 2. Connections and ports

- **Heading:** Connections and ports
- **Text:** The collector opens every connection itself, outbound, to fixed
  hostnames. Reticora never opens a connection into your network; you need
  no inbound rule, no VPN and no port forwarding. A proxy is possible for
  HTTPS; port 4222 needs a direct connection because the collector
  authenticates there with its certificate. [C-02, C-77]
- **Table:**

| Direction | Port | Purpose | Claim |
|---|---|---|---|
| Collector → Reticora | 443/TCP, HTTPS | Enrollment with a one-time code, updates | C-02, C-41 |
| Collector → Reticora | 4222/TCP, NATS with mTLS | Discovery results, metrics, heartbeats, credentials | C-02, C-77 |
| Collector → devices in your network | ICMP, ARP, 22, 80, 443, 161/UDP, 623, 5985, 8006 | Discovery; does not leave your network | C-39, C-77 |

- **Figure:** schematic “Connection direction”. Caption: “Fig. 1 · The
  collector connects outbound: HTTPS 443 and NATS with mTLS 4222.
  Schematic.”
- **Key values “Collector”:**

| Term | Value | Claim |
|---|---|---|
| Enrollment code | valid for 24 h, single use | C-41 |
| Certificate | 90 days, renews itself; can be revoked | C-41 |
| Channel | its own only; revoked certificates and deactivated collectors are rejected | C-77 |
| Updates | signed only | C-42 |

## 3. Separation of customers

- **Heading:** Separation of customers
- **Text:** The database itself enforces the separation between
  organizations, customers, sites and teams: row-level security on the
  tenant tables, metric time series through dedicated views. [C-06] The
  application connects with a role that has no superuser rights and no
  `BYPASSRLS`; reads and writes check the same conditions. [C-78] An
  automated test checks the separation across all access paths. [C-93]

## 4. Credentials and keys

- **Heading:** Credentials and keys
- **Text:** Reticora stores the credentials for your devices encrypted
  (AES-256-GCM, with one data key per organization). They travel to the
  collector over the mTLS channel and are additionally encrypted to the
  collector’s key. In plain text they exist only in memory, never on disk,
  in API responses or in logs. [C-13, C-80]
- **Key values:**

| Term | Value | Claim |
|---|---|---|
| Session signing keys | rotated every 90 days | C-80 |
| Data key per organization | rotated yearly | C-80 |
| Master key | rewrapped without downtime | C-80 |
| API keys | stored only as a hash, rotation with overlap | C-75 |

## 5. Sign-in and permissions

- **Heading:** Sign-in and permissions
- **Text:** Sign-in uses OIDC with PKCE; a session token is valid for
  15 minutes. You connect your own identity provider per organization.
  Invitations are valid for 7 days, and deactivation takes effect
  immediately. [C-79] A second factor is mandatory for administrators.
  [C-34] Roles apply to the organization, a customer, a site or a team;
  every endpoint is mapped to a permission, and without a mapping access is
  denied. [C-33, C-84] Field permissions extend to the API, search, export
  and webhooks. [C-89] URLs for webhooks and imports may not point to
  private networks or metadata services. [C-81]
- **Figure:** S-17, “Fig. 2 · Permissions.”

## 6. Audit log and operator access

- **Heading:** Audit log and operator access
- **Text:** The audit log is built as a hash chain per organization; you
  verify it in the application or with `audit-verify`. It is kept for
  10 years. [C-12, C-69] Platform operations staff work with personal
  identities and a second factor. Every use of the break-glass access raises
  an alarm, and these accesses are recorded in a separate log with a hash
  chain. [C-82]
- **Figure:** S-14, “Fig. 3 · Audit log.”

## 7. Privacy and data residency

- **Heading:** Privacy and data residency
- **Text:** Data, backups, logs and search index are kept in the EU. [C-07]
  Personal data is kept in a separate vault; everywhere else only
  placeholder IDs appear. Deletion works by destroying the key, without
  breaking the audit chain. [C-14] You can export your organization in full;
  deleting the organization takes effect after a 30-day grace period.
  [C-83] The AI assistant add-on processes data in the EU or self-hosted,
  does not train on your data and is switched on per organization. [C-20]
- **Links:** “Subprocessors” → `/en/subprocessors/` (list from the
  provider); “Privacy policy” → `/en/privacy/`
- **Placeholder:** “[Data processing agreement: details from the provider]”
  (German: „Auftragsverarbeitung“, the processor agreement under the GDPR;
  no legal wording here)

## 8. Supply chain and uploads

- **Heading:** Supply chain and uploads
- **Text:** Release artifacts are signed, and every release comes with an
  SBOM. The collector installs only signed updates. [C-15, C-42] Uploaded
  documents are scanned for malware before the first download; until then
  the download is blocked. [C-60]

## 9. Report a vulnerability

- **Heading:** Report a vulnerability
- **Text:** If you have found a vulnerability, please write to us directly:
  “[Reporting channel for vulnerabilities: address from the provider]”.
- **Implementation note:** placeholder with `data-placeholder`; the address
  also goes into `/.well-known/security.txt` once it is known.

## Closing

- **Heading:** Does your assessment need more?
- **Text:** Tell us which questions are still open.
- **Buttons:** “Contact” (primary, topic “Security and privacy”), “Live
  demo”, “Try for 30 days”
- **Line below:** Offer for businesses only.
