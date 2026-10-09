# Sanity Studio for 37 locations — audit and plan

One Studio (`/studio`), one dataset (`production`). The client's internal team edits; franchisees don't.
Status: **built on branch `studio-structure`; data migration (`scripts/migrate-studio.ts`) runs dry first, then on approval.** Decisions S1–S8 (agreed) are at the end.

## 1. Audit

### 1.1 Files

| File | What it does |
|---|---|
| `sanity.config.ts` | `basePath: '/studio'`, `structureTool({structure})`, `visionTool` (for every user), singleton rules (no create, only publish / discard / restore), and hides `leadSettings` and `lead` from the "new document" menu |
| `sanity/structure.ts` | The whole desk: one flat list (§1.2) |
| `sanity/schemas/index.ts` | 14 types; `singletonTypes` = franchisePage, locationsPage, franchiseOpportunities, privacyPolicy; `noCreateTypes` = leadSettings, lead |
| `sanity/schemas/*.ts`, `objects/*.ts` | The type definitions (§1.3) |
| `app/studio/[[...tool]]/page.tsx` | `NextStudio`, `force-static`, re-exports `next-sanity/studio` `metadata` / `viewport` |

Versions: `sanity` 5.31.2, `next-sanity` 13.3.4.

### 1.2 Desk today

```
Content
├─ Locations                     all location documents, flat list (preview subtitle: "growth")
├─ Services                      3 service documents
├─ Estimate survey               → Default survey (fixed ID) · All surveys
├─ Lead recipients               → every location → its private leads.<location id> document
├─ Leads                         every lead, newest first (no grouping or filter by location)
├─ Corporate Homepage            singleton (no document exists)
├─ Locations Directory           singleton (no document exists)
├─ Franchise Opportunities       singleton (no document exists)
└─ Privacy Policy                singleton (privacy-policy)
+ Vision (GROQ playground) tool for every user
```

### 1.3 Document types

| Type | Kind | In dataset | Used by the site | Groups | Fields without description |
|---|---|---|---|---|---|
| `location` | document | 1 (Knoxville) | every location page | basics★, owner, content, services, media, reviews, scheduling, leads, legal, seo | 59 of 121 (31 of 63 top-level) |
| `service` | document | 3 | service pages, Our Work filters | basics★, transformation, process, paint, faq | 9 of 27 |
| `estimateSurvey` | document | 1 (`estimate-survey-default`) | free-estimate page | project★, contact, general | 15 of 39 |
| `leadSettings` | private document `leads.<location id>` | 1 | lead delivery (recipients) | — | 0 of 1 |
| `lead` | private document `lead.<uuid>` | 2 (QA/test) | written by the estimate form | — | 39 of 47 (all read-only) |
| `privacyPolicy` | singleton | 1 | `/[location]/privacy-policy` | — | 1 of 3 |
| `franchisePage` "Corporate Homepage" | singleton | **0** | **none**: `/` redirects to `/knoxville`; no query reads it | — | 8 of 9 |
| `locationsPage` "Locations Directory" | singleton | **0** | **none** | — | 4 of 4 |
| `franchiseOpportunities` | singleton | **0** | **none** | — | 11 of 12 |
| objects: `serviceDetail`, `pageSection`, `blockContent`, `boldText`, `consentText` | — | — | — | — | serviceDetail 13 of 26, pageSection 3 of 4 |

**Corporate singletons:** all three are placeholders for pages that don't exist yet.

| Singleton | Fields | Required |
|---|---|---|
| Corporate Homepage | `heroHeadline`, `heroSubheadline`, `heroImage` (alt), `ctaLabel`, `ctaUrl`, `sections[]` (heading / rich body / image), `metaTitle`, `metaDescription` | `heroHeadline` |
| Locations Directory | `title`, `intro`, `metaTitle`, `metaDescription` | `title` |
| Franchise Opportunities | the same hero/CTA fields as the Corporate Homepage, plus `benefits[]` (title / description), `sections[]` and meta | — |

