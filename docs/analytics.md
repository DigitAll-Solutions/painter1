# Analytics: dataLayer events and GTM setup

The new site sends these events to the GTM dataLayer. They do nothing until GTM has a trigger and a tag
for them. This page lists each event, then the exact GTM items to add. Nothing has been changed or
published in GTM.

Every page loads **at most one** container (Rick, Nov 9; `lib/gtm.ts`, tested in `lib/gtm.test.ts`):

| Page | Container |
| --- | --- |
| Location pages (`/<location>/…`) | That location's own (Studio → location → "GTM container ID"; Knoxville: GTM-PVDK2ZFJ, with GA4 G-LYVZ6Q3NQW). **None** if it has no container: no fallback. |
| Corp pages (anything not under a location) | `NEXT_PUBLIC_GTM_ID`, the corp container **GTM-5LG3XH7S** (Production and Preview). Today Next.js serves no corp page: `/` goes to WordPress (or to /knoxville on other hosts), and `/studio` loads no GTM. |
| WordPress pages proxied by this site | Their own tags, unchanged |

**Bozeman and Marietta have no tracking** until Rick gives them a container (Nov 9). Their pages load no
GTM, so they send no GA4 page views, no events, no Ads conversions, and Attributer doesn't fill the
survey's channel fields. Once Rick has a container ID for one of them, paste it into Studio (location →
Leads & consent → "GTM container ID") and publish. No code change is needed.

The steps below go in each location's own container.

## Events

Every event carries `location_slug` (e.g. `knoxville`) and `page_path` (e.g. `/knoxville/free-estimate`).
No event carries a name, email, phone number or address.

