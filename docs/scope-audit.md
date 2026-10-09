# Scope audit — repo vs. brief and proposal

Audited 2026-10-06 against `main` @ `8fc72a4` (PR #8 merged).
Sources: `docs/contract/painter1-nextjs-project-brief.pdf` (client brief, 28 Aug 2026), `docs/contract/Painter1-Proposal-Sagar-Bharvadiya.docx` (signed proposal, 29 Aug 2026, $5,500 fixed, 3 phases), features agreed in chat, Knoxville data in Sanity, `docs/painter1-knoxville/` (live-site download).

Legend: **✅ done** · **🟡 partial** · **❌ missing**

> The brief and proposal live in `docs/contract/`. That folder and the duplicate `painter1-nextjs-project-brief.pdf` in the repo root are **gitignored** (`.gitignore` lines 49–50); git history shows they were never committed.

## Summary

- **Page templates:** 2 of 10 done, 1 partial (Cabinet Refinishing: template exists, but no service document so it 404s), 7 missing.
- **Agreed features:** structured data and alt text are solid. Scheduling, meta overrides and the hero video's mobile handling are partial.
- **Performance:** Lighthouse mobile Performance 91–93, but **LCP 3.1–3.2s**, so the promised sub-2s is **not met**.
- **Deliverables not started:** the 301 redirect map and the data schema / CMS setup document.

## 1. Page templates (10 per location)

Every location should get all 10 (brief §3; proposal "Page Templates (10)"). Nav and footer links to the missing pages currently 404.

| # | Template | Status | Route | What Knoxville gets today | Files / notes |
|---|---|---|---|---|---|
| 1 | Homepage | ✅ done | `/[location]` | Full page: hero, transformation, owner (team variant), services, How It Works, reviews (Trustindex + HTML), gallery, stats, warranty band, service areas, CTA | `app/[location]/page.tsx`, `components/home/*`. **Root `/` is still the create-next-app starter page** (`app/page.tsx`) on the public preview. The brief lists "Homepage (/)" first; decide whether `/` is a corporate homepage (`franchisePage` singleton exists, no route) or a redirect |
| 2 | Interior Painting | ✅ done | `/[location]/[service]` → `interior-painting` | Hero (stock fallback photo), before/after slider, compact owner card, process + warranty banner, What We Paint, Recent Work slider (3), reviews, FAQ, CTA | `app/[location]/[service]/page.tsx`, `components/service/*`, `service` doc `service-interior-painting` |
| 3 | Exterior Painting (absorbs Siding & Stucco) | 🟡 partial | same → `exterior-painting` | Same template; Siding and Stucco appear only as What We Paint cards. **The Siding and Stucco sub-sections are not rendered**: Knoxville has them in `services.exterior.subServices` (Home Siding Painting ~250 chars, Stucco Painting ~130 chars), but nothing displays `subServices` | Render `subServices` as sections or tabs on the service page. Schema: `sanity/schemas/objects/serviceDetail.ts` |
| 4 | Cabinet Refinishing | 🟡 partial | same → `cabinet-refinishing` | **404**: no `service` document. Nav and footer link to it. Location data exists (`services.cabinet`: description, highlights, before/after) | Needs a `service-cabinet-refinishing` doc (seed) with copy |
| 5 | Our Work (map-ready) | ❌ missing | `/[location]/our-work` | 404. Homepage "See All Our Work" links here. Data exists: 18 gallery images with service tags and captions | Build with the gallery and map as separate regions (e.g. a `<WorkMap>` slot fed by optional per-image coordinates) so a map can be added later without a template rebuild |
| 6 | About Us / Owner | ❌ missing | `/[location]/about-us` | 404. Nav links here (also the only page besides home for maintenance locations). Data exists: `ownerBio`, 6 `aboutSections`, team members, owner photos | — |
| 7 | Warranty | ❌ missing | `/[location]/warranty` | No page; warranty links fall back to `/knoxville#estimate`. Data exists: `warranty` rich text (22 blocks) | `getWarrantyHref` in `lib/location.ts` |
| 8 | Reviews | ❌ missing | `/[location]/reviews` | No page. Data: 10 HTML reviews, Trustindex ID, rating/count | Review schema helpers exist (`lib/reviews.ts`) |
| 9 | Free Estimate / Survey | ❌ missing (planned) | `/[location]/free-estimate` | **404, and every CTA on the site points here** (`getCta`, `lib/location.ts`) | Plan: `docs/estimate-page-plan.md` (version B decided) |
| 10 | Privacy Policy | ❌ missing | `/[location]/privacy-policy` | 404; footer links here (plus `#do-not-sell`). Data exists: `privacyPolicy` rich text (180 blocks) | — |

## 2. Features agreed in chat

| Feature | Schema | Rendering | Status | Notes / files |
|---|---|---|---|---|
| **Online scheduling toggle**: CTAs switch to "Schedule Estimate" and go to a standalone booking page with the location's calendar | ✅ `hasScheduling`, `schedulingUrl` (`sanity/schemas/location.ts`) | 🟡 `getCta()` switches the **label** to "Schedule Your FREE Estimate" (header, hero), but the **href is always `/free-estimate`**. Floating tab, mobile bar and service-page CTAs use fixed "Free Estimate" labels. No booking page exists | 🟡 partial | The schema description promises "links to the scheduling URL", but the code doesn't do that. Missing: a `/[location]/schedule` page embedding the location's calendar, and `getCta()` routing there when on. **Knoxville's `schedulingUrl` is the WordPress Simply Schedule Appointments endpoint (`painter1.com/wp-json/ssa/…`); it dies with WordPress** (see estimate plan L9) |
| **Hero video** per location, image as poster/fallback, no performance hit | ✅ `heroVideo` (mp4/webm) | 🟡 `components/HeroSection.tsx`: autoplay/muted/loop/playsinline, poster from the hero image, image used when no video | 🟡 partial | Performance risks: the video autoplays on phones (no `preload="none"`, no mobile/data-saver/reduced-motion guard); the poster is a single 1600px URL (not responsive, not preloaded), so with a video the LCP image loses its preload. Knoxville has no video, so this is untested on real data |
| **Growth vs maintenance**: maintenance gets homepage + About only; service cards don't link | ✅ `locationType` | ✅ nav (`getNavLinks`), service cards unlinked (`ServicesGrid`), footer links trimmed, warranty band hidden, service pages and sitemap entries 404/omitted | 🟡 partial | Logic is complete, but **About doesn't exist**, so maintenance sites currently have a homepage only |
| **TrustIndex widget ID** per location (no ID → section hidden) | ✅ `trustindexWidgetId` | 🟡 `components/home/ReviewsSection.tsx` + `TrustindexWidget.tsx` (lazy-loaded on scroll) | 🟡 differs by design | Without an ID the section still shows the Sanity HTML reviews (added in revision round 3 for SEO). It hides only when there is neither an ID nor reviews. Confirm with the client that this replaces "no ID → hidden" |
| **Meta title/description**: auto-generated, per-page override | ✅ `metaTitle`, `metaDescription` (location); `metaDescription` (service doc) | 🟡 Homepage title: override or auto (`pageTitle()`), but **description has no auto fallback** (empty when the field is blank). Service pages: auto title and tokenised description from the service doc, **no per-location / per-page override** | 🟡 partial | `app/[location]/page.tsx`, `app/[location]/[service]/page.tsx`, `lib/seo.ts` |
| **Image alt required** on every image field | ✅ every image field across `location`, `service`, `serviceDetail`, `pageSection`, `franchisePage`, `franchiseOpportunities` has a required `alt` (`objects/altField.ts`) | ✅ | ✅ done | Rich text has no inline images |
| **Hero subtitle auto-switch** (projects + year vs owner line) | ✅ `heroSubtitleVariant`, `projectsCount`, `ownerSinceYear` | ✅ `heroSubtitle()` in `lib/location.ts` | ✅ done | Knoxville has no `projectsCount`, so it shows the owner line |
| **Owner section variants** (owner-led / owner-with-team) | ✅ `franchiseStructure`, `teamMembers` | ✅ `components/home/OwnerSection.tsx`; service pages: featured/compact `OwnerCard` | ✅ done | |
| **Review tags** | ✅ `reviews[].services` (refs) + legacy `serviceTag` | ✅ service pages pick tagged reviews, fill only with general ones (`lib/reviews.ts`) | ✅ done | |
| **Gallery captions** | ✅ `title`, `projectType`, `area` | 🟡 service-page Recent Work slider shows them; the homepage grid doesn't (Our Work page doesn't exist) | 🟡 partial | |
| **LocalBusiness schema** | — | ✅ homepage `HousePainter` with address, AggregateRating, reviews (`lib/seo.ts`) | ✅ done | Validate in Google's Rich Results Test before launch (proposal Phase 3) |
| **Service + Review schema** | — | ✅ service pages: `Service` (provider = LocalBusiness), tagged `Review`s, `BreadcrumbList`, `FAQPage` | ✅ done | |
| **Sitemap** | — | ✅ `app/sitemap.ts`: location homepages + service pages | 🟡 partial | Will need the 7 missing page types added as they're built |
| **Canonicals** | — | ✅ homepage and service pages | ✅ done | `robots.ts` ✅ (disallows `/studio`) |
| Static generation ("no server-side rendering", proposal) | — | ✅ SSG + ISR (60s revalidate), `generateStaticParams` per location | ✅ done | The estimate form adds a server action, which is expected |
| next/image "or equivalent" | — | ✅ `components/SanityImage.tsx` (Sanity CDN srcset, `auto=format`, lazy, preload for LCP); logos use `next/image` | ✅ done | Tell the client this is the "equivalent" the brief allows (it avoids optimising every image twice) |