None of them has a document, a route or a query. Almost none of their fields has a description.

### 1.4 The location document (what an editor sees opening Knoxville)

- **10 tabs**, Basics first: name, slug, type, tagline, phone, email, address (4 sub-fields), service area, service cities (11), business hours, social links (5).
- **63 top-level fields; Knoxville fills 50.** Empty: owner quote attribution, the three project counts, hero video, survey reference (falls back to the default survey, which is fine), all six warranty-section overrides, Our Work page overrides.
- **Services tab:** three nested `serviceDetail` objects of about 14 fields each, opened one inside another. It's the densest part of the form.
- **Images tab:** a 25-photo gallery. The previews now show the hide / commercial / before-after flags.
- **List preview:** "Painter1 of Knoxville / growth" with the owner photo. City and state don't show, so 37 near-identical "Painter1 of …" rows will be hard to scan.

**Required today:** `name`, `slug`, `locationType`, plus every image's alt text and a few nested titles. Fields that the pages rely on are **not** required:
- **`address.city` / `address.state`:** the H1, titles, tokens and the planned grouping by state all use them; titles fall back to the location name.
- **`services.<key>.title`:** without it the header nav shows the raw key, a lowercase "interior". This is a broken nav item on a new location.
- **`phone`, `email`, `heroImage`, `ownerName`:** sections hide or fall back without them, but the page looks unfinished.

**Fields no page reads:**
- **About-page fields** (`ownerBio`, `whyChooseUs`, `aboutSections`): the About page isn't built yet.
- **`schedulingUrl`:** `hasScheduling` only changes the CTA label.
- **`privacyPolicy`:** a hidden legacy field.
- **`galleryImages[].serviceType`, `reviews[].serviceTag`:** hidden legacy tags.

**Problems that will bite with 36 new locations:**
1. **Slug generated from `name`:** "Generate" on "Painter1 of Maryville" gives `painter1-of-maryville`, but the live URLs are `painter1.com/maryville/`. There's no format rule, no reserved words, and nothing stops the slug changing after launch.
2. **Leads point at the location by slug** (`lead.location` is a string). Renaming a slug orphans its leads and breaks every live URL.
3. **Consent text hard-codes "Painter1 of Knoxville"** (both blocks). Copied to a new location, it would put the wrong business name on that location's legal consent, and the lead records would store that wrong text.
4. **No initial values for a new location:** no service titles, no consent blocks, no lead email subject/template.
5. **Leads can't be found by location:** one flat list for 37 locations.
6. **Vision is open to every user,** and it runs GROQ with the user's own permissions.

### 1.5 /studio route, CORS, users

- **noindex:** `next-sanity/studio` metadata sets `robots: noindex` and `referrer: same-origin`, and `app/robots.ts` disallows `/studio`. Together that's sufficient.
- **CORS** (checked from the API's responses, since our token can't list origins): `http://localhost:3000`, `http://localhost:3333` and `https://painter1.vercel.app` are allowed with credentials; **`https://www.painter1.com` and `https://painter1.com` are not** (go-live item, §2.7).
- **Members:** the API doesn't return names to this token, so nothing to mask.

  | Member | Role |
  |---|---|
  | Human 1 | administrator |
  | Human 2 | administrator |
  | Robot (our write token) | editor |
  | Robot (our read token) | viewer |

- **Roles available on the project:** administrator, editor, contributor, viewer, developer, deploy-studio, access-manager, blueprints-deployer.

## 2. Proposal

### 2.1 Desk structure

