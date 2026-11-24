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

The History Change triggers in "GTM setup" below only fire the old xad page-visit pixels (Homepage Visits, About Us Page View), not a GA4 tag, so they add no GA4 page views.

## GTM setup: additive (Knoxville, GTM-PVDK2ZFJ)

Until launch, the Knoxville container loads on the WordPress Knoxville pages; after launch, it loads on the new pages. So **nothing old is removed or changed**: every old tag keeps its old triggers and gets a new trigger next to it.

- Old triggers match only the WordPress pages (text such as "Get A Free Estimate", and URLs such as `https://www.painter1.com/knoxville/` with a trailing slash).
- New triggers match only the new site (its dataLayer events, and paths without a slash: the new site serves `/knoxville`, and `/knoxville/` redirects there).
- When two triggers of one tag match the same event, the tag still fires **once**.

There is one small difference on WordPress. Click to Call and Click to Chat now count any `tel:` or `sms:` link, not only the `(865)345-5800` format. The three Phone Call Click tags already count every `tel:` link.

Do everything in **one new workspace** (Workspace → New workspace → "Next.js additive"). Check it in Preview (step 6). Publish only once Rick approves. It can be published before launch day, because it changes nothing on WordPress.

### 1. Variables

1. Variables → Built-In Variables → **Configure** → tick **History Source** (under History). Page Path and Click URL are already on.
2. Variables → User-Defined Variables → **New** → Variable Configuration → **Data Layer Variable**, Version 2. Make one for each name below, then Save:

| Variable name | Data Layer Variable Name |
| --- | --- |
| DLV - service_type | `service_type` |
| DLV - location_slug | `location_slug` |
| DLV - lead_id | `lead_id` |

### 2. New triggers

Triggers → **New** → type the name → Trigger Configuration → pick the type → set it as below → Save.

| Trigger name | Type | Settings |
| --- | --- | --- |
| CE - estimate_cta_click | Custom Event | Event name `estimate_cta_click`, All Custom Events |
| CE - generate_lead | Custom Event | Event name `generate_lead`, All Custom Events |
| PV - /knoxville | **Page View** (not DOM Ready or Window Loaded) | Some Page Views: **Page Path** equals `/knoxville` |
| PV - /knoxville/about-us | Page View | Some Page Views: **Page Path** equals `/knoxville/about-us` |
| HC - /knoxville | History Change | Some History Changes: **Page Path** equals `/knoxville` **and** **History Source** does not equal `replaceState` |
| HC - /knoxville/about-us | History Change | Some History Changes: **Page Path** equals `/knoxville/about-us` **and** **History Source** does not equal `replaceState` |
| LC - sms: | Click → **Just Links** | Wait for Tags and Check Validation off; Some Link Clicks: **Click URL** contains `sms:` |

Why the `replaceState` condition: the site moves between pages with `pushState` (link clicks) and `popstate` (Back/Forward). Next.js can also call `replaceState` without leaving the page, and without the condition that would count the same page twice.

### 3. Extra firing triggers on existing tags

To add each trigger: Tags → open the tag → Triggering → **+** → pick the trigger → Save. **Remove nothing.**

| Tag | Keep (already there) | Add |
| --- | --- | --- |
| Get Free Estimate Click - FB | Get A Free Estimate Click, Schedule Your Free Estimate Click | CE - estimate_cta_click |
| Get Free Estimate Click - GT | the same two | CE - estimate_cta_click |
| Get a Free Estimate Click - SM | the same two | CE - estimate_cta_click |
| Request Estimate Click - FB | Request Estimate Click | CE - generate_lead |
| Request Estimate Click - GT | Request Estimate Click | CE - generate_lead |
| Request Estimate Click - SM | Request Estimate Click | CE - generate_lead |
| Click to Call Tag | Click to Call Trigger (`tel:(865)345-5800`) | **Phone Call Click** (the existing trigger: Click URL contains `tel:`) |
| Click to Chat Tag | Click to Chat Trigger (`sms:(865)345-5800`) | LC - sms: |
| Homepage Visits - GT | Homepage | PV - /knoxville, HC - /knoxville |
| About Us Page View - GT | About Us Page | PV - /knoxville/about-us, HC - /knoxville/about-us |

On the new site, "Request Estimate Click" means a **saved** estimate request: no validation errors, no spam. On WordPress it still means a click on the "Request Estimate" button.

The `sms:` links on the new site are the "Text" links on `/knoxville/warranty`.

### 4. New tag: GA4 - generate_lead

Tags → **New** → name **GA4 - generate_lead** → Tag Configuration → **Google Analytics** → **Google Analytics: GA4 Event**:

- Measurement ID: `G-LYVZ6Q3NQW`
- Event Name: `generate_lead`
- Event Parameters → Add parameter, three times:

| Parameter name | Value |
| --- | --- |
| service_type | `{{DLV - service_type}}` |
| location_slug | `{{DLV - location_slug}}` |
| lead_id | `{{DLV - lead_id}}` |

- Triggering: **CE - generate_lead** → Save.

**Not in this plan:**

- No GA4 tags for `phone_click`, `estimate_cta_click` or `booking_click`. Phone clicks reach GA4 through Click to Call (event "Click to Call"). If one of these tags is added later, don't make it a key event or Ads conversion while Click to Call is one, or each click counts twice.
- No Google Ads Conversion Tracking tag. The container has none, so Ads conversions come from GA4 imports (step 7). Adding an Ads tag on `generate_lead` **and** importing `generate_lead` from GA4 would count each lead twice.

