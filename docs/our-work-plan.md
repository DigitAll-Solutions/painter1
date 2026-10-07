# /[location]/our-work — plan

Contract template #5: "full project gallery, built to accommodate an interactive map later without a template rebuild".
Status: **built on branch `our-work`; the seed (`scripts/seed-our-work.ts`) is dry-run only until approved.** Decisions D1–D9 (agreed) are at the end.

## 1. What the live site has (verified in `docs/painter1-knoxville/`)

- **No Our Work page for Knoxville.** The nav item is **"Gallery"** and links to `#gallery`, an in-page section that is repeated on every Knoxville page (homepage and all 17 service pages). Nothing needs to be saved from the live site.
  - Header menu: Home · Residential Painting (submenus) · Commercial Painting · **Gallery** · About
  - Footer links: Schedule · Financing · About Us · Reviews · **Gallery** · Our Team · Warranty · Privacy Policy
  - The only `/our-work/` URL in the download is on the Inland Northwest cabinet page (`/inland-northwest/our-work/`), and we never use that.
- **The `#gallery` section:** h2 "Project Gallery", one intro line, and 16 photos with no captions.
  - Intro (161 characters): *"Discover the transformative power of color and craftsmanship from Painter1. Check out our project gallery below showcasing some of our most recent painting jobs!"*
- **Our header and footer already link "Our Work"** in the same positions as the live "Gallery" (after the services, before About). The homepage "See All Our Work" button also links to `/[location]/our-work`. All three currently 404, and they start working once the page exists. No nav changes are needed.

## 2. Knoxville photos

### 2.1 What's in Sanity now: `galleryImages`, 18 photos (Studio order)

| # | File | Size | Service tag | Pair | Caption fields | Verdict |
|---|---|---|---|---|---|---|
| 0 | Deck-Painting-Staining-Before-2.jpg | 800×600 | Exterior | before ↔ 1 | projectType only | ✅ Knoxville |
| 1 | Deck-Painting-Staining-After-2.jpg | 800×600 | Exterior | after ↔ 0 | projectType only | ✅ Knoxville |
| 2 | Commercial-…-Kadunza-Auto-Service-Before-Image-1.jpg | 900×600 | — (legacy "commercial") | before ↔ 3 | none | ✅ Knoxville (commercial) |
| 3 | Commercial-…-Kadunza-Auto-Service-After-Image-1.jpg | 900×600 | — (legacy "commercial") | after ↔ 2 | none | ✅ |
| 4 | Cabinet_Painting-1.webp | 800×800 | Cabinet | composite | none | ⚠️ see D1 |
| 5 | Painter1-of-Knoxville-Brick-Painting-…-After1.jpg | 1000×750 | Exterior | after (Before1 not in Sanity) | none | ✅ Knoxville |
| 6 | Cabinets-1.webp | 800×800 | Cabinet | composite | none | ⚠️ D1 |
| 7 | Painter1-of-Knoxville-Our-Recent-Painting-Work-Deck-Painting-Staining.jpg | 800×600 | Exterior | single | none | ✅ Knoxville |
| 8 | Exterior-2-2.webp | 800×800 | Exterior | composite | none | ⚠️ D1 (Arizona house) |
| 9 | Painter1-of-Knoxville-Deck-Staining-Before-After-Photos-C.ALLLENFINAL.jpg | **330×330** | Exterior | single | none | ✅ Knoxville, low resolution (D8) |
| 10 | Fireplace-Accent-1.webp | 800×800 | Interior | composite | none | ⚠️ D1 |
| 11 | Garage-Doors-1.webp | 800×800 | Exterior | composite | none | ⚠️ D1 (Arizona) |
| 12 | Painter1-of-Knoxville-Our-Recent-Painting-Work-Cabin-Painting-Staining.jpg | 800×600 | Exterior | single | none | ✅ Knoxville |
| 13 | Interior-2-1.webp | 800×636 | Interior | composite | none | ⚠️ D1 |
| 14 | Interior-3-1.webp | 800×800 | Interior | composite | none | ⚠️ D1 |
| 15 | Mesa-Ext-Before-After-1.webp | 800×800 | Exterior | composite | none | ⚠️ D1 (Arizona, "Mesa") |
| 16 | Commercial-…-Kadunza-Auto-Service-Before-Image-2.jpg | 900×600 | — (legacy "commercial") | before ↔ 17 | none | ✅ |
| 17 | Commercial-…-Kadunza-Auto-Service-After-Image-2.jpg | 900×600 | — (legacy "commercial") | after ↔ 16 | none | ✅ |

**Per service today (by tag):** Exterior 9 (3 of them Arizona), Interior 3 (all Arizona), Cabinet 2 (both Arizona), Commercial 4 (legacy tag only, no service document).