## 3. Performance (proposal: "sub-2 second mobile load … verified via PageSpeed Insights")

Lighthouse 12 mobile (simulated Moto G Power / slow 4G), **local production build** (`next start`), median of 3 runs. PageSpeed Insights on the production domain will differ; PSI must be run post-launch per the brief.

| Page | Performance | **LCP** | FCP | Speed Index | TBT | CLS | LCP element |
|---|---|---|---|---|---|---|---|
| `/knoxville` | 93 (88–94) | **3.1 s** | 1.1 s | 2.4 s | 90 ms | 0 | hero H1 text |
| `/knoxville/interior-painting` | 91 (84–92) | **3.2 s** | 0.9 s | 2.4 s | 155 ms | 0 | hero image |
| `/knoxville/exterior-painting` | 93 (92–95) | **3.1 s** | 0.9 s | 0.9 s | 119 ms | 0 | hero image |

**Not met:** LCP is 3.1–3.2s on all three pages. FCP is under 1.1s.

**Top 3 causes (from Lighthouse's LCP breakdown):**
1. **Render delay, not download.** On `/knoxville` 2.7s of the 3.1s LCP is "render delay" (the H1 is ready long before it's painted); on interior it's 2.4s. The main thread is busy before the first full paint: 149 KB of JavaScript, 0.5–0.7s boot-up and 1.1–1.4s of main-thread work under mobile CPU throttling. That covers hydration of the client components (header shell, nav menu, before/after slider, gallery slider, Trustindex loader) plus the Next runtime.
2. **Above-the-fold images compete with the LCP image.** On service pages the before/after photos are visible on a phone's first screen and load at high priority next to the hero (exterior: 37 KB hero + 27 KB + 41 KB). On exterior this shows up as 2.4s of LCP "load time". Lowering their priority or deferring them until after the hero would help.
3. **Font/text paint on the homepage (to confirm with a trace).** The homepage LCP is the large uppercase H1. Its late paint is consistent with a web-font swap (Plus Jakarta Sans via `next/font`) repainting it after JS settles. Confirm with a Performance trace before changing font loading.

Also: the shared hero photo (1920×1680 franchise stock) is served at 828w/q60 (37 KB); fine for now, but a real hero cropped to the hero shape would cut bytes further.

## 4. Deliverables not yet started

### 4a. 301 redirect map (proposal: "301 redirect mapping from all existing WordPress URLs") — ❌ missing

No `redirects()` in `next.config.ts` and no middleware/proxy. **Recommended mechanism:** one pattern rule per old slug using `:location` (e.g. `/:location/home-siding-painting` → `/:location/exterior-painting`), so ~25 rules cover all 44 locations instead of ~1,000 per-location rules. Use `statusCode: 301` (Next's `permanent: true` sends 308, which search engines treat the same). Match with and without the trailing slash, which WordPress used, so there's no 308 → 301 chain.

**Knoxville live URLs (`docs/painter1-knoxville/manifest.json`, 18 pages):**

| Live URL (`https://www.painter1.com…`) | → New URL | Notes |
|---|---|---|
| `/knoxville/` | `/knoxville` | same page |
| `/knoxville/about-us/` | `/knoxville/about-us` | page to build |
| `/knoxville/interior-painting/` | `/knoxville/interior-painting` | same page |
| `/knoxville/exterior-painting/` | `/knoxville/exterior-painting` | same page |
| `/knoxville/home-siding-painting/` | `/knoxville/exterior-painting#siding` | Siding section (Oct 9) |
| `/knoxville/stucco-painting/` | `/knoxville/exterior-painting#stucco` | Stucco section (Oct 9) |
| `/knoxville/brick-painting/` | `/knoxville/exterior-painting#brick` | Brick section (Oct 9) |
| `/knoxville/deck-painting-and-staining/` | `/knoxville/exterior-painting#decks` | Decks section (Oct 9) |
| `/knoxville/fence-painting-and-staining/` | `/knoxville/exterior-painting#fences` | Fences section (Oct 9) |
| `/knoxville/masonry-coating-and-waterproofing/` | `/knoxville/exterior-painting` | closest match; confirm |
| `/knoxville/concrete-staining/` | `/knoxville/exterior-painting` | closest match; confirm (could be interior floors) |
| `/knoxville/cabinet-painting/` | `/knoxville/cabinet-painting` | same page (slug renamed Oct 9); only the trailing slash differs, which Next.js redirects itself |
| `/knoxville/cabinet-painting-and-refinishing/` | `/knoxville/cabinet-painting` | the live page shows Inland Northwest content, but the URL still has rankings |
| `/knoxville/popcorn-ceiling-removal/` | `/knoxville/interior-painting` | closest match; confirm |
| `/knoxville/wallpaper-removal/` | `/knoxville/interior-painting` | closest match; confirm |
| `/knoxville/residential-painting/` | `/knoxville` | it's a hub of interior + exterior |
| `/knoxville/commercial-painting/` | `/knoxville` | **no commercial page in the new sitemap**; confirm (or add a service doc later) |
| `/knoxville/schedule/` | `/knoxville/schedule` if the booking page is built, otherwise `/knoxville/free-estimate` | depends on the scheduling feature |

**Linked from every live page (not in the manifest), 10 city landing pages:** `/knoxville/painters-{alcoa,clinton,farragut,lenoir-city,louisville,maryville,oak-ridge,oliver-springs,powell,seymour}-tn/` → `/knoxville` (one rule: `/:location/painters-:city` → `/:location`). **SEO risk:** these are local-search pages with no template in the new sitemap; ×44 locations. Confirm with the client before launch.

**Older URLs seen in the Internet Archive** (may still have backlinks; confirm against Search Console/GA landing-page reports in Phase 2):
- **2024 city pages** `/knoxville/{alcoa,clinton,farragut,gatlinburg,lenoir-city,maryville,oak-ridge,pigeon-forge}/` → `/knoxville`.
- **2021 site** `/knoxville/contact`, `/knoxville/estimate` → `/knoxville/free-estimate`; `/knoxville/reviews` → `/knoxville/reviews`; `/knoxville/services`, `/knoxville/services/business` → `/knoxville`; `/knoxville/cities-we-serve/…` (15 pages) → `/knoxville`; `/knoxville/blog` → `/knoxville` (no blog in scope); `/knoxville/locations` → the corporate locations directory (no route yet).
- **Google Ads landing page** `/knoxville/professional-painting-services-gaw-1/` and `/…/thank-you/` → `/knoxville/free-estimate`. Ads final URLs should be updated before switch-over (estimate plan L10).

### 4b. Documented data schema / CMS setup (brief §5 deliverable) — ❌ missing

Existing docs are developer plans (`docs/service-template-plan.md`, `docs/service-hero-slider-plan.md`, `docs/estimate-page-plan.md`), not an editor-facing guide. Field descriptions in Studio cover part of it. Needed:
- How to add a location: required fields, growth vs maintenance, slug rules.
- Per-field reference: tokens `{city}`/`{state}`/`{owner}`, image rules, hero/gallery photo sizes, captions, review tagging.
- Service documents and per-location overrides.
- Scheduling toggle, Trustindex ID, lead recipients (private document) and Studio access.
- Publishing, preview, revalidation timing, and the seed scripts.

## Missing-page dependency notes

- **Cabinet Refinishing** needs only a service document + copy; the template exists.
- **Maintenance locations** depend on About Us.
- **Every CTA** depends on Free Estimate; the scheduling toggle depends on a booking page and a replacement for the WordPress calendar.
- **Warranty, Privacy and Reviews** have their data in Sanity already; they need routes and simple templates.

## Batch 2 (planned, not built; starts after the estimate survey ships)

| # | Item | Status | Plan | Sources / files | Open points |
|---|---|---|---|---|---|
| B2.1 | **Cabinet Refinishing service page** | ❌ → plan | Add `service-cabinet-refinishing` (slug `cabinet-refinishing`, `locationKey: cabinet`) to `scripts/seed-services.ts` with a dry run first. The template already renders it. Extend the seed's legacy-tag conversion to `cabinet` so the 2 tagged cabinet photos get service refs | **Use:** Knoxville's live `docs/reference/live-site/cabinet-painting.md` (intro, the "60–80% less / $15–40k vs $3–8k" comparison, the "What to Expect" steps: written estimate, ventilated spray area and plastic sheeting, 2 coats of primer, 2–3 topcoats of Sherwin-Williams cabinet enamel, clean-up, care guidance) and the imported `services.cabinet` (summary, 4 highlights, "Most kitchens done in 3-5 days", before/after pair `Cabinet-Painting-Before-1`/`After-1`). **Never use** `cabinet-painting-and-refinishing.md` (Inland Northwest content) | **Missing copy (client approval):** the transformation heading, the What We Paint cards (e.g. Kitchen cabinets / Bathroom vanities / Built-ins), FAQs and the hero subtitle. These will be drafted strictly from the facts above and marked for approval. Only 2 tagged photos means Recent Work stays hidden (minimum 3). `services.cabinet.images` includes 2 franchise stock images, which won't be used. No cabinet-tagged reviews, so general reviews fill in. No hero photo, so the stock fallback shows |
| B2.2 | **Exterior Siding & Stucco sub-sections** | 🟡 → plan | Render `services.<key>.subServices` on the service page (any service, not just exterior) as sections after What We Paint: heading (h2/h3), description, optional photo, and an anchor id (`#home-siding-painting`, `#stucco-painting`) | Knoxville data: Home Siding Painting (~250 chars, with photo), Stucco Painting (~130 chars, no photo). Files: `app/[location]/[service]/page.tsx`, new `components/service/SubServices.tsx`, query `subServices[]{…image}` | The 301s for `/home-siding-painting/` and `/stucco-painting/` can then target these anchors (`/knoxville/exterior-painting#home-siding-painting`) |
| B2.3 | **Privacy Policy page** | ❌ → plan | Route `/[location]/privacy-policy`, rendering the rich text with heading anchors. The footer links `#do-not-sell`, so that heading needs that id | Sanity already has the imported notice on `location.privacyPolicy` (180 blocks). It is the **franchise-wide** "Stratify, LLC (doing business as Painter1 Franchise)" notice, last updated July 16, 2025, not Knoxville-specific | **Recommend** moving it to one shared `privacyPolicy` document, with an optional per-location override, instead of 44 copies. The live Knoxville privacy page isn't in the download, so before launch the Sanity copy should be compared with a fresh browser save of the live page (corporate `/privacy-policy/` or the location version). Indexable or `noindex`: client's call |
| B2.4 | **Homepage auto meta description** | 🟡 → plan | When `location.metaDescription` is empty, generate one, ≤160 characters, e.g. "{Location name}: interior, exterior and cabinet painting in {City}, {State}. Locally owned by {Owner}. Free estimate: {phone}." Measured to stay ≤160 for long city names; trimmed by dropping the owner clause if needed | `app/[location]/page.tsx` (`generateMetadata`), `lib/seo.ts` | Wording for client approval (no copywriting in scope: keep it factual from location data) |
| B2.5 | **Per-page meta override on service pages** | 🟡 → plan | Add `metaTitle` / `metaDescription` to `serviceDetail` (per location, per service). Order: location override, then the service document's tokenised description, then the auto title | `sanity/schemas/objects/serviceDetail.ts`, `sanity/lib/{queries,types}.ts`, `app/[location]/[service]/page.tsx` | Same pattern later for the other page types |
| B2.6 | **Temporary redirect `/` → `/knoxville`** | ❌ → plan | `redirects()` in `next.config.ts`: `{ source: '/', destination: '/knoxville', permanent: false }` (307, so search engines don't treat it as permanent), and delete the create-next-app `app/page.tsx` | `next.config.ts`, `app/page.tsx` | Removed when the franchisor homepage (`franchisePage` singleton) gets a route; `/` stays out of the sitemap until then |

**Batch 2 order:** B2.6 (one line; fixes the public starter page) → B2.4 → B2.5 → B2.2 → B2.3 → B2.1 (needs copy approval).
