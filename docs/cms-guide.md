# Painter1 content guide (Sanity Studio)

For the Painter1 team who edits the website. The Studio is at **/studio** on the site (for example `https://www.painter1.com/studio`). Sign in with the account you were invited with.

## Who can see what (read this first)

- **Every Studio member can read leads**: the estimate requests with customers' names, emails, phone numbers and addresses, whatever their role. Only give Studio access to people who are allowed to see lead data, and remove access when someone leaves.
- **Roles:**
  - **Editor:** changes and publishes everything. This is the normal role for the content team.
  - **Contributor:** can make changes but can't publish them; an Editor reviews and publishes.
  - **Viewer:** read-only, and can still read leads.
  - **Administrator:** for the agency and the account owner only (members, settings, URLs).
- **Lead recipients** (the addresses that receive estimate emails) are kept out of the public website data, but every Studio member can see them.

## How the Studio is organized

| Section | What's in it |
|---|---|
| **Locations** | **Onboarding overview** (every location and what's still missing), then the locations grouped by state. Each location opens as a folder: **Location details**, **Lead recipients**, **Leads** (newest first) and **Live pages**. |
| **Shared** | Content used by every location: **Services** (the shared copy of each service page), **Estimate survey** (the questions on the free-estimate form) and the **Privacy Policy**. |
| **Corporate** | Corporate Homepage, Locations Directory, Franchise Opportunities. These pages are **not on the site yet**; editing them changes nothing for now. |
| **All leads** | Every estimate request, newest first, also **by location**, plus **test leads** (sent while email delivery was in test mode). |

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
3. **Lead recipients:** open the location's folder → **Lead recipients** and add at least one address. Until then, estimate requests are saved but nobody is emailed.
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