**Photos with no caption:** all 18 have no `title` or `caption`, and none has an `area`. Only #0 and #1 have a `projectType` ("Deck & Privacy Screen Staining"). The overlay rule (title, else "{projectType}, {area}") would show text on just those two. See D7.

### 2.2 Knoxville photos in the download but not in the gallery

| Photo(s) | Live page | In Sanity? | Proposed |
|---|---|---|---|
| Brick-Painting-…-Before1.jpg (1000×750) | homepage, brick, residential | no | Upload; pair with #5 (D2) |
| Interior-Painting-Before-2 / After-2 (800×600) | interior | yes, as the interior page's before/after slider | Add to the gallery as a pair (D2) |
| Exterior-House-Painting-Before-4-1 / After-4-1 (800×600) | exterior | yes, as the exterior slider | Add as a pair (D2) |
| Cabinet-Painting-Before-1 / After-1 | cabinet-painting | yes, as the cabinet slider | Add as a pair (D2) |
| Siding-Painting-After-1 (800×600) | home-siding | yes, as the #siding section photo | Not proposed (its Before failed to download) |
| Fence-Painting-Staining-Before-1 / After-1 | fence | no | Skip: pixel-identical to the deck pair #0/#1 |

Not used: franchise stock ("Painter1-Professional-Painting-Services-…", "Our-Painting-Services", "Who-We-Are"), blog covers, the coupon, the van, and anything from Inland Northwest.

### 2.3 Result with D1, D2 and D4

17 photos in 10 cards:

| Filter | Cards | Photos |
|---|---|---|
| Exterior | 6: deck & screen pair, house repaint pair, brick pair, deck, cabin, deck (low-res) | 9 |
| Interior | 1 pair | 2 |
| Cabinet | 1 pair | 2 |
| Commercial | 2 Kadunza pairs | 4 |

With only 10 cards, "Load more" (after 12) won't appear for Knoxville at launch. It will be tested with a lowered page size.

## 3. Data model (Sanity)

**Gallery photo** (`location.galleryImages[]`). Existing fields: alt, services, title, projectType, area, caption, legacy serviceType. New optional fields:

- `notLocalProject` (boolean, "Hide: not a local project"): hides the photo everywhere (homepage grid, service Recent Work, Our Work). Reversible in Studio (D1).
- `projectId` (string, e.g. `commercial-exterior-1`) and `role` (`before` | `after`)
  - Two photos with the same projectId, one before and one after, become **one card** with the BeforeAfterSlider.
  - Anything else (one photo, or two "after" photos) renders as separate tiles. Studio shows a warning.
  - A `pairWith` reference isn't possible: gallery photos are array items inside the location, not documents. See D4.
