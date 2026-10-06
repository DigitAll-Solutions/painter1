# /[location]/free-estimate — plan

**Decided:** build the client's tested multi-step funnel (§5). The one-page form remains only as the no-JavaScript fallback (§8).
Until launch the form emails **only a test address** (§6.1). Every submission is first saved as a private `lead` document (§3, §6).

Verified details of the live forms (fields, consent HTML, templates, recipients) are in
`docs/reference/live-site/estimate-form.md`, which is **gitignored** because it lists staff emails. No recipient address appears in this file.

## 1. What the live site does today (verified)

- **Form #73 "Knoxville-contact-form"** is embedded on every saved Knoxville page (inline and in the footer/modal).
  - **Fields, in this order:** Name (first + last, both required), Email (required, format-checked), Phone/Mobile (required, **no format validation**), Address `input_text` (required), State `input_text_2`, City `input_text_1` (required), Zip Code `input_text_3`, Message `description` (required, 4-row textarea).
  - **Consent:** two required, unchecked consent checkboxes.
  - **Captcha:** reCAPTCHA. Its version and keys are global settings and are not in the export.
  - **Button:** "Request Estimate". **Errors:** "This field is required" and "This field must contain a valid email".
  - **Confirmation:** hide the form and show "Thank you for your message. We will get in touch with you shortly".
