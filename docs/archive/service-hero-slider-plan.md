# Service pages: hero with overlay + Recent Work slider — plan

Branch `service-hero-slider` (from `main` after PR #7).

## Step 0 — hero image candidates

Requirement: a photo of crew/painters at work, at least 1600px wide, Knoxville's own (no franchise stock, no Inland Northwest).

**Result: no image qualifies.**

| Image | Size | Where | Shows | Verdict |
|---|---|---|---|---|
| Painter1-Our-Affilation-…-Sherwin-Williams-Updated-Logo.png | 3840×1200 | 17 pages (shared block) | Sherwin-Williams logo banner | Not a photo |
| Cabinet-Painting-Preparation-from-Painter1-scaled.jpg | 2560×1920 | Inland Northwest cabinet page only | Kitchen masked in plastic for spraying, no people | Other location, no crew |
| 8352_print_no_phone.webp | 1920×1282 | Inland Northwest cabinet page only | Two Painter1 painters prepping a bedroom wall | Franchise marketing shoot, not Knoxville |
| 8457_print_no_phone.webp | 1920×1282 | Inland Northwest cabinet page only | Two painters at work, homeowners watching | Franchise marketing shoot, not Knoxville |
| 7515_print_no_phone.webp | 1920×1282 | Inland Northwest cabinet page only | Crew member placing a Painter1 yard sign | Franchise marketing shoot |
| 8942_print_no_phone.webp | 1920×1282 | Inland Northwest cabinet page only | Person beside a branded Painter1 car | Franchise marketing shoot |

Knoxville's images already in Sanity:

| Field | Size | File | Verdict |
|---|---|---|---|
| `heroImage` (homepage hero) | 1920×1680 | Painter1-Our-Painting-Services-Residential-Painting-Cover.jpg | **Franchise stock by name**, and it is the last fallback in the new hero chain |
| `ownerActionPhoto` | 1061×756 | Painter1-of-Knoxville-Keith-Lane-Homeowner-Consult.png | Real Knoxville, but a consultation (not crew at work) and under 1600px |
| services / gallery | ≤1200px wide | before/after and project photos | All under 1600px |

The best real candidates (8352, 8457) are franchise brand photos. If Painter1 corporate allows every location to use them, they would work well; otherwise Keith needs to supply crew photos at 1920×1080 or larger.

## Change 1 — hero with text overlay

**New component `components/service/ServiceHero.tsx`** (server component, replaces `ServicePageHeader.tsx`, which is deleted; the `Crumb` type moves with it)
- Fixed-height box: `h-[420px] md:h-[480px] lg:h-[560px]`, so layout shift stays 0.
- Image: `SanityImage` with `fill`, `object-cover`, `preload` (eager + `fetchpriority="high"` + `<link rel=preload>` with the srcset), `sizes="100vw"`; `object-position` from the hotspot/crop (the `hotspotPosition` helper moves from `WarrantyBand.tsx` to `lib/image.ts` and both use it).
- Source, first match wins: `location.services[locationKey].heroImage` → `service.heroImage` → `location.heroImage`. With none of them set, the hero renders on solid navy (no broken image).
- Overlay: dark ink (#0b1b33) gradient. Mobile/tablet: bottom-up (text at the bottom). Desktop: left-to-right (text on the left half). **At least 75% ink behind every line of text**, which is 7.7:1 for white text even over a pure-white pixel (AA needs 60%), fading to about 20% where there is no text.
- Content: breadcrumb (`nav aria-label="Breadcrumb"`, Home > {City} > {Service}), H1 "{Service title} in {City}, {State}", subtitle (`heroSubtitle`, tokens filled), buttons "Get My Free Estimate" (existing orange `CtaButton`, `getCta(location).href`) and "Call {phone}" (existing white `outline` variant, `tel:`; hidden when the location has no phone).
- The hero H1 is always the page's single H1. `TransformationBlock` loses `headingLevel` and the service page stops passing `priority`, so its slider images go back to lazy loading. The homepage is unaffected (it never passed either).

**Removed:** `showPageHeader` (schema field, type, query, page logic, seed value). The seed also unsets the stored `showPageHeader: true` on both service docs so no orphan value is left; this shows in the dry run.

**Kept:** BreadcrumbList JSON-LD (built from the same crumbs).

## Change 2 — Recent Work as a manual slider

**New `components/GallerySlider.tsx`** (`'use client'`, reusable). It only handles the track, arrows and announcements; the page renders the slides (server-side `SanityImage`), so no image code ships to the browser.
- Track: `flex overflow-x-auto snap-x snap-mandatory`, scrollbar hidden; slides `basis-full md:basis-1/2 lg:basis-1/3` (1 / 2 / 3 per view), `snap-start`, `aspect-4/3`, `object-cover`, all `loading="lazy"`.
- Arrows: round buttons on the left and right edges, vertically centred, `aria-label` "Previous photos" / "Next photos", visible focus ring. Each is hidden when there is nothing more to scroll that way; both are hidden when everything fits. They stay on mobile, alongside swipe. One click scrolls one view's width.
- Motion: smooth scrolling only under `prefers-reduced-motion: no-preference` (CSS `motion-safe:scroll-smooth`, and `behavior: 'auto'` in JS when reduce is set).
- Accessibility: `<section role="region" aria-roledescription="carousel" aria-label="{shortName} projects in {City}">`, slides as a list (`aria-roledescription="slide"`, "N of M" labels), and a visually hidden `aria-live="polite"` region "Showing photos X–Y of N" updated on scroll end.
- Title overlay: bottom band with an ink gradient (at least 75% under the text), white text. Text = `title`, else "{projectType}, {area}" (whichever parts exist), else no band.

**Selection (page):** photos tagged with the service, in stored order, shown when there are at least 3, up to 12. The whole-rows-of-4 logic and `GalleryGrid`'s `columns`/`captions` props used only by the service page are removed. The homepage "Our Work" grid is unchanged.

**Effect on Knoxville:** Exterior shows all 9 tagged photos (deck before/after adjacent at slides 1–2). **Interior now shows its 3 tagged photos** (Fireplace accent, yellow room, room before/after). Under the previous 4-photo rule that section was hidden.

## Schema / data

| Where | Field | Type | Notes |
|---|---|---|---|
| `service` | `heroSubtitle` | string | Tokens {city} {state} {owner} |
| `service` | `heroImage` | image, hotspot, required alt | "Crew at work for this service, landscape, at least 1920x1080" |
| `service` | `showPageHeader` | — | Removed |
| `serviceDetail` (location.services.*) | `heroImage` | image, hotspot, required alt | Same description |
| `location.galleryImages[]` | `title` | string, max 60 | "Shown over the bottom of the photo, e.g. Exterior repaint in Farragut" |

Queries/types updated to match (`heroSubtitle`, `heroImage{…}` on service and service detail, `title` on gallery images).

**Seed:** `heroSubtitle` for both services (your wording), unset `showPageHeader`. No hero images. Dry run first, then apply after your OK.

## Files

- New: `components/service/ServiceHero.tsx`, `components/GallerySlider.tsx`, `lib/image.ts`, this plan
- Changed: `app/[location]/[service]/page.tsx`, `components/TransformationBlock.tsx`, `components/GalleryGrid.tsx` (drop service-only props), `components/home/WarrantyBand.tsx` (shared hotspot helper), `sanity/schemas/service.ts`, `sanity/schemas/objects/serviceDetail.ts`, `sanity/schemas/location.ts`, `sanity/lib/types.ts`, `sanity/lib/queries.ts`, `scripts/seed-services.ts`
- Deleted: `components/service/ServicePageHeader.tsx`

## Checks after build

Typecheck, lint, build; axe AA on both pages; no horizontal scroll at 360/768/1024/1440; layout shift 0; Lighthouse mobile on both (Performance 90+); keyboard pass through the slider arrows; screenshots at 1440 and 360 to `docs/screenshots/`. Commit as sbharvadiya1, push, PR compare link.

## Decisions needed

- **D1. Hero image for Knoxville now.** Nothing qualifies, so the chain ends at Knoxville's homepage `heroImage`, a franchise stock photo. (a) Accept that until Keith sends photos. (b) Drop `location.heroImage` from the chain, so pages without a service hero get a navy text-only hero. (c) Use 8352/8457 if corporate confirms they can be used by every location (you set them in Studio; the seed won't).
- **D2. Interior Recent Work** will appear with 3 photos under the new ≥3 rule. OK?
- **D3. `showPageHeader`:** remove the field and unset the stored value (recommended), or just hide it in Studio.