- `commercial` (boolean, "Commercial project"): drives the Commercial chip (D5).
- **Map-ready:** `city` (string; empty means the location's city) and `geo` (Sanity `geopoint`: lat/lng, plain number inputs with no Maps API key needed). `area` (neighbourhood) already exists.

**Location: new `ourWorkPage` object** (all optional, tokens `{city}` `{state}` `{owner}` allowed):

- `metaTitle`: default `Our Work in {City}, {ST} | Painter1 of {city}` (Knoxville: 49 characters).
- `metaDescription`: default (drafted, needs client approval) *"Before-and-after photos of recent interior, exterior, cabinet and commercial painting projects by Painter1 of {city}. Get your free estimate."* (Knoxville: 144 characters).
- `intro`: default is the live intro above, verbatim.

## 4. Page (top to bottom)

1. **Compact hero** (white/mist band, no photo):
   - breadcrumb Home › Knoxville › Our Work;
   - H1 **"Our Work in Knoxville, TN"**;
   - intro;
   - "Get My Free Estimate" via `getCta(location)` (no `?service`), plus a call button.
2. **Map slot** (reserved): `<WorkMap projects={…} />` renders nothing for now (§8).
3. **Gallery section**:
   - h2 "Project Gallery" (live heading);
   - chips (`All · Interior · Exterior · Cabinet · Commercial`; a chip with 0 cards is hidden), as a link group labelled "Filter projects by service" with `aria-current` on the active one;
   - grid of 1 / 2 / 3 columns;
   - an `aria-live` count ("Showing 10 projects");
   - "Load more" after 12 cards.
4. **Reviews strip:** `ServiceReviews` with `homepageReviews(location, 3)`, the same cards as service pages.
5. **Final CTA:** `CTASection` (the homepage's).

**Maintenance locations:** `notFound()`, and they're skipped in `generateStaticParams` and the sitemap.

## 5. Filtering: static pages, with or without JavaScript

- **Chips are plain links:** `/knoxville/our-work?service=interior` (values: `interior`, `exterior`, `cabinet`, `commercial`). "All" is `/knoxville/our-work`.
- **Without JS, the link loads the filtered page.** Reading `searchParams` would make the page render on every request (Next 16 docs: "Using it will opt the page into dynamic rendering"). Instead, `next.config.ts` rewrites matching query values (`has: [{ type: 'query', key: 'service', value: '(?<service>interior|exterior|cabinet|commercial)' }]`) to a prerendered `/[location]/our-work/[filter]`. All variants stay static with ISR, like every other page (D6).
  - Unknown values simply don't match, so the visitor gets "All".
  - A known filter with 0 photos also shows All.
- **With JS, the filter updates without a reload.**
  - The chip's click handler prevents navigation, filters on the client and updates the address bar with `history.replaceState`.
  - The URL stays shareable, and Back still leaves the page instead of stepping through filters.
- **All variants have the same canonical:** `/knoxville/our-work`. Only that URL goes in the sitemap.

## 6. Cards, lightbox, load more, performance

- **Photo card:**
  - fixed **4:3** frame, `object-cover` with the hotspot;
  - **title overlay reused from the service slider** (`slideTitle()`: title, else "{projectType}, {area}", on the same ink band);
  - the card is `<a href="{large image URL}">`. Without JS that opens the photo; with JS it opens the lightbox.
- **Pair card:**
  - the existing `BeforeAfterSlider` in the same 4:3 frame with the overlay;
  - an "Expand" button (top right) opens the lightbox; its no-JS fallback links to the "after" photo. Dragging the slider never opens the lightbox.
- **Lightbox:**
  - native `<dialog>` opened with `showModal()`, so the rest of the page is inert and focus stays inside;
  - Esc closes, ←/→ move between cards in the current filter, and focus returns to the card that opened it;
  - shows the photo at its natural shape (up to 1600px, fits the screen), or a large slider for pairs;
  - text: the title (else the alt text) and the caption if one exists;
  - arrow buttons are labelled, with "3 of 10" in the heading;
  - the large image is server-rendered but only mounted when opened, so the Sanity image builder stays out of the client bundle.
- **Load more:**
  - 12 cards, then a "Load more projects" button reveals 12 more; focus moves to the first new card and the count is announced;
  - no infinite scroll;
  - without JS, a `<noscript>` style shows every card and hides the button.
- **Images and layout:**
  - the first visible card is eager and preloaded (it's on a phone's first screen). Every other card's photos ship without `src`: the gallery's IntersectionObserver (200px margin) sets it as they approach, so nothing below the first screen downloads while the page paints. `<noscript>` copies show every photo without JavaScript;
  - the lightbox's large images stay `loading="lazy"`: React adds a `<link rel="preload">` for every non-lazy `<img>` it renders, and these are rendered on the server for every card;
  - fixed aspect ratios plus server-rendered hidden states mean **CLS 0**. Filtering and Load more only change layout right after a click, which doesn't count as layout shift.
- **Client JavaScript:** one small client component (filter state, load more, lightbox). Cards are server-rendered and passed in, the same pattern as `GallerySlider`.

## 7. SEO

- **Title and description:** per-location override (`ourWorkPage`), else the defaults above, with tokens filled.
- **Open Graph image:** the first card's photo.
- **JSON-LD:**
  - `BreadcrumbList` (Home › Knoxville › Our Work);
  - `ImageGallery` (name, url, provider = the location's LocalBusiness node) with one `ImageObject` per photo: `contentUrl`, `width`/`height`, `name` (overlay text), `caption`, `description` (alt), and `contentLocation` (`Place`: area, `addressLocality` = city or the location's city, `addressRegion`, plus `GeoCoordinates` when `geo` is set).
  - Google shows no rich result for ImageGallery. It's for semantics and AI and search crawlers.
- **Sitemap:** `/[slug]/our-work` for non-maintenance locations (monthly, 0.7). Filter variants aren't listed.

## 8. Map-ready

- **Data:** each photo can carry `area`, `city` and `geo`. Pairs share one pin through `projectId`.
- **Slot:** `components/our-work/WorkMap.tsx` exports `type WorkMapProject = { key, title, area?, city?, geo?: { lat, lng }, services, href }` and a component that returns `null`. The page already builds the project list and renders the slot above the gallery.
- **Adding the map later:** fill that one component (and add a Maps key). The template, query and schema stay as they are.

## 9. Other changes

- **Homepage "Our Work" grid:** the first 6 shown photos, skipping hidden photos, `before` photos (pairs show their after shot) and the homepage transformation slider's own pair (brick).
- **Service-page Recent Work:** skips hidden photos and the photos already in that page's own before/after slider, so nothing appears twice on a page.
- **Impact on service pages:**
  - Interior loses its Recent Work section: its 3 photos were all Arizona, and its only local pair is the page's own slider. The section needs 3+.
  - Exterior shows 7 photos.
  - Cabinet stays hidden (same reason as Interior).

## 10. Seed: `scripts/seed-our-work.ts` (dry run first, then stop for "apply")

1. **(D1)** Tick "Hide: not a local project" on the 8 Dec-2023 composites, each with its reason in the dry run. Nothing is deleted.
2. **(D2)** Add Brick Before1 (already in Sanity as the homepage slider's "before") and the interior, exterior-house and cabinet slider pairs, reusing their existing assets. No uploads.
3. **Pairs:** set `projectId`/`role` on deck & screen (`deck-privacy-screen`), Kadunza 1 and 2, brick, interior, exterior house, and cabinet.
4. Set `commercial: true` on the 4 Kadunza photos. They stay untagged, so they don't appear on service pages, same as today.
5. **(D7)** Set `projectType` from the live file names, marked in the dry run as "from live file name, needs client confirmation":
   - Commercial Exterior Painting (Kadunza);
   - Brick Painting;
   - Deck Painting & Staining;
   - Cabin Painting & Staining;
   - Deck Staining;
   - Exterior House Painting;
   - Interior Painting;
   - Cabinet Painting.

   `area` stays empty: there's no neighbourhood information anywhere in the download.
6. **Studio order (D3):** sorted by the live upload month in the image URL path, newest first:
   - 2025/11 Kadunza ×2;
   - 2025/09 deck & screen, deck, cabin, house repaint, interior, cabinet;
   - 2025/05 brick;
   - 2025/04 deck (low-res).

## 11. Checks (after build)

- Typecheck, lint, tests, build.
- At 360 and 1440px: axe 0, no horizontal scroll, CLS 0 (layout-shift observer).
- **Without JS:** chips load the filtered static page, every card is visible, and photo links open the image.
- **With JS:** a chip filters without a navigation and the URL updates; Load more works (page size lowered for the test).
- **Lightbox:** opens from the keyboard, Tab stays inside, Esc closes, arrows navigate, focus returns to the card.
- **Lighthouse mobile** on `/knoxville/our-work`.
- **SEO:** JSON-LD parses, the sitemap has the entry, canonical is the same on all variants.
- **Routing:** an unknown location 404s. The maintenance 404 is checked in code, because no maintenance location exists in the dataset.
- **Regression:** homepage and service pages (axe, horizontal scroll).
- **Screenshots** to `docs/screenshots/our-work/`.

## 12. Decisions (agreed)

| # | Decision |
|---|---|
| D1 | Don't delete the 8 Dec-2023 composites: tick **"Hide: not a local project"** (`notLocalProject`) on each, with the reason listed in the dry run. Flagged photos are excluded everywhere (homepage grid, service Recent Work, Our Work), and this can be undone in Studio. |
| D2 | Add the interior, exterior-house and cabinet slider pairs and Brick Before1 to the gallery as pairs. A service page's Recent Work skips photos already in that page's before/after slider. The homepage grid likewise skips its own slider's photos and any "before" photo. |
| D3 | Studio order = newest first. The initial order comes from the live upload months. |
| D4 | `projectId` + `role` (before/after). |
| D5 | A "Commercial project" checkbox (`commercial`). |
| D6 | Rewrite `?service=` to the prebuilt `/[location]/our-work/[filter]` pages. |
| D7 | `projectType` from the live file names; `area` left empty; Kadunza isn't named in captions until the client confirms. |
| D8 | Keep the 330×330 deck photo. |
| D9 | Branch `our-work` from `main` (batch-2 is merged). The first commit is the `.gitignore` change. |

## Files

- `app/[location]/our-work/page.tsx` (All) and `app/[location]/our-work/[filter]/page.tsx` (rewrite target); both render `components/our-work/OurWorkPage.tsx`.
- `components/our-work/`:
  - `OurWorkHero`;
  - `OurWorkGallery` (client: chips, Load more, lightbox);
  - `WorkCard` (grid card + large view);
  - `WorkMap` (reserved slot).
- `components/Breadcrumbs.tsx`, shared with `ServiceHero`.
- `lib/`:
  - `work-cards.ts`: pairing, filters, chips (tested in `work-cards.test.ts`);
  - `our-work.ts`: copy defaults, JSON-LD, large image URL;
  - `our-work-filters.ts`: filter keys, also read by `next.config.ts`;
  - `gallery.ts`: hidden-photo filter, overlay text, slider de-duplication.
- `next.config.ts` (rewrite), `app/sitemap.ts`, `app/[location]/page.tsx` (homepage grid), `app/[location]/[service]/page.tsx` (Recent Work), `components/service/RecentWork.tsx`.
- `sanity/schemas/location.ts` (gallery fields, `ourWorkPage`), `sanity/lib/{queries,types,fetch}.ts`.
- `scripts/seed-our-work.ts`.
