# Painter1 content guide (Sanity Studio)

For the Painter1 team who edits the website. The Studio is at **/studio** on the site (for example `https://www.painter1.com/studio`). Sign in with the account you were invited with.

## Who can see what (read this first)

- **Every Studio member can read leads**: the estimate requests and warranty requests with customers' names, emails, phone numbers, addresses and photos, whatever their role. Only give Studio access to people who are allowed to see lead data, and remove access when someone leaves.
- **Roles:**
  - **Editor:** changes and publishes everything. This is the normal role for the content team.
  - **Contributor:** can make changes but can't publish them; an Editor reviews and publishes.
  - **Viewer:** read-only, and can still read leads.
  - **Administrator:** for the agency and the account owner only (members, settings, URLs).
- **Email recipients** (the addresses that receive estimate and warranty emails) are kept out of the public website data, but every Studio member can see them.
- **Warranty photos** that customers upload can be opened by anyone who has the photo's link. The link is only in the warranty email and the Studio.

## How the Studio is organized

| Section | What's in it |
|---|---|
| **Locations** | **Onboarding overview** (every location and what's still missing), then the locations grouped by state. Each location opens as a folder: **Location details**, **Email recipients**, **Leads** and **Warranty requests** (newest first), and **Live pages**. |
| **Shared** | Content used by every location: **Services** (the shared copy of each service page), **Estimate survey** (the questions on the free-estimate form), the **Privacy Policy** and the **Warranty terms** (the text of every location's warranty page). |
| **Corporate** | Corporate Homepage, Locations Directory, Franchise Opportunities. These pages are **not on the site yet**; editing them changes nothing for now. |
| **All leads** | Every estimate request, newest first, also **by location**, plus **test leads** (sent while email delivery was in test mode). Below them: every **warranty request**, newest first and by location. |

## Working on a location

The **Location details** document has these tabs: Basics · Owner & team · Homepage · Services · Photos · Reviews · Leads & consent · Warranty · SEO. Every field explains where it shows on the site and what happens when it's empty.

- **Launch checklist** (a tab at the top of the document): what's filled and what's missing.
  - **Red** items are required: the page breaks or misleads without them.
  - **Amber** items are recommended: the page works, but looks unfinished.
  - Click an item to jump to its field.
- **Publish** puts your changes on the site within about a minute. Fields marked with an error block publishing; warnings don't.
- **Open page** (in the document's action menu, or the **Pages** tab) opens the published pages this document feeds, on the same site you're signed into. Unpublished changes aren't there yet.

## Adding a location

1. **Create:** Locations → **All locations** (or any state) → create **New location**. It starts with:
   - the standard service titles;
   - the lead email subject and template;
   - the two consent checkboxes.
2. **Fill in Basics:**
   - **Name:** "Painter1 of {City}".
   - **City** and **State** (from the list).
   - **URL slug:** click **Generate**, which uses the city. It must match the location's live URL: `painter1.com/maryville` → `maryville`. The Studio warns if it isn't on the client's location list.
3. **Email recipients:** open the location's folder → **Email recipients**.
   - **Lead recipients** receive estimate requests (Client Tether's address goes here).
   - **Warranty request recipients** receive warranty requests. Never add Client Tether here; the Studio refuses it.
   - Until a list has an address, those requests are saved but nobody is emailed.
4. **Work down the Launch checklist** until nothing is red, then **Publish**.
5. **After publishing:** the URL slug is **locked**. Changing a live URL breaks every link to it, so ask an administrator, who will add redirects.

## Consent checkboxes

- **The business name:** write it as **`{locationName}`**, never typed out. The site fills in this location's name on the form, and the same text is saved with every lead as the consent record.
- **Checkbox names** (e.g. `terms-n-condition`) are stored with every lead, so don't rename them after launch.
- **Without consent checkboxes** the free-estimate form is replaced by "please call us".

## Photos

- **Gallery order:** newest first. Drag new photos to the top.
- **Tags:** tag each photo with its service(s), and tick **Commercial project** for commercial jobs.
- **Before/after pairs:** give both photos the same **Project ID** and set Before / After.
- **Photos that aren't this location's own work:** tick **Hide: not a local project**. They disappear everywhere, and you can untick it any time.
- **"See The Transformation" on a service page:** Location details → Services → the service → **Before/after pairs**. Add a before photo, an after photo and a short title for each pair; the first pair is shown first. One pair shows as a large slider; two or more show as a row of sliders. Photos used in a pair are left out of that page's Recent Work.

## What We Paint (service pages)

Each service page has one **What We Paint** section: a card per surface at the top, then a section per surface further down (Siding, Brick, Stucco…). A card's **See details ↓** jumps to its section.

- **Where:** Shared → **Services** → the service → **What we paint** tab → **What we paint (surfaces)**. Every location's page shows the same surfaces.
- **Each surface, edited in one place:**
  - **Surface name:** the card title and the section heading. Just the name ("Siding", "Trim & Doors").
  - **Link name:** the end of the link to the section, e.g. `siding` → `/knoxville/exterior-painting#siding`. Click **Generate**. Don't change it after launch.
  - **Icon** and **Card text** (one sentence on the card).
  - **Section text:** the text in the surface's section. Paragraphs and bullet lists; use bold for short labels. `{city}`, `{state}` and `{owner}` are filled in per location. Empty: the card text is shown there.
  - **Section photo** (optional): shown beside the text **on every location's page**, so pick one that suits them all. Without a photo the text is shown on its own.
- **Order:** drag the surfaces; cards and sections follow the same order.
- **Old "Sub-services (old)"** on a location (Knoxville's Siding and Stucco) are read-only and are removed after launch; their text is already in the surfaces.

## Online booking

- **Online scheduling** (Leads & consent tab) turns the estimate buttons into "Schedule Your FREE Estimate".
- **Booking page:** the location's page on appointment.painter1.com, e.g. `https://appointment.painter1.com/knoxville`. While it's empty, nothing links to booking.
- **Schedule button goes to:**
  - **Estimate survey** (the default): customers fill in the survey, and the thank-you screen offers **Pick a time now**.
  - **Booking page directly:** every Schedule button opens the booking page.

## Warranty page

- **Every location's page uses the same text:** Shared → **Warranty terms**. A change there changes every location's warranty page.
  - Write `{city}`, `{ownerFull}` and `{locationName}` where this location's details go.
  - `**double asterisks**` make words bold (in headings, the accent color).
  - Items with an **editor note** (e.g. "Nail pops: confirm for network") still need confirming; the note never shows on the site.
- **This location's parts** (Location details → Warranty tab): the photo, the PDF warranty sheet and the reply time. The owner quote, phone and hours come from Owner and Basics. Empty fields hide their line.
- **Requests** from the form are saved under the location's **Warranty requests** with the customer's photos, then emailed to the **Warranty request recipients**.
- Locations on the basic tier (home page and free estimate only) have no warranty page.
