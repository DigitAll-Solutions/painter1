# Painter1 content guide (Sanity Studio)

For the Painter1 team who edits the website. The Studio is at **/studio** on the site (for example `https://www.painter1.com/studio`). Sign in with the account you were invited with.

## Who can see what (read this first)

- **Every Studio member can read leads**: the estimate requests with customers' names, emails, phone numbers and addresses, whatever their role. Only give Studio access to people who are allowed to see lead data, and remove access when someone leaves.
- **Roles:**
  - **Editor:** changes and publishes everything. This is the normal role for the content team.
  - **Contributor:** can make changes but can't publish them; an Editor reviews and publishes.
  - **Viewer:** read-only, and can still read leads.
  - **Administrator:** for the agency and the account owner only (members, settings, URLs).
- **Lead recipients** (the addresses that receive estimate emails) are kept out of the public website data, but every Studio member can see them. **Only the website developer can change them** (the field is read-only for everyone else): send changes to them. A wrong address means leads silently stop reaching the team or Client Tether.
- **Leads are kept 90 days.** Every day the site deletes estimate requests that are **more than 90 days old and whose email was sent**: by then they are in the recipients' inboxes and in Client Tether. Requests whose email failed, was skipped or was a test are **kept**, so someone can follow them up; delete those by hand once handled. Lead recipients and all other content are never deleted. (Developers: `app/api/cron/cleanup-leads`, `lib/lead-cleanup.ts`; a manual run is `node --env-file=.env.local scripts/cleanup-leads.ts --dry-run`.)

## How the Studio is organized