```
Content
├─ Locations
│   ├─ Onboarding overview          table: every location, its state, launch-checklist score, what's missing (§2.3)
│   ├─ Alabama … Washington         one item per state that has locations (from address.state), A→Z
│   │   └─ Painter1 of Knoxville    folder:
│   │       ├─ Location details     the document; views: Edit · Launch checklist · Pages
│   │       ├─ Lead recipients      private leads.<location id> (count shown, never in previews)
│   │       ├─ Leads                this location's leads, newest first
│   │       └─ Live pages           links: home, 3 services, Our Work, free estimate, privacy
│   └─ All locations (A→Z)          flat list, for search
├─ Shared
│   ├─ Services                     the 3 service documents
│   ├─ Estimate survey              Default survey · All surveys
│   └─ Privacy Policy
├─ Corporate                        each marked "Not on the site yet" until its page exists
│   ├─ Corporate Homepage
│   ├─ Locations Directory
│   └─ Franchise Opportunities
└─ All leads                        newest first · "By location" sub-lists · "Test leads" (testMode)
```

- **States:** state items are built from the data (async structure child). A location without a state shows under "No state set", which the checklist also flags.
- **Location folders and leads:**
  - Each location's "Leads" list filters on `location == <slug>`.
  - "All leads" gets per-location sub-lists, because Studio lists have search but no field filter.
