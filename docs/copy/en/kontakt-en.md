# Text of the pages “Contact” and “Thanks” (English)

| | |
|---|---|
| As of | 2026-11-12 |
| Status | **Draft – translated 2026-11-12 from the German version, approval by the client pending** |
| Addresses | `/en/contact/`, `/en/contact/thanks/` (`noindex`) (German: `/kontakt/`, `/kontakt/danke/`) |
| Rules | `content-plan.md` §9; `specs/2026-11-12-website-spec.md` §6 (field limits, rate limit); no legal texts |

The notice on data processing is a placeholder; the provider supplies the
text. The direct contact details come from `SITE` (`src/data/site.ts`);
company name and address stay as they are, missing details appear as
placeholders with `data-placeholder`. The English form posts `lang=en`;
the server redirects to `/en/contact/thanks/` and, without JavaScript,
renders errors in the English template built from `/en/contact/`.

## Contact: page head

- **Browser title:** Contact – Reticora
- **Description:** Demo, Enterprise, security and privacy or another
  question: write to us using the form. Offer for businesses only.

## Contact: intro

- **Heading (h1):** Contact
- **Lead:** Tell us what it is about. We will reply to your business email
  address.
- **Line below:** Offer for businesses only.

## Form

- **Line above the form:** Fields marked “(required)” must be filled in.

| Field | Label | Required | Hint | `autocomplete` |
|---|---|---|---|---|
| `name` | Name (required) | yes | – | `name` |
| `email` | Business email address (required) | yes | We will reply to this address. | `email` |
| `company` | Company (required) | yes | – | `organization` |
| `topic` | Topic (required) | yes | – | `off` |
| `message` | Message | no | Up to 4,000 characters. | `off` |

- **Select “Topic”:** first option “Please choose” (empty), then:

| Value | Text |
|---|---|
| `demo` | Demo |
| `enterprise` | Enterprise |
| `security` | Security and privacy |
| `other` | Other |

- **Button:** “Send message”; while sending “Sending …”
- **Notice on data processing** (below the button, with `data-placeholder`):
  “[Notice on data processing: text from the provider]” with the link
  “Privacy policy” → `/en/privacy/`
- **Honeypot field** (hidden from assistive technology, not focusable):
  label “Please leave empty”.

## Error messages

- **Summary** (above the form, receives focus):
  - Heading for one error: “Please correct 1 entry.”
  - Heading for several: “Please correct {n} entries.”
  - Below, one link per error to the field, with the error message.
- **Without JavaScript** the server shows the same page with the same texts
  at the field and in the summary when input is invalid (status 422,
  entries kept).
- **General line** (key `form.generic`): “The form was not sent. Please
  check your entries.” Only in the summary for an error without a field and
  as the heading of the fallback page if the server lacks the contact page
  template; below it on the fallback page the link “Back to the form”.

| Code | Field | Message at the field |
|---|---|---|
| `required` | `name` | Please enter your name. |
| `required` | `email` | Please enter your business email address. |
| `required` | `company` | Please enter your company. |
| `required` | `topic` | Please choose a topic. |
| `too_long` | `name` | The name is too long. At most 200 characters are allowed. |
| `too_long` | `email` | The email address is too long. At most 254 characters are allowed. |
| `too_long` | `company` | The company name is too long. At most 200 characters are allowed. |
| `too_long` | `message` | The message is too long. At most 4,000 characters are allowed. |
| `invalid` | `email` | Please enter a valid email address, for example name@example.com. |
| `invalid` | `topic` | Please choose one of the four topics from the list. |
| `invalid` | `name`, `company` | Please do not use line breaks or control characters. |
| `invalid` | `message` | Please do not use control characters. |

| Request error | Text (above the form) |
|---|---|
| Rate limit (`429`) | You have sent several messages in a short time. Please try again in an hour. |
| Server error (`5xx`) or no connection | Your message could not be sent right now. Please try again in a few minutes. |

Below each of these: “Direct contact:” followed by the email address from
`SITE` or its placeholder. The period “in an hour” follows the rate limit of
the specification (at most 5 requests per origin and hour).

## Direct contact (next to the form)

- **Heading:** Provider
- **Content from `SITE`:** company, street, city (unchanged), with the labels
  “Company”, “Address”, “Email address”, “Phone”.
- **Placeholders for missing details:** “[Email address: details from the
  provider]”, “[Phone: details from the provider]”
- **Link:** “Legal notice” → `/en/legal-notice/`

## Thanks: page head

- **Browser title:** Thank you – Reticora
- **Description:** Your message has reached us.
- **Robots:** `noindex`

## Thanks: content

- **Heading (h1):** Thank you for your message.
- **Text:** Your inquiry has reached us. We will reply to the email address
  you provided.
- **Next:** “Open live demo” → `/en/demo/`, “Go to the home page” → `/en/`
