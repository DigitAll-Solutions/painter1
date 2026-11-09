# Lead source without Attributer: plan (not built)

**Status:** proposal only (Nov 9, 2026). Knoxville launches with Attributer. This is separate work to
offer Rick later. Nothing here is built.

## Why

Rick needs the traffic source (paid, organic, direct…) on every lead in Client Tether, from any page,
including when the visitor lands on a service page first. He isn't tied to Attributer.

How it works today:

- The estimate form has Attributer's hidden fields with Fluent Forms #73's names
  (`components/estimate/EstimateSurvey.tsx`, `id="[attributer-<field>]"`).
- Attributer (`d1b3llzbo1rqxo.cloudfront.net/attributer.js`) is loaded by a Custom HTML tag in each
  location's GTM container. Knoxville's is GTM-PVDK2ZFJ.
- The server action saves the fields on the lead (`attribution` in `sanity/schemas/lead.ts`). The
  location's email template prints them.

The gaps:

- **No container, no source.** Bozeman and Marietta have no GTM container (`docs/analytics.md`), so their
  leads have no channel.
- **GTM blocked, no source.** An ad blocker or a failed GTM load leaves every Attributer field empty.
- **Fast submits.** GTM loads after the page has finished loading (`lazyOnload`). A submit before then has
  no channel. This is rare, since the survey has several steps.
- **Third party.** The source depends on Attributer's script and its subscription.

## What Client Tether gets today

The fields on forms #73 and #114:

| Field | Filled by | In the email |
| --- | --- | --- |
| `utm_source`, `utm_medium`, `utm_campaign`, `gclid` | The URL (the old site read only the form page's own URL; the new site keeps them from the landing page for the session) | `Ga Source:`, `Ga Medium:`, `Ga Campaign:`, `Ga Gclid:` |
| `channel`, `channeldrilldown1`, `channeldrilldown2` | Attributer | `PARSER: <channel>, <drilldown1>, <drilldown2> ` (with its trailing space) |
| `channeldrilldown3`, `landingpage`, `landingpagegroup` | Attributer | Not emailed |

The `PARSER:` line is the one written for Client Tether, under `Client Tether Parsing Data:`. Which label
Client Tether maps to which lead field is set in its parser, which we can't see. The Fluent Forms exports
contain no submitted entries, so we have no real example values.

## The native version

### 1. Capture (browser)

`components/AttributionCapture.tsx` is already on every location page. It would write one first-party
cookie, `p1_attr` (path `/`, `SameSite=Lax`, `Secure`, 90 days), with two touches:

- **First touch:** set once, never replaced.
- **Last touch:** replaced on each new arrival that isn't direct, so a direct return visit keeps the
  last real source.

Each touch holds:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- the click ID's type and value (`gclid`, `gbraid`, `wbraid`, `msclkid`, `fbclid`)
- the referrer's host only (no path)
- the landing path without its query string
- the date

There is no name, email, phone or address in it, and no third party. It replaces today's sessionStorage
store. Booking links (`lib/booking-params.ts`) read the cookie instead.

### 2. Channel rule

A pure function in `lib/attribution.ts`, tested in `lib/attribution.test.ts`. The first match wins:

| Channel | Rule |
| --- | --- |
| Paid search | `gclid`, `gbraid`, `wbraid` or `msclkid`; or a paid medium (`cpc`, `ppc`, `paid`, `paidsearch`) with a search engine source |
| Paid social | A paid medium with a social source (`facebook`, `instagram`, `linkedin`…). `fbclid` alone isn't enough: Facebook adds it to organic shares too. |
| Email | `utm_medium=email` |
| Organic search | A search engine referrer (Google, Bing, Yahoo, DuckDuckGo, Ecosia…) |
| Organic social | A social network referrer |
| Referral | Any other outside referrer |
| Direct | None of the above |

The printed labels must be **exactly Attributer's**, for the channel and for each drill-down, so Client
Tether's rules and reports carry on unchanged. See "Before building".

### 3. Server

`app/[location]/free-estimate/actions.ts` reads the cookie itself with `cookies()`, rather than trusting
hidden form fields. It then:

1. Caps each value's length and strips control characters.
2. Works out the channel from the touches.
3. Saves the result on the lead.

### 4. Sanity

- The existing `attribution` fields keep their names and are filled from the **first touch**, which as
  far as we know is Attributer's default (confirm).
- New `firstTouch` and `lastTouch` objects on the lead hold the full detail.

### 5. Email

No template change. The same placeholders (`Ga *:` and `PARSER:`) get the native values, so Client Tether
parses the same lines. Last-touch lines go in the email only after a Client Tether test, because Client
Tether reads the email line by line (`docs/email-setup.md`).

### 6. Attributer

The form stops depending on it: the `[attributer-*]` ids are dropped. The tag stays in the GTM containers,
because schedule.painter1.com and the WordPress locations still use it.

## Files to touch

- New: `lib/attribution.ts`, `lib/attribution.test.ts`
- `components/AttributionCapture.tsx`
- `lib/booking-params.ts` and `lib/booking-params.test.ts`
- `lib/estimate-form.ts`
- `components/estimate/EstimateSurvey.tsx`
- `app/[location]/free-estimate/actions.ts`
- `sanity/schemas/lead.ts`, `sanity/lib/types.ts`
- `lib/lead-email.test.ts`, `scripts/preview-lead-email.ts`
- Docs: `docs/analytics.md`, `docs/email-setup.md`, and the Client Tether test in `docs/go-live-plan.md`

## Effort

About 1–1.5 days, including unit tests and a local end-to-end run. The run covers:

- a paid landing (utm and gclid)
- an organic search referrer
- a direct visit
- a landing on a service page before the form
- a direct return visit after a paid one

## Before building

Get from Rick the `PARSER:` lines of 3–5 recent Knoxville leads in Client Tether (ideally one paid, one
organic, one direct), or Client Tether's parser mapping. They give Attributer's exact channel and
drill-down labels. Without them, Client Tether could file the new leads under new source names.