- **Hidden:**
  - Vision for everyone except administrators (`tools` filtered by the current user's role).
  - `lead` and `leadSettings` in the "new document" menu (already the case).
  - Legacy fields stay hidden.
  - The old top-level "Lead recipients" list goes; it moves into each location folder.

### 2.2 "Open page"

- **A document action, "Open page"** (also in the `…` menu), opens the published URL on the **same origin as the Studio**. On painter1.vercel.app it opens Vercel pages; on www.painter1.com it opens production.

  | Document | Page it opens |
  |---|---|
  | Location | `/<slug>` |
  | Service | a picker: `/<location>/<service slug>` for each location |
  | Privacy Policy | `/<first location>/privacy-policy` |
  | Survey | `/<location>/free-estimate` |
  | Corporate singletons | disabled: "No page yet" |

- **A "Pages" view on locations and services** lists every live URL the document feeds, as links.
- **It shows published content.** Previewing unpublished drafts needs Next draft mode plus the Presentation tool; that's a separate, larger feature (S8).

### 2.3 Launch checklist (per location) and Onboarding overview

A "Launch checklist" document view, computed from the document being edited plus the private lead-recipients document (only its recipient **count** is shown). Each item has a status and a "Go to field" link:

| Area | Item | Level |
|---|---|---|
| Basics | name; slug valid (§2.5); city + state; phone; email; street address; ≥1 service city; business hours | required: name, slug, city, state, phone · recommended: the rest |
| Owner | owner name; owner photo; owner bio (for About); team members (if owner-with-team) | recommended |
| Homepage | hero image; transformation before + after; intro | recommended |
| Services | title for interior / exterior / cabinet (nav labels); before/after pair per service | required: titles · recommended: pairs |
| Photos | local photos per service (Recent Work needs ≥3 not counting that page's slider pair; Our Work chip needs ≥1); "not a local project" photos listed | recommended |
| Reviews | ≥3 HTML reviews; rating + count; Trustindex widget ID | recommended / optional |
| Leads | lead recipients ≥1 (count only); consent blocks present **and naming this location** (flags "Painter1 of Knoxville" text on another location); lead email subject + template | required |
| SEO | meta title / description (optional: automatic values exist) | optional |
| Maintenance | home + About items only | — |

**Onboarding overview** (top of Locations): one row per location showing name, state, type, required count missing, recommended count missing, and recipients yes/no. This is the team's progress board for the M3 migration.

### 2.4 Field hygiene

- **Tabs, in this order:** Basics · Owner & team · Homepage · Services · Photos · Reviews · Leads & consent (scheduling folds in here) · Warranty · SEO. Inside Basics, fieldsets: Contact, Address, Service area, Social links. Field order follows the page from top to bottom.
- **A description on every field** an editor can see: about 31 top-level location fields, plus nested service-detail, review, team and corporate fields. Each says where it shows on the site, its format or limit, and what happens if it's left empty.
- **Required vs warnings:**
  - **Errors** (they block publishing): only where the page breaks or misleads: `name`, `slug`, `locationType`, `address.city`, `address.state` (list of US states), `services.*.title`, and consent block names/bodies.
  - **Warnings** (they never block publishing, so half-finished migrated locations can still be saved and published): `phone`, `email`, hero image, owner name/photo, and the other checklist items.
- **List preview:** "Painter1 of Knoxville", subtitle "Knoxville, TN · Growth".
- **Slug:** generated from the **city**, not the name (§2.5).

### 2.5 "New location" flow

1. **Start:** Locations → state (or "All locations") → **New location**: an initial-value template that pre-fills:
   - `locationType: growth`, the owner defaults that exist today, `heroSubtitleVariant: auto`, `hasScheduling: false`;
   - service titles "Interior Painting", "Exterior Painting", "Cabinet Refinishing";
   - Knoxville's lead email **subject and template** (they contain nothing Knoxville-specific; only `{inputs.*}` placeholders) and confirmation message;
   - the two **consent blocks** written with a `{locationName}` placeholder (S1).

   The survey reference stays empty, which means the default survey.
2. **Fill:** the editor types the name, city and state, then clicks Generate. The slug comes from the city ("Maryville" → `maryville`).
3. **Slug validation:**
   - required;
   - `^[a-z0-9]+(-[a-z0-9]+)*$`;
   - unique among locations (drafts included);
   - not reserved: `studio`, `api`, `_next`, `sitemap.xml`, `robots.txt`, `locations`, `franchise-opportunities`, `about`, and any other corporate route;
   - a **warning** when it isn't on the list of live location slugs (S2).
4. **Slug lock after first publish (S6):** read-only for non-administrators, with a description explaining that changing it breaks live URLs and lead links.
5. **Lead recipients:** the folder's "Lead recipients" item opens the fixed-ID private document. It's created on first publish, and the checklist stays red until it has a recipient.
6. **Finish:** the checklist and overview show what's left. A location can be published early; pages hide empty sections.

### 2.6 Roles and plan limits

| Who | Role | Can |
|---|---|---|
| Client content leads (1–2 people) | **Editor** | create / edit / publish everything, incl. leads and recipients |
| Other client staff (if their edits need review) | **Contributor** | edit drafts, can't publish (S3) |
| Read-only stakeholders | **Viewer** | read everything, **including leads (personal data)** |
| Us + the client's account owner | **Administrator** | members, CORS, tokens, datasets |
| Robots | editor (server writes) · viewer (reads) | unchanged |

- **Built-in roles are dataset-wide.** Limiting someone to one location, or hiding leads from a role, needs custom roles / content-resource permissions, which Sanity sells only on its Enterprise plan. With the brief's "franchisees won't edit", built-in roles are enough (S4).
- **The "private" lead documents** (dot IDs) are hidden from the public API, not from project members. Every member, Viewers included, can read leads in the Studio.
- **Plan limits:** seat counts, available roles and SSO depend on the project's plan. Confirm under Manage → Plan before inviting the team; I couldn't read the plan with our token.

### 2.7 Launch checklist additions (go-live)

- **Register the Studio** for `https://www.painter1.com` (Manage → Studios), and add `https://www.painter1.com` to **CORS origins with credentials allowed**. Add `https://painter1.com` too if the apex domain serves pages; keep `https://painter1.vercel.app` and `http://localhost:3000`.
- **Preview deployments:** only add a CORS pattern scoped to this project's preview URLs, never `https://*.vercel.app` with credentials.
- **Invite the client team** with the roles agreed in S3–S4. Remove or downgrade anyone who no longer needs access.
- **Rotate the editor write token** if it was ever shared outside Vercel and `.env.local`.

## 3. Decisions (agreed)

| # | Decision |
|---|---|
| S1 | Consent blocks use a `{locationName}` placeholder, filled with the location's name on the form **and** in the stored lead consent record (`lib/consent.ts`, used by both). Knoxville's two blocks are migrated to the placeholder; the dry run proves the filled text, its SHA-256 and the block structure are identical to before. |
| S2 | The client's list (`docs/reference/locations.csv`, gitignored) feeds the slug check: `scripts/sync-location-slugs.ts` writes only the slugs to `sanity/lib/known-location-slugs.ts`, and the Studio warns when a slug isn't in it. The script also compares the CSV with the live `/locations/` page (saved as `docs/painter1-knoxville/pages/locations.html`) and the count of 37. |
| S3 | **Editor** for the client's team; **Contributor** available for anyone whose changes need review. |
| S4 | Accepted: **every Studio member can read leads** (names, emails, phones, addresses), whatever their role. Give Studio access only to people allowed to see lead data. Also in `docs/cms-guide.md`. |
| S5 | Corporate singletons stay under Corporate, titled "(not on the site yet)", with descriptions. |
| S6 | Slug read-only for non-administrators once the location is published. |
| S7 | Errors only for page-breaking fields; everything else is a warning and a checklist item. |
| S8 | "Open page" opens the published page; draft preview is a separate task. |
| Extra | Leads reference their location by **document ID** (a reference), not the slug, so a URL change keeps them attached. Existing leads are migrated; the per-location lead lists filter on the reference. |

## 4. Files

- `sanity/structure.ts`: rewritten (§2.1). New `sanity/structure/` helpers:
  - states list;
  - location folder;
  - leads lists;
  - Live pages pane;
  - Onboarding overview pane.
- `sanity/components/`:
  - `LaunchChecklist.tsx` (document view);
  - `PagesView.tsx`;
  - `OnboardingOverview.tsx`;
  - shared `checklist.ts` rules (unit-tested, the same rules the overview uses).
- `sanity/actions/openPage.ts` (document action); `sanity.config.ts`:
  - actions;
  - "New location" template;
  - `tools` filtered by role (Vision).
- `sanity/schemas/location.ts`:
  - tabs and fieldsets;
  - descriptions;
  - required rules and warnings;
  - US state list;
  - slug rules and lock;
  - preview.

  Plus descriptions in `service.ts`, `serviceDetail.ts`, `estimateSurvey.ts` and the corporate singletons.
- **S1:** consent rendering and the lead consent record (`components/estimate/*`, `app/[location]/free-estimate/actions.ts`), with a test.
- **No data migration** apart from optional S1 for Knoxville; existing fields keep their names.

## 5. Post-merge steps (in this order)

1. **After the merge has deployed** (the production deployment runs the code that fills `{locationName}`), migrate the consent text:
   ```
   node --env-file=.env.local scripts/migrate-studio.ts --only=consent --dry-run
   node --env-file=.env.local scripts/migrate-studio.ts --only=consent
   ```
   The dry run must say "filled = original: yes" and "(same)" for every SHA-256; the script refuses otherwise.
2. **Then re-run the whole script** to catch any lead written by the old code (location stored as a slug) between this branch's lead migration and the deploy:
   ```
   node --env-file=.env.local scripts/migrate-studio.ts --dry-run
   node --env-file=.env.local scripts/migrate-studio.ts
   ```
   A second dry run afterwards should report 0 documents to change.
3. **Location list:** when the client corrects the CSV (see §6), save it in `docs/reference/` (gitignored), run `node scripts/sync-location-slugs.ts` and commit the regenerated `sanity/lib/known-location-slugs.ts`.

## 6. Location list check (client CSV vs live /locations/)

`scripts/sync-location-slugs.ts` on `docs/reference/Painter1 locations.csv` and the saved live page:

- **The CSV lists 35 locations, not 37:** 22 growth and 13 maintenance.
- **Invalid or odd rows:**
  - Columbus and Central Florida use `painter.com/…`, not painter1.com;
  - Park City's URL is `Park-city` (uppercase; used as `park-city`);
  - "Painter1 Inland Northwest" is missing "of";
  - "Painter1 of Raleigh " has a trailing space.
- **Duplicates:** none.
- **In the CSV but not on the live page (5):**
  - `miami`, `scottsdale`, `bozeman`: not on /locations/ yet;
  - `charloote-metro`: probably a typo, since the live page has `charlotte-metro` with the same name;
  - `south-atlanta`: the live URL is `southatl` ("Painter1 of South Atlanta").
- **On the live page but not in the CSV (21):** atlanta, baldwin-county, bayou-city, boise, charlotte, charlotte-metro, chattanooga, cincinnati-metropolitan, fayetteville, jupiter, lowcountry, montgomery-county, nampa-meridian, nashville, new-england, orlando, pompano-beach, portland, southatl, the-triangle, washington-dc ("The DMV").
- **The known-slug list keeps the CSV exactly as given (35 slugs).** So until the client confirms, the Studio would warn on `charlotte-metro` and `southatl` (the live URLs) and accept `charloote-metro` and `south-atlanta`.

**Update (Oct 8): the client's new list, `docs/reference/Painter1 URLs.csv`, replaces the CSV above.**
- **36 usable locations** (37 rows):
  - 30 full tier: every column marked.
  - 6 basic tier: marietta, bayou-city, southatl, central-florida, coastal-carolina, portland. Their rows mark only "Home Page" and "Free Estimate"; Service Pages, About Page, Our Work and Warranty are blank.
- **North Georgia** is listed with `/main-line/`, the same URL as Main Line, so it's dropped until the client corrects it. The live page and the old CSV have `/north-georgia/`.
- **Fixed since the old CSV:** `charlotte-metro` and `southatl` (the live URLs).

## 7. M3 notes (location migration)

- **301 redirects at launch for live locations not on the client's list.** These 18 locations are on the live /locations/ page but not in `Painter1 URLs.csv`. Without redirects, old links, bookmarks and search rankings hit a 404. Redirect each `/<slug>/` and everything under it (`/<slug>/:path*`) to `/locations`, or to a successor location if the client names one:
  - atlanta, baldwin-county, boise, charlotte, chattanooga, cincinnati-metropolitan
  - fayetteville, jupiter, lowcountry, montgomery-county, nampa-meridian, nashville
  - new-england, north-georgia, orlando, pompano-beach, the-triangle, washington-dc ("The DMV")
- **Confirm the list with the client first:** some may simply be missing from the CSV (north-georgia certainly is; see §6).
- **Until `/locations` exists** (corporate pages, docs/corp-pages-plan.md), the redirects need a temporary target. Agree that target with the client.
- **Also redirect at launch:** basic-tier locations' old service, About, Our Work and warranty URLs (these pages don't exist for the basic tier) to the location's home page.
- **Go-live redirects for renamed and merged pages** (every location; `:location` = the location slug). The full live-URL table is in `docs/scope-audit.md`.

| From | To | Status | Where |
|---|---|---|---|
| `/:location/cabinet-refinishing` | `/:location/cabinet-painting` | **in code now** (308, `next.config.ts`) | slug renamed Oct 9 |
| `/:location/cabinet-painting/` (live WordPress URL) | `/:location/cabinet-painting` | automatic (trailing slash) | same page |
| `/:location/cabinet-painting-and-refinishing/` (live) | `/:location/cabinet-painting` | add at launch | second live cabinet URL |
| `/:location/home-siding-painting/` (live) | `/:location/exterior-painting#siding` | add at launch | Siding section |
| `/:location/stucco-painting/` (live) | `/:location/exterior-painting#stucco` | add at launch | Stucco section |
| `/:location/brick-painting/` (live) | `/:location/exterior-painting#brick` | add at launch | Brick section |
| `/:location/deck-painting-and-staining/` (live) | `/:location/exterior-painting#decks` | add at launch | Decks section |
| `/:location/fence-painting-and-staining/` (live) | `/:location/exterior-painting#fences` | add at launch | Fences section |