### 5. Pause: only Schedule Page Tag, only at launch

**Nothing is paused now.** At launch (L8 in `docs/launch-day.md`), in GTM-PVDK2ZFJ only: Tags → tick **Schedule Page Tag** → ⋮ (top right) → **Pause** → Submit → Publish.

Its trigger is a link to `https://www.painter1.com/knoxville/schedule/`. The new site has no booking link while booking is off; `booking_click` covers booking later.

Every other tag stays on:

- **Click to Call is repointed, not paused** (step 3). The old plan said to pause it; that would have lost the GA4 "Click to Call" event.
- Click to F.F. Estimate ("Contact Form") simply stops matching on the new site. Leave it.
- Click to Email (`mailto:`), Apply for Financing, Attributor, the Google tag and all All-Pages tags are unchanged.

**Never** change the corp container GTM-5LG3XH7S or another location's container for Knoxville. When another location moves, it gets the same additive changes with its own paths and number.

### 6. Test in Preview

Workspace → **Preview** → URL `https://painter1.vercel.app/knoxville` → Connect. That is the production build and loads GTM-PVDK2ZFJ.

Preview fires the real pixels (GA4, Meta, xad, Xandr), so keep the test clicks few.

One click shows up as several events in Tag Assistant's left column (Click, Link Click, and the site's own event). For each row below:

- Select the event named, and check that the tags are under **Tags Fired**.
- Check the other events of the same click: the tags must **not** be there too.
- Each tag's detail must say **Fired 1 time** for that event.

| # | Do | Event | Tags fired (once each) | Must not fire |
| --- | --- | --- | --- | --- |
| 1 | Open `/knoxville` (fresh load) | Container Loaded | Homepage Visits - GT (plus the All Pages tags) | About Us Page View - GT |
| 2 | Click "About" in the menu | History Change | About Us Page View - GT | Homepage Visits - GT |
| 3 | Browser Back | History Change | Homepage Visits - GT | About Us Page View - GT |
| 4 | Reload `/knoxville/about-us` | Container Loaded | About Us Page View - GT | Homepage Visits - GT |
| 5 | Click a free-estimate button (header or hero) | `estimate_cta_click` | Get Free Estimate Click - FB, Get Free Estimate Click - GT, Get a Free Estimate Click - SM | The same three under Click or Link Click |
| 6 | (the free-estimate page that opens) | History Change | – | Homepage Visits, About Us Page View |
| 7 | Click a call link (header phone; at phone width, the Call button in the bottom bar) | Link Click | Click to Call Tag, Phone Call Click - GT, Phone Call Click - SM, Phone Call Click - FB | Any of them under `phone_click` |
| 8 | `/knoxville/warranty` → "Text" link (cancel the messaging app) | Link Click | Click to Chat Tag | – |
| 9 | `generate_lead`, see below | `generate_lead` | GA4 - generate_lead, Request Estimate Click - FB, Request Estimate Click - GT, Request Estimate Click - SM | – |
| 10 | Open `https://www.painter1.com/knoxville/` (WordPress, before launch) in the same Preview, and click its call link | Container Loaded, Link Click | Homepage Visits - GT once; Click to Call Tag once | – |

For row 9, **don't send a real request** on production before launch-day L5: it would reach Client Tether. Instead, in the previewed page's browser console:

```js
dataLayer.push({ event: 'generate_lead', location_slug: 'knoxville', service_type: 'preview-test', lead_id: 'preview-test' })
```

In Tag Assistant → that event → GA4 - generate_lead → check that the three parameters show these values. This counts one test conversion in GA4 and the pixels. The first real check is the L5 test lead on launch day.

Then **don't publish**. Rick approves first; after that, Submit → Publish.

### 7. GA4 and Google Ads (Rick)

**GA4** (the property of G-LYVZ6Q3NQW):

1. Admin → Data display → **Key events** → New key event → `generate_lead` → Save. This works before the first event arrives.
2. Admin → Data display → **Custom definitions** → Create custom dimension → scope Event → `service_type`, then again for `location_slug`. Don't add `lead_id`: it is unique per lead.
3. Admin → Product links → **Google Ads links**: check that the Knoxville Ads account is linked (needed to import).

**Google Ads** (the Knoxville account), Goals → Conversions → Summary. For each conversion action, send me:

- name
- **source** ("Website (Google Analytics (GA4))", "Website" or "Phone calls")
- Primary or Secondary
- for the GA4 ones, the GA4 event name (open the action → details)

What happens to each after launch:

| GA4 event behind the Ads conversion | After launch |
| --- | --- |
| Click to Call, Click to Chat, Click to Email, Apply for Financing | Keeps counting |
| Click to F.F. Estimate, Schedule Page btn | Stops on the new site |
| (none yet) `generate_lead` | Import it: + New conversion action → Import → Google Analytics 4 properties → Web → `generate_lead` → Import. Then category Submit lead form, Count **One**, Primary. |
| Source "Website" (a Google Ads tag) | The container has none, so it is tagged outside GTM (on WordPress) and stops at launch. Tell me which. |

Meta: the pixel events keep their names ("Get Free Estimate Click", "Request Estimate Click", "Phone Call Click"), so custom conversions built on them keep working.

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