- **Notification (#73):**
  - **Format:** plain text. Subject "Painter1.com - Get Free Estimate - Form Submission". Reply-To `{inputs.email}`.
  - **Recipients:** 7 (six staff addresses and the Client Tether parse address). From name/address are empty in the form, so WordPress's global sender is used.
  - **Body:** a fixed template using `{submission.source_url}` and `{inputs.*}`. It ends with `Client Tether Parsing Data:\nPARSER: {inputs.channel}, {inputs.channeldrilldown1}, {inputs.channeldrilldown2} ` (note the trailing space).
- **Per-location differences:**
  - **#119 Bozeman:** an extra blank line before `PARSER:`, a different single consent paragraph, and different recipients.
  - **#114 Knoxville Google Ads:** no address fields, one short consent box, sends **only** to Client Tether, and redirects to a thank-you page.
  - Templates and consent text therefore must be stored **per location**.
- **Attribution:**
  - **URL fields:** `utm_source`, `utm_medium`, `utm_campaign` and `gclid` are filled by Fluent Forms from the URL of the page the form is on.
  - **Attributer fields:** `channel`, `channeldrilldown1-3`, `landingpage` and `landingpagegroup` reach the browser as literal `[channel]` etc. and are filled by **Attributer**. It is loaded by a Custom HTML tag in GTM container `GTM-PVDK2ZFJ` (present on all 17 saved Knoxville pages).
  - **Same container:** also runs GA4 `G-LYVZ6Q3NQW`, a Facebook pixel and Google Ads conversions (`AW-11327858776`).
  - **Unused in the email:** only `channel` and drilldowns 1–2 reach the email body; `channeldrilldown3`, `landingpage` and `landingpagegroup` are collected but never used.
- **Scheduling:** `/knoxville/schedule/` embeds a **Simply Schedule Appointments** booking iframe from WordPress (`wp-json/ssa/...`); Knoxville's `schedulingUrl` in Sanity points at it.

## 2. Current repo

- **No form, API route, server action, email sending, captcha, GTM or test runner** exists yet.
- **Every CTA goes through `getCta(location)`** (`lib/location.ts`) and links to `/{slug}/free-estimate`, which does not exist yet:
  - **Homepage:** header, hero, floating tab, mobile bar, footer, owner section, How It Works, and CTASection.
  - **Service pages:** hero, transformation, final CTA.
  - **Label:** "Schedule Your FREE Estimate" when `hasScheduling`.
- **`#estimate`** is the homepage CTASection anchor. It is used only as the warranty-link fallback (`getWarrantyHref`).
- **Email fields:** `location.email` is the only one (the public contact address shown in the footer).
- **Env vars today:** `NEXT_PUBLIC_SANITY_*`, `NEXT_PUBLIC_SITE_URL`, `SANITY_API_READ_TOKEN` (used only by the seed script), `SANITY_API_WRITE_TOKEN` (seed only).

## 3. Data in Sanity

> **The dataset is public:** an unauthenticated API query returns location fields. Anything private must live in a dot-prefixed document, which Sanity never serves publicly; the server reads it with a token.

**On `location` (public, new "Leads" group):**
- `leadEmailSubject` (string)
- `leadEmailTemplate` (text; the description lists the supported placeholders)
- `leadConfirmationMessage` (string, default: #73's message)
- `consentBlocks[]`: each item has `name` (e.g. `terms-n-condition`, kept for the consent record) and `body` (rich text with italic and links); each renders as a required, unchecked checkbox
- `estimateSurvey`: optional reference to an `estimateSurvey` document; empty means the default survey

**Private `leadSettings` document, ID `leads.<slug>` (L1, accepted):**
- `leadRecipients` (array of emails, each validated, minimum 1).
- Read only by the server action with `SANITY_API_READ_TOKEN`. In test mode (§6) it isn't read at all.
- Studio gets a "Lead recipients" item per location. **Studio access matters:** every Studio user can read and edit these. Keep editor accounts limited.

**Private `lead` documents, ID `lead.<uuid>` (L7, accepted):** one per submission, written by the server action with `SANITY_API_WRITE_TOKEN` **before** the email is sent (§6). Fields:
- `location` (slug), `submittedAt`, `pageUrl`, `testMode` (true while `LEAD_TEST_RECIPIENT` is set)
- `answers`: `service`, `areas[]`, `areasOther`, `timeline`
- `message` (the customer's own text); `description` (the composed Message block exactly as emailed)
- `contact`: first name, last name, email, phone
- `address`: street, city, state, zip
- `attribution`: `utm_source`, `utm_medium`, `utm_campaign`, `gclid`, `channel`, `channeldrilldown1-3`, `landingpage`, `landingpagegroup`
- `consents[]`: `name`, `checked` (always true), `text` (plain text of the box as shown), `textHash` (SHA-256 of that text)
- `ip` and `userAgent`, stored with the consent record (L17, accepted; lead documents are private).
- `email`: `status` (`pending` / `sent` / `failed` / `skipped`), `mode` (`test` / `live`), `resendId`, `error`, `sentAt`

Studio shows a read-only "Leads" list (newest first; failed emails filterable). It contains personal data, so the same access rule applies.

**Seeding Knoxville from #73 exactly:** `scripts/seed-leads.ts` reads the **gitignored** Fluent Forms export at run time, so no address is ever in the repo. It writes:
- the recipients (to `leads.knoxville`);
- the subject and the template, byte for byte, including the `\n`s and the trailing space;
- the confirmation message;
- both consent blocks.

The consent HTML is converted to rich text: `<i>` becomes italic, `<a>` becomes a link, the `p1`/`s1` classes are dropped, and `<p>&nbsp;</p>` becomes an empty paragraph. The visible text stays word for word, and the dry run shows it beside the source HTML.

### 3.1 `estimateSurvey` document

- **Default survey:** one document `estimate-survey-default` (no dot, so it's public; the copy isn't sensitive), shown in Studio as a singleton "Estimate survey". A location's `estimateSurvey` reference can point to another survey document.
- **Fixed in code:** the step **order and keys** (`service`, `areas`, `timeline`, `address`, `name`, `email`, `phone`), the skip rules, validation, and the **email labels** (`Service`, `Areas`, `Timeline`). These feed the email and the Client Tether workflow, so editors can't break them.
- **Editable in Sanity:** every visible word, i.e. question titles, helper text, option labels (per service for Areas), button labels, the "What happens next" items, the owner-card line, and the success heading.
- **Tokens:** `{owner}` = owner first name, `{ownerFull}` = owner full name, `{city}` = location city.
- **No pronoun tokens (L18):** copy is written in neutral wording, e.g. "{owner} will use your name when reaching out to schedule your free on-site estimate" and "{owner} or the team calls to schedule your free estimate".
- **Options are stored as visible labels.** The server validates every submitted answer against the survey document in use, and the email gets the label text (e.g. `Areas: Siding, Trim & Doors`).

## 4. buildLeadEmail(template, data) and the Message block

`lib/lead-email.ts`, with no framework imports so it can be unit-tested directly.
- **Placeholders:** replaces `{inputs.<name>}`, dotted paths such as `{inputs.names.first_name}`, `{submission.source_url}`, and the other `{submission.*}` keys Fluent Forms supports that we can fill (`id`, `created_at`).
- **Missing or empty values, and unknown placeholders, become an empty string**, as Fluent Forms does.
- **Everything else is copied untouched:** newlines, spacing, the trailing space. Values are inserted raw (plain-text email).

**`composeDescription(answers, message)`** (`lib/estimate-survey.ts`, server-side) builds the value of `{inputs.description}`:
- **Lines:** `Service: <label>`; `Areas: <labels, joined ", ">` (omitted when the step was skipped); `Timeline: <label>`.
- **"Other":** when Other is chosen, its text is added as `Other (<text>)`. Parentheses, not a colon, so the line stays a single `Label: value`.
- **Customer message:** if present, a blank line and then the message exactly as typed. With no message the block ends after the Timeline line.
- **Only this block changes.** The rest of the email stays character for character the location's template, so the Client Tether `PARSER:` line is untouched.

Example inside the #73 template:

```
Message:
Service: Exterior Painting
Areas: Siding, Trim & Doors, Other (garage door)
Timeline: Within 30 days

The north side is peeling and we'd like it done before winter.



Client Tether Parsing Data:
PARSER: <channel>, <drilldown1>, <drilldown2> 
```

**Tests** (`lib/lead-email.test.ts`, run with Node's built-in `node --test` (Node 24 runs TypeScript natively), plus a `test` script):
- **Main case:** the fixture is built from the **#73 template exactly** (L3: not a blocker; adjust when the client sends a real email). Template plus fixture produces output compared character for character with a hand-written expected email.
- **Variants:** "Not sure" (no Areas line); no customer message; "Other" text; a customer message that itself contains `Label: value` text; empty optional fields (Zip, utm_*); and the #119 template.

## 5. Survey: the client's tested funnel (L13)

One question per screen; contact details across the last three screens. All copy below is the client's and becomes the default `estimateSurvey` content.

| # | Question (legend) | Input | Required / rules | Email |
|---|---|---|---|---|
| 0 | What type of painting do you need? | Interior Painting / Exterior Painting / Cabinet Refinishing / Not sure | one; **skipped** when the URL has `?service=interior\|exterior\|cabinet` (that value is used) | `Service:` line |
| 1 | Which areas are you looking to paint? | multi-select; helper "Select everything you're considering — we handle it all." **Interior:** Kitchen, Bedrooms, Living Room, Dining Room, Family Room, Bathrooms, Hallways & Stairs, Ceilings, Other · **Exterior:** Siding, Brick, Stucco, Trim & Doors, Decks, Fences, Other · **Cabinets:** Kitchen cabinets, Bathroom vanities, Other. "Other" reveals a short text input | at least one; Other's text required when Other is ticked (max 60 chars); **skipped** for "Not sure" | `Areas:` line |
| 2 | When are you hoping to get started? | As soon as possible / Within 30 days / 1–3 months / Just exploring options; plus optional "Anything else we should know?" textarea | timeline required; message optional (L15) | `Timeline:` line; message below |
| 3 | Where is the project? | Street, City (prefilled with the location's city, editable), Zip | Street, City required; Zip optional (as #73); **State from the location, not shown** | `{inputs.input_text}`, `{inputs.input_text_1}`, `{inputs.input_text_3}`, `{inputs.input_text_2}` = location state |
| 4 | Who should we make the estimate out to? | First name, Last name side by side; helper "{owner} will use your name when reaching out to schedule your free on-site estimate." | both required (#73) | `{inputs.names.first_name}` / `last_name` |
| 5 | Where should we send your estimate confirmation? | Email; "What happens next" box: "{owner} or the team calls to schedule your free estimate" / "You get an email confirmation" / "We visit your home, free, no obligation" | required, valid format (#73's message) | `{inputs.email}`, Reply-To |
| 6 | How should {owner} reach you? | Phone, US format, formatted as typed `(865) 555-0123`; owner card (photo, "{ownerFull} — Owner", "Our team follows up on every estimate request. You'll hear from us directly, usually within a few hours."); both #73 consent checkboxes; button **Request My Free Estimate** | phone required, 10 digits (a leading 1 is allowed); every consent box required | `{inputs.phone}` (formatted) |

**Success:** the survey is replaced by "Thanks, {first name}!", the location's confirmation message, the "What happens next" box and a **Call {phone}** button (`tel:`).

**Rules**
- **Progress:** a bar with "x% complete", where x = steps completed ÷ steps that apply. Skipped steps count in neither, so the bar still reaches 100%.
- **Navigation:** Back on every step after the first shown. Answers are kept in React state and mirrored to `sessionStorage` per location, so Back and reloads keep them; cleared on success.
- **Accessibility:**
  - Each step is a `<fieldset>`; on Next/Back, focus moves to its `<legend>`. Choice options are real radios/checkboxes styled as large cards, with no auto-advance.
  - Errors are inline with `aria-describedby`. A failed final submit sends focus to the step with the problem.
  - Fields have `autocomplete` (given-name, family-name, email, tel, street-address, address-level2, postal-code).
- **Layout:**
  - **Step 0 fits without scrolling at 360px:** a compact page header (no photo hero), the question and four options in the first screen.
  - On this page the floating "Free Estimate" tab and the mobile CTA bar are hidden: they link to the page itself and cost vertical space.
  - **Step 6 may scroll on small phones (L16, accepted).**
- **`?service` is read in the browser** (`useSearchParams`), so the page stays statically generated.
- **Service-page CTAs pass it:** `getCta(location, service?)` gains an optional service key, and the hero, transformation and final CTA on `/[location]/[service]` link to `/{slug}/free-estimate?service=<locationKey>`. The site header's CTA stays generic.
- **Analytics** (`window.dataLayer`, created even when GTM is off):
  - `{ event: 'estimate_step_view', step: <number>, step_key: <key> }` on every step shown, including after Back;
  - `{ event: 'estimate_submit', service: <label> }` on success.
- **Scheduling locations (L9, pending):** they get the same survey; no booking embed for now.

## 6. Submitting

**Server action** (`app/[location]/free-estimate/actions.ts`, `'use server'`); `useActionState` returns field errors, the result and pending state. Order:

1. **Honeypot** filled → return a normal-looking success and write and send nothing.
2. **Turnstile (L4):** no token, or verification fails → **reject**, write nothing, and return `call-us`. The UI shows "Please call us at {phone}" with a `tel:` link instead of the success screen. This also covers browsers without JavaScript (§8).
3. **Validate** every field and answer (§5 rules, options checked against the survey document) → field errors.
4. **Write the `lead` document** with `email.status: 'pending'`. If this write fails, still send the email (step 6) and log the error, so the lead goes out by email at least.
5. **Build the email:** `buildLeadEmail(location.leadEmailTemplate, data)`, with `{inputs.description}` from `composeDescription`.
6. **Send with Resend:** recipients and subject from the delivery mode (§6.1), Reply-To = customer email, plain text.
7. **Update the `lead`:** `email.status` becomes `sent` (with `resendId`, `sentAt`), `failed` (with `error`) or `skipped` (mode refused, see §6.1).
8. **The customer sees success whenever the lead was stored or emailed.** A failed email never loses the lead: it stays in Sanity flagged `failed` and is listed in Studio. Alerting on failures (e.g. a daily check) is a follow-up.

**Rate limit (L5): Vercel Firewall rule.** Vercel's docs say WAF rate limiting is **"available on all plans"**: Hobby allows 1 rate-limit rule per project (IP key, fixed window 10 s–10 min), Pro 40. One rule is enough:
- **If** request path matches `/*/free-estimate` **and** method is POST (server actions post to the page URL);
- **then** rate limit, key = IP, **5 requests per 10 minutes**, action 429.
- Configured in the dashboard, not in code; Upstash is not needed.

### 6.1 Delivery mode (L14, accepted)

| `LEAD_TEST_RECIPIENT` | `LEAD_SEND_LIVE` | To | Subject | From |
|---|---|---|---|---|
| set | any | **only** that address; `leads.<slug>` isn't read | `[TEST] ` + subject | Resend test sender `onboarding@resend.dev` |
| unset | `true` | every recipient in `leads.<slug>` | the location's subject | `LEAD_FROM_EMAIL` (verified painter1.com domain) |
| unset | not `true` | **nobody**: the email is refused, an error is logged, and the lead is saved with `email.status: 'skipped'` | — | — |

- The body is identical in every mode. In test mode Client Tether gets nothing, so no test leads reach the CRM.
- `LEAD_TEST_RECIPIENT` is the address that owns the Resend account, the only one the test sender can deliver to. It's set in Production, Preview and Development until launch.

**Env vars**

| Var | Where | Purpose |
|---|---|---|
| `RESEND_API_KEY` | server only | send email |
| `LEAD_TEST_RECIPIENT` | server only | test mode (§6.1); set everywhere until launch |
| `LEAD_SEND_LIVE` | server only | must be `true` to email real recipients (launch) |
| `LEAD_FROM_EMAIL` | server only | launch: From on the verified domain (unset now) |
| `TURNSTILE_SECRET_KEY` | server only | verify tokens |
| `TURNSTILE_SITE_KEY` | server; passed to the widget as a prop | widget (no `NEXT_PUBLIC_` needed) |
| `SANITY_API_READ_TOKEN` | server only (exists locally; **add to Vercel**) | read `leads.<slug>` |
| `SANITY_API_WRITE_TOKEN` | server only (exists locally; **add to Vercel**) | write `lead.*` documents. It can write any document, so it must never reach the browser; a dedicated "robot" token per environment is recommended |
| `NEXT_PUBLIC_GTM_ID` | public | GTM container; **unset for now** (§7) |

## 7. Attribution (L8, pending the client)

- **Hidden fields:** the form carries hidden inputs with #73's names: `utm_medium`, `utm_source`, `utm_campaign`, `gclid`, `channel`, `channeldrilldown1-3`, `landingpage`, `landingpagegroup`.
- **UTM/gclid persistence:** a small client component in the `[location]` layout stores `utm_*`/`gclid` from the landing URL in `sessionStorage`, so they survive navigation to the estimate page. The current URL wins if it has them.
- **GTM:** loaded **only when `NEXT_PUBLIC_GTM_ID` is set** (unset for now) with `next/script` after the page is interactive. When set to `GTM-PVDK2ZFJ`, Attributer fills the `channel`/`landingpage` fields as on the live site.
  - Enabling it later needs a Lighthouse re-check: the container also runs GA4, the Facebook pixel and Ads tags.
  - Its triggers may also be limited to the old hostname.

## 8. No-JavaScript fallback (version A)

The same `<form>` renders all steps at once with one submit button. Turnstile can't run without JavaScript, and L4 rejects submissions without a token, so **a visitor without JavaScript can't submit online**:
- a `<noscript>` notice at the top of the form says "Please call us at {phone}" with a `tel:` link;
- if they submit anyway, they get the same call-us message.

## 9. Consent record (L7)

Saved in the `lead` document (§3): which boxes were checked (`name`), the exact text shown and its hash, `submittedAt` and `pageUrl`, plus the user agent. The email body stays exactly the template; consent details are **not** added to the email.

## 10. Decisions

| # | Decision | Status |
|---|---|---|
| L1 | Recipients in private `leads.<slug>`; public fields on `location` | **Accepted** |
| L2 | Version B, A as the no-JS fallback | **Decided** |
| L3 | Fixture from the #73 template; adjust when a real email arrives | **Not a blocker** |
| L4 | No Turnstile token → reject, show "Please call us at {phone}" | **Decided** |
| L5 | Vercel Firewall rate-limit rule (available on all plans) | **Decided** |
| L6 | Survey answers in the Message block | **Decided** |
| L7 | Private `lead` document per submission, written before the email, holds the consent record | **Accepted** |
| L8 | GTM/Attributer: hidden fields wired, GTM behind `NEXT_PUBLIC_GTM_ID` (unset) | **Pending client** |
| L9 | Scheduling locations use the same survey, no booking embed | **Pending client** |
| L10 | #114 Google Ads landing page: no build (where it's used and what breaks: §1 and the audit) | **Pending client** |
| L11 | Sending domain and DNS | **Launch task** |
| L12 | Other locations seeded from their own exports when they move | Later |
| L13 | Client's tested funnel (§5) | **Decided** |
| L14 | Second switch `LEAD_SEND_LIVE` | **Accepted** |
| L15 | Customer message optional | **Accepted** |
| L16 | Accept the scroll on the phone step | **Accepted** |
| L17 | Store IP address and user agent with the consent record | **Accepted** |
| L18 | Neutral wording, no pronoun tokens | **Accepted** |

## 11. Working before the accounts exist

Nothing below needs a code change later; only env values are added.

| Missing | Behaviour |
|---|---|
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare's official always-pass **test keys** are used (site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`). In production (`VERCEL_ENV=production`, or a local production build), the same keys are used **and a warning is logged** on every verification |
| `RESEND_API_KEY` | Nothing is sent. The lead is saved with `email.status: "skipped (no RESEND_API_KEY)"`, and the composed subject, recipients mode and body are stored on it for review |
| `SANITY_API_WRITE_TOKEN` (e.g. on Vercel today) | The lead can't be saved, so the visitor sees "Please call us at {phone}" (never the success screen) and the error is logged. **Success is shown only when the lead was saved.** No email is sent for an unsaved lead |
| `SANITY_API_READ_TOKEN` | Only needed for live sending (reading `leads.<id>` recipients); in test mode it isn't used |

The composed subject, delivery mode and body are stored on **every** lead, whatever was sent. `scripts/preview-lead-email.ts` prints the email for a sample submission against Knoxville's template without sending or saving anything.

**Recipients document ID:** `leads.<location document id>` (e.g. `leads.location-knoxville`) rather than `leads.<slug>`, so a slug change can't orphan it. Studio opens it per location; new ones can't be created from the "new document" menu, because those would get a public random ID.

## Launch checklist

0. **Create the accounts under the client's ownership:** Resend and Cloudflare Turnstile (widget type "Invisible" for the site's domains). In Vercel add `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and a **dedicated** `SANITY_API_WRITE_TOKEN` (plus `SANITY_API_READ_TOKEN` for live recipients). Keep `LEAD_TEST_RECIPIENT` set while testing; set `LEAD_SEND_LIVE=true` **only at go-live**.
1. Verify a painter1.com sending subdomain in Resend (e.g. `leads.painter1.com`) and add its DNS records. Exact values come from Resend's dashboard:
   - MX `send.leads.painter1.com` → Resend's feedback/bounce host
   - TXT `send.leads.painter1.com` → `v=spf1 include:amazonses.com ~all`
   - TXT `resend._domainkey.leads.painter1.com` → DKIM public key
   - Recommended: TXT `_dmarc` → a DMARC policy
2. In Production only: set `LEAD_FROM_EMAIL`, unset `LEAD_TEST_RECIPIENT`, set `LEAD_SEND_LIVE=true`.
3. Confirm Knoxville's recipients in `leads.knoxville` (seeded from #73).
4. One end-to-end submission that Client Tether parses correctly.
5. Answers to L8 (GTM/conversions), L9 (scheduling) and L10 (Ads landing page).
6. Vercel Firewall rate-limit rule published.

## Files (when built)

- **New:**
  - `app/[location]/free-estimate/{page.tsx,actions.ts}`
  - `components/estimate/{EstimateSurvey.tsx,SurveyStep.tsx,ChoiceCards.tsx,ProgressBar.tsx,OwnerCard.tsx,ConsentCheckbox.tsx,Turnstile.tsx,SuccessPanel.tsx}`
  - `components/{AttributionCapture.tsx,GoogleTagManager.tsx}`
  - `lib/estimate-survey.ts` (step keys, skip rules, `composeDescription`), `lib/lead-email.ts`, `lib/lead-email.test.ts`, `lib/lead-delivery.ts` (mode, recipients, subject), `lib/turnstile.ts`
  - `sanity/schemas/{leadSettings.ts,lead.ts,estimateSurvey.ts}`, `scripts/seed-leads.ts` (recipients, template, consent from the export; default survey copy)
- **Changed:**
  - `sanity/schemas/location.ts` (Leads group, `estimateSurvey` reference), `sanity/schemas/index.ts`, `sanity/structure.ts` (survey singleton, Lead recipients, Leads list)
  - `sanity/lib/{queries,types}.ts`, `lib/location.ts` (`getCta` service param)
  - `app/[location]/[service]/page.tsx` (CTAs pass `?service`), `app/[location]/layout.tsx` (attribution capture, GTM when set; hide the floating CTA and mobile bar on the estimate page)
  - `package.json` (`test` script, `resend`), `.env.example`