| Section | What's in it |
|---|---|
| **Locations** | **Onboarding overview** (every location and what's still missing), then the locations grouped by state. Each location opens as a folder: **Location details**, **Lead recipients**, **Leads** (newest first) and **Live pages**. |
| **Shared** | Content used by every location: **Services** (the shared copy of each service page), **Estimate survey** (the questions on the free-estimate form), the **Privacy Policy** and the **Warranty terms** (the text of every location's warranty page). |
| **Corporate** | Corporate Homepage, Locations Directory, Franchise Opportunities. These pages are **not on the site yet**; editing them changes nothing for now. |
| **All leads** | Every estimate request, newest first, also **by location**, plus **test leads** (sent while email delivery was in test mode). |

## Working on a location

The **Location details** document has these tabs: Basics · Owner & team · Homepage · Services · Photos · Reviews · Leads & consent · Warranty · SEO. Every field explains where it shows on the site and what happens when it's empty.

- **Launch checklist** (a tab at the top of the document): what's filled and what's missing.
  - **Red** items are required: the page breaks or misleads without them.
  - **Amber** items are recommended: the page works, but looks unfinished.
  - Click an item to jump to its field.
- **Publish** puts your changes on the site within a few seconds (see [Publish and send a preview to the owner](#publish-and-send-a-preview-to-the-owner)). Fields marked with an error block publishing; warnings don't.
- **Open page** (in the document's action menu, or the **Pages** tab) opens the published pages this document feeds, on the same site you're signed into. Unpublished changes aren't there yet.

## Adding a location

**The locations on Rick's list already exist** (36 created from the list on Oct 20, plus Knoxville), with the right name, URL slug and tier (Growth = every page, Maintenance = homepage, free estimate and privacy only). Open the location instead of creating a new one, and go on from step 2. Their lead recipients are empty: the developer adds them, so no estimate email is sent for a location until then.

**Previewing:** every location can be checked at `https://painter1.vercel.app/<slug>` (e.g. `/upstate`) as soon as it's published. That copy is never indexed by Google, and a location only appears on painter1.com, in the sitemap and in search results once the developer adds it to the live list on its launch day. To send it to the owner, see [Publish and send a preview to the owner](#publish-and-send-a-preview-to-the-owner).

1. **Create** (only for a location that isn't on the list yet): Locations → **All locations** (or any state) → create **New location**. It starts with:
   - the standard service titles;
   - the lead email subject and template;
   - the two consent checkboxes.
2. **Fill in Basics:**
   - **Name:** "Painter1 of {City}".
   - **City** and **State** (from the list).
   - **URL slug:** click **Generate**, which uses the city. It must match the location's live URL: `painter1.com/maryville` → `maryville`. The Studio warns if it isn't on the client's location list.
3. **Lead recipients:** send the addresses that should receive estimate requests (including the location's Client Tether parse address) to the developer, who adds them (location folder → **Lead recipients**; read-only for everyone else). Until there's one, estimate requests are saved but nobody is emailed.
4. **Work down the Launch checklist** until nothing is red, then **Publish**.
5. **After publishing:** the URL slug is **locked**. Changing a live URL breaks every link to it, so ask an administrator, who will add redirects.

## Publish and send a preview to the owner

When a location is filled in, publish it and send the owner a link so they can check their pages before launch.

1. **Fill the sections:** open the location (Locations → the state → the location → **Location details**) and work through the tabs (Basics · Owner & team · Homepage · Services · Photos · Reviews · Leads & consent · Warranty · SEO). The **Launch checklist** tab shows what's missing: no red items left, and as few amber ones as you can.
2. **Click Publish** (bottom right). Until you do, your changes are only a draft and nobody else sees them, the preview link included.
3. **Wait a few seconds** (about 4 in our test), then open or refresh the page. If the old content still shows after a minute, tell the developer: the instant update isn't working, and pages then only catch up within an hour.
4. **Copy the link:** the location folder → **Live pages** lists every published page of this location, opened on painter1.vercel.app (when you're signed into the Studio at `https://painter1.vercel.app/studio`). Open one and copy the address from the browser.
5. **Send it to the owner.** The link format is **`https://painter1.vercel.app/<slug>`**, e.g. `https://painter1.vercel.app/upstate`. Inner pages add their path: `/<slug>/about-us`, `/<slug>/interior-painting`, `/<slug>/exterior-painting`, `/<slug>/cabinet-painting`, `/<slug>/our-work`, `/<slug>/warranty`, `/<slug>/free-estimate`.

**Where to find the slug:** the location's **Basics** tab → **URL slug** (e.g. `upstate`). It's the part after `painter1.com/` on the location's current website. **Maintenance** locations only have the homepage, `/<slug>/free-estimate` and `/<slug>/privacy-policy`; their other links show "page not found".

**painter1.com doesn't change until launch.** Publishing only updates the preview copy on painter1.vercel.app, which Google never indexes. The owner's current page on painter1.com stays exactly as it is until the developer moves that location over on its launch day. The free-estimate form on the preview does work, though: a request sent there is saved as a lead in the Studio, so ask the owner to send one only as a test.

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

- **Surfaces and their text:** Shared → **Services** → the service → **What we paint** tab → **What we paint (surfaces)**. Every location's page shows the same surfaces and text.
- **Photos: a default for every location, replaced by the location's own:**
  - **Default photo** (Shared → **Services** → the service → **What we paint** → the surface → **Default photo (shown when the location has none)**): shown on every location's page for that surface until the location adds its own. Today these are Rick's AI images (interior: Walls, Ceilings, Trim, Doors; exterior: Stucco, Trim & Doors, Decks, Fences; cabinet: all three). Alt text describes the scene, never "our crew" or a location, because every location shows it.
  - **The location's own photo** (Location details → **Services** → the service → **What We Paint photos**): add a photo, pick its surface from the list, and write alt text that describes the job (what was painted, the colors), not "Painter1 painter". It replaces the default on that location's page only; other locations keep the default. It's never shown on another location's page.
  - **When a location sends real crew photos:** add them to that location's **What We Paint photos**. Don't replace the default: other locations still use it.
  - **No default and no photo of its own:** the section shows text only.
- **Each surface (shared, in Services):**
  - **Surface name:** the card title and the section heading. Just the name ("Siding", "Trim & Doors").
  - **Link name:** the end of the link to the section, e.g. `siding` → `/knoxville/exterior-painting#siding`. Click **Generate**. Don't change it after launch.
  - **Icon** and **Card text** (one sentence on the card).
  - **Section text:** the text in the surface's section. The usual order: a short intro paragraph; **How we do it** set in the **Label** style (the style menu); a bullet list where each item starts with a bold sentence; **What you get:** in bold, then the rest; and **Warranty note:** in the **Small note** style. Label and Small note look like small headings but aren't headings, so the page outline stays tidy. `{city}`, `{state}` and `{owner}` are filled in per location. Empty: the card text is shown there.
- **Order:** drag the surfaces; cards and sections follow the same order. Renaming a surface keeps its default photo and each location's photo attached.

## About page

Every full-tier location has an About page at `/<location>/about-us` (basic-tier locations don't). It builds itself from the location's data, and any section without data is simply left out.

- **Which version shows:** Location details → **Owner & team** → **Franchise structure**.
  - **Owner-led:** "Meet {owner}, the owner who handles your job start to finish", the owner's quote and story, and four steps the owner runs.
  - **Owner with team:** "The {city} team behind every job", a card for each person, and five steps with a named role on each.
  - If it's empty, a location with team members gets the team version.
- **What feeds it (Owner & team tab):**
  - **Owner story (About page):** the owner's own words, first person, with a blank line between paragraphs. Usually: background, why they opened this location, local roots, and what they check on every job. For a team, also why they built one. Real facts only, never a template bio.
  - **Owner quote**, **Owner since (year)**, **Owner photo** and **Owner on the job photo:** the same fields the homepage uses.
  - **Why I built a team (About page, team version only):** the owner, first person, on why they added estimators or project managers and what they still check themselves. Only when this is filled does the page use the heading "Why I built a team instead of doing it all myself"; otherwise the owner story appears under "From the owner".
  - **Contractor license number:** shown as "License #…" under "Licensed & insured", only where the state requires one.
  - **Team photo (About page):** the owner with the estimators and project managers, at the top of the team version.
  - **Team members:** for each person, their **Name**, **Job title** (shown as written), **Role** (Owner, Estimator, Project Manager, Office & Scheduling or Other; it sets their badge and who appears on each step), **What they do for you** (one line; empty uses a standard line for the role), **With owner since** (gives "N years with the company") and **Photo** (empty shows their initials). The homepage shows the first two. Painting crews aren't listed: they're covered by "Vetted painting crews".
- **Steps:** when nobody has a role (for example no Estimator), that step shows "Owner".
- **Ratings and reviews:** rating, review count and **Project counts** come from the same fields as the homepage. The reviews shown are the ones that name the team (the **Names mentioned** field on each review) or the owner.

## Web chat (Ringbot)

- **Where:** Location details → **Leads & consent** → **Web chat (Ringbot)**. Paste the location's Ringbot embed code (`<script src="https://api.callwidget.co/embed?iID=…"></script>`): the field keeps only the iID, and the site builds the script address itself, so nothing else can be loaded. Empty: no chat button.
- **Each location has its own install.** The ID carries that location's business name and phone number, so never copy another location's code: a visitor would be connected to the wrong office.
- The chat button appears in the bottom-right corner once the page has finished loading and the browser is idle, so it doesn't slow the page down. On phones it sits just above the Call / Free Estimate bar.

## Online booking

- **Where:** Location details → **Leads & consent** → **Main buttons and booking page**.
- **Main buttons go to:**
  - **Booking page** (locations that book online): the header button, hero, section buttons, service pages, About, warranty and the final band say **"Schedule Your FREE Estimate"** and open the booking page in the same tab. The visitor's campaign source (utm_… and ad click IDs) goes along, so the booking page still sees where the visit came from.
  - **Free estimate survey** (the default): every button says "Get Your FREE Estimate" and opens the survey.
- **The side tab "Free Estimate"** (and the Free Estimate button in the phone bar) always opens the survey, whichever is picked.
- **Booking page:** the location's page on schedule.painter1.com, e.g. `https://schedule.painter1.com/knoxville`. It shows when "Booking page" is picked. **While it's empty, every button goes to the survey**, so nothing ever links to an empty page; the launch checklist flags it.
- **After a survey request**, booking locations also get **Pick a time now** on the thank-you screen.

## Warranty page

- **Every location's page uses the same text:** Shared → **Warranty terms**. A change there changes every location's warranty page.
  - Write `{city}`, `{ownerFull}` and `{locationName}` where this location's details go.
  - `**double asterisks**` make words bold (in headings, the accent color).
  - Items with an **editor note** (e.g. "Nail pops: confirm for network") still need confirming; the note never shows on the site.
- **This location's parts** (Location details → Warranty tab):
  - **Warranty page: photo** — the photo at the top of the warranty page, beside the 2-year shield. Use one of this location's own jobs. Without one, the page shows the shield on its own (never another location's photo).
  - **Homepage warranty: photo** is a different field: it's the photo in the warranty section on this location's homepage.
  - **Warranty sheet (PDF):** optional download button.
  - The owner quote comes from Owner; the phone and email come from Basics.
- **Questions block:** near the bottom of the page, "Questions About Your Warranty?" with **Call**, **Text** and **Email** buttons. Call and Text use the location's main phone (every main line takes texts); Email shows only when the location has a public email. The heading and line can be changed in Shared → Warranty terms → Contact & small print (`{ownerTeam}` becomes "Keith's team"). There is no request form: locations rarely get warranty requests.
- Locations on the basic tier (home page and free estimate only) have no warranty page.

## Before any bulk change (developers)

Scripts in `scripts/` change many fields at once. Before running one that writes (anything without `--dry-run`):

1. **Back up the dataset:** `node --env-file=.env.local scripts/backup-sanity.ts`. It saves every document (published, drafts and the private lead documents) and every image's record to `docs/backups/<date>/` on your machine. That folder is gitignored and holds private lead details, so keep it off shared drives. The image files stay in Sanity. To restore documents: `npx sanity dataset import docs/backups/<date>/documents.ndjson production --replace` (agree it with the client first).
2. **Dry-run the script** (`--dry-run`) and read what it would change.
3. **Seeds never overwrite Studio edits.** Every script only fills empty fields, or replaces the exact old text it was written to replace. Anything else (text edited in Studio, a list that already has items) is listed as **KEPT** and left alone. `--force` overwrites those after printing each one and asking you to type `OVERWRITE`.
4. **Check that re-runs are no-ops:** `node --env-file=.env.local scripts/check-seeds.ts` dry-runs every script and mode and fails if any of them would change data.

## Changes show right after publishing (developers)

When a document is published, a Sanity webhook calls the site's `/api/revalidate`. It refreshes only the pages that document affects:

- **A location:** that location's pages (also under its old slug if the slug changed).
- **A service, the warranty terms, the privacy policy or the estimate survey:** those pages on every location.

The next visit then shows the change (in our test, about 4 seconds after publishing). Without the webhook, pages still refresh within about an hour (a fallback kept long on purpose, to stay inside Sanity's Free plan API quota). Lead documents and lead settings aren't on any page, so the webhook ignores them.

**Set it up once** (needs project admin access; the site needs no change):

1. **Make a secret:** a long random string. In any terminal with Node (PowerShell included): `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (or `openssl rand -base64 32` where OpenSSL is installed). Use the same value in steps 2 and 3, and nowhere else.
2. **Add it in Vercel:** the painter1 project → Settings → Environment Variables → add `SANITY_REVALIDATE_SECRET` with the secret, for **Production** (and **Preview** if you also want to test preview deployments). Then redeploy (Deployments → the latest production deployment → ⋯ → Redeploy), so the running site has it.
3. **Create the webhook** at [sanity.io/manage](https://www.sanity.io/manage) → the Painter1 project (`al9no7gj`) → **API** → **Webhooks** → **Create webhook**:
   - **Name:** `Refresh site on publish`
   - **URL:** `https://painter1.vercel.app/api/revalidate` (after launch, the production domain, e.g. `https://www.painter1.com/api/revalidate`)
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **Filter:** `_type in ["location", "service", "warrantyTerms", "privacyPolicy", "estimateSurvey"]`
   - **Projection:** `{_type, "slug": slug.current, "previousSlug": before().slug.current}`
   - **Status:** enabled · **HTTP method:** POST · **API version:** the newest offered
   - **Drafts** and **Versions:** leave unticked (only published changes)
   - **Secret:** the secret from step 1
4. **Check it:** publish a small change in Studio, then open the page. In sanity.io/manage → the webhook → **Attempts log**, each publish should show status **200** and a body like `{"type":"location","revalidated":["location:knoxville","locations"]}`.
   - **401:** the secret in Vercel and on the webhook don't match, or the site wasn't redeployed after adding it.
   - **500 "SANITY_REVALIDATE_SECRET is not set":** the Vercel variable is missing.