| Event | When | Extra parameters |
| --- | --- | --- |
| `generate_lead` | The estimate request was saved. Not sent for validation errors, the spam trap (honeypot), a failed spam check or a failed save. | `service_type` (e.g. "Interior Painting"; empty for "Not sure"), `lead_id` (16-character hash of the lead's internal id; unique per lead, not personal data) |
| `phone_click` | Any click on a call link (`tel:`), anywhere on the site, including the success screen. | `link_url` (the `tel:` link: the location's own number), `link_text` |
| `booking_click` | Any click on a link to schedule.painter1.com ("Pick a time now", booking buttons). Booking is off for launch, pending Painter1 corp's decision after Jan 15: no page links there, so it doesn't fire until booking is turned on (`docs/go-live-plan.md`). Keep the tag and trigger. | `link_url`, `link_text` |
| `estimate_cta_click` | Any click on a link to a free-estimate page (`/<location>/free-estimate`). | `link_url`, `link_text` |
| `estimate_step_view` | Each survey step shown (unchanged). | `step` (0–6), `step_key` |

`estimate_submit` (the old success event) is gone: `generate_lead` replaces it. On Nov 7, 2026, no
published container used it. I checked the published versions of all 35 location containers set in Sanity
and the corp container GTM-5LG3XH7S. None had a trigger on `estimate_submit` (or `generate_lead`).
Unpublished workspace changes can't be seen from outside GTM, and 2 of the 37 locations have no container
ID in Sanity, so those weren't checked.

**Web chat (`webchat_open`): not available.** The Ringbot loader (api.callwidget.co) exposes no event or
callback, and the chat runs in its own frame, so the site can't see it open. No location has a chat ID
set yet either. If Ringbot adds an event later, it can be added the same way.

## Page views: nothing to add

GA4 page views already work on the new site, one per page, including pages opened without a full reload
(the site navigates in the browser):

- The Google tag (G-LYVZ6Q3NQW) fires once, on All Pages, and sends the first page_view.
- GA4's Enhanced measurement setting "Page changes based on browser history events" is **on**. It sends
  one page_view for each later page.

Tested locally with the container: home → warranty → Back sent three page_views, one per page, with no
doubles.

**Don't add** a History Change trigger with a page_view tag, and don't turn on "send a page view" in a
second GA4 tag. Either one would count every page twice.

## GTM setup (Rick)

Do this in a new workspace and check it in Preview before publishing.

### 1. Variables

Variables → User-Defined Variables → New → **Data Layer Variable** (Version 2), one for each:

| Variable name | Data Layer Variable Name |
| --- | --- |
| DLV - location_slug | `location_slug` |
| DLV - page_path | `page_path` |
| DLV - service_type | `service_type` |
| DLV - lead_id | `lead_id` |
| DLV - link_url | `link_url` |
| DLV - link_text | `link_text` |

### 2. Triggers

Triggers → New → **Custom Event**, "All Custom Events", one for each:

| Trigger name | Event name |
| --- | --- |
| CE - generate_lead | `generate_lead` |
| CE - phone_click | `phone_click` |
| CE - booking_click | `booking_click` |
| CE - estimate_cta_click | `estimate_cta_click` |

### 3. GA4 event tags

Tags → New → **Google Analytics: GA4 Event**. Measurement ID `G-LYVZ6Q3NQW`.

| Tag name | Event name | Event parameters | Trigger |
| --- | --- | --- | --- |
| GA4 - generate_lead | `generate_lead` | location_slug = {{DLV - location_slug}}, page_path = {{DLV - page_path}}, service_type = {{DLV - service_type}}, lead_id = {{DLV - lead_id}} | CE - generate_lead |
| GA4 - phone_click | `phone_click` | location_slug, page_path, link_url, link_text (each = its DLV) | CE - phone_click |
| GA4 - booking_click | `booking_click` | location_slug, page_path, link_url, link_text | CE - booking_click |
| GA4 - estimate_cta_click | `estimate_cta_click` | location_slug, page_path, link_url, link_text | CE - estimate_cta_click |

Then, in GA4:

- Admin → Events: mark `generate_lead` as a **key event**.
- Admin → Custom definitions: add event-scoped dimensions for `location_slug` and `service_type`, so they
  show in reports.

### 4. Google Ads conversion on generate_lead

The container has no Google Ads tag yet. You need the **Conversion ID** and **Conversion Label** from
Google Ads → Goals → Conversions → (new conversion action "Website lead", category "Submit lead form") →
Tag setup → "Use Google Tag Manager".

1. Tags → New → **Conversion Linker**, trigger **All Pages** (needed once per container).
2. Tags → New → **Google Ads Conversion Tracking**:
   - Conversion ID and Conversion Label: from Google Ads
   - Transaction ID: `{{DLV - lead_id}}`, so a lead is never counted twice
   - Trigger: **CE - generate_lead**

### 5. Old-site tags: leave them on until launch day

**Don't pause anything now.** The WordPress site still uses these tags, and 36 locations stay on
WordPress after the Knoxville launch.

On a location's launch day, once its pages have moved to the new site, two of its old tags count the
same clicks as the new events. These are Knoxville's tag names; other location containers have similar
tags with their own number and /schedule/ link:

| Old tag | Same clicks as | On launch day |
| --- | --- | --- |
| Click to Call (Link Click, `tel:(865)345-5800`) | `phone_click` | Pause it |
| Schedule Page btn (link to /knoxville/schedule/) | `booking_click` | Pause it |
| Click to F.F. Estimate ("Contact Form") | (old WordPress form only) | Leave it until WordPress is retired |
| Click to Chat (`sms:`), Click to Email (`mailto:`) | (not covered by the new events) | Keep them |

Rules:

- Pause them **only on launch day**, and **only in the container of a location that has moved to the
  new site** (Knoxville first, GTM-PVDK2ZFJ). Every other location's container stays as it is.
- **Never** pause tags in the corp container GTM-5LG3XH7S if it also loads on WordPress pages. (Its
  published version has no call or schedule link tags today.)

### 6. Test, then publish

1. Preview (Tag Assistant) on the staging site.
2. Submit a test request: check that **GA4 - generate_lead** and the Ads conversion fire **once**, with the
   service and lead_id filled in.
3. Click a call button and a "Free estimate" button: each fires its tag once. (No booking button while booking is off; test `booking_click` when it is turned on.)
4. Open two or three pages: one page_view per page.
5. Then Submit → Publish.

## How it works (developers)

- `components/estimate/EstimateSurvey.tsx` pushes `generate_lead` when the server action returns `success`.
  That happens only after the lead is saved. The action returns `leadRef`, which is `sha256(leadId)` cut to
  16 characters (`app/[location]/free-estimate/actions.ts`).
- `components/AnalyticsClicks.tsx` (in the location layout) runs one click listener, in the capture phase.
  `lib/analytics.ts` decides which event a link is, and is tested in `lib/analytics.test.ts`.
- GTM loads after the page has finished loading (`components/GoogleTagManager.tsx`). Events pushed before
  that wait in `window.dataLayer`, and GTM processes them when it starts. One exception: a booking click in
  the first seconds of a visit leaves the page in the same tab, so if GTM hasn't loaded yet, that one event
  is lost.
