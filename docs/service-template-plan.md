# Service page template — plan

Route `/[location]/[service]` for Interior Painting and Exterior Painting, built from
`docs/reference/Paint1 -Interior-moch-up .jpg` and `Paint1 -Exterior-moch-up .jpg` (the brief's
`service-interior.jpg` / `service-exterior.jpg` names don't exist; these are the two files in that folder).

## 1. What already exists (investigation)

| Area | Where | Notes |
|---|---|---|
| Per-location service data | `location.services.{interior,exterior,cabinet}` → `serviceDetail` object (`sanity/schemas/objects/serviceDetail.ts`) | title, summary, cardBullets, **beforeImage / afterImage**, highlights, process, subServices, images. Homepage `ServicesGrid` reads it and links to `/{slug}/interior-painting` etc. (`servicePages` in `lib/location.ts`). Knoxville: exterior has a before/after pair; interior has none. |
| Global service docs | — | None. Dataset only contains `location` docs. |
| Before/after slider | `components/BeforeAfterSlider.tsx` (client) + `components/home/TransformationSection.tsx` | Section hard-codes heading and body; slider is reusable as-is. |
| Owner | `components/home/OwnerSection.tsx` | Large homepage section. Data: `ownerName`, `ownerPhoto`, `ownerActionPhoto`, `ownerQuote` (real, recorded), `ownerQuoteAttribution`. Knoxville: Keith Lane, real quote present. |
| Gallery | `location.galleryImages[]` with `serviceType` string (interior/exterior/cabinet/commercial), `caption`; `components/GalleryGrid.tsx` | Knoxville: 3 interior, 7 exterior, no captions. |
| Reviews | `location.reviews[]` with `serviceTag` string (interior/exterior/cabinet/general); `components/ReviewCards.tsx`; `lib/reviews.ts` (`reviewSchema`, unused `serviceReviews()`); `components/ServiceReviews.tsx` (unused, already emits Service + Review JSON-LD) | Stasia Porter and Jason Tallent are **already** `serviceTag: interior` (so are Dorothy Wallin and Frederick E Wallin). No review is tagged exterior. |
| AggregateRating / LocalBusiness | `localBusinessSchema()` in `lib/seo.ts`, `@id = {siteUrl}/{slug}#business` | Service `provider` will reference this `@id`. |
| Warranty link logic | `getWarrantyHref()` in `lib/location.ts` | `warrantyCtaHref` override, else `/{slug}#estimate`. **Note:** `#estimate` is the homepage CTA section; on a service page I'll build the fallback as `/{slug}#estimate` (absolute path), which navigates to the homepage section. |
| Final CTA | `components/CTASection.tsx` | Orange banner, different from the mockup's white two-button CTA → new component. |
| Tokens | `app/globals.css` | `brand-blue #0088cc`, `brand-orange #e86e00` (decorative only), `cta #b9520a`, `ink #0b1b33`, `mist`. |
| Icons | `lucide-react` already installed | All icons needed exist (PaintRoller, Layers, Ruler, DoorOpen, House, BrickWall, Fence, …). |
| Images | `components/SanityImage.tsx` | Custom server `<img>` with Sanity CDN srcset; the site doesn't use `next/image` for Sanity photos (see decision D4). |
| Header | `HeaderShell` | Already solid white on every non-home path. Nav already links Interior/Exterior/Cabinet pages. |
| SEO helpers | `lib/site.ts` `absoluteUrl()` → `https://www.painter1.com` default; root `metadataBase` set | Canonical `https://www.painter1.com/{location}/{service}` comes out of `absoluteUrl` directly. |
| Sitemap | `app/sitemap.ts` | Only location homepages → add service URLs. |
| Navy | sampled from both mockups | **#112A52** (banner, icon squares, navy button) → new token `--color-navy`. |

## 2. Data model (Sanity)

### New document `service` (`sanity/schemas/service.ts`), one per service
- `title` ("Interior Painting"), `slug` (interior-painting), `shortName` ("Interior")
- `locationKey` — `interior | exterior | cabinet`: which `location.services.*` entry holds this service's per-location data (see D1)
- `showPageHeader` boolean, default true
- `metaDescription` text (tokens)
- `ownerCardVariant` radio: featured | compact
- Transformation: `transformationHeading` string, `transformationBody` text (tokens)
- Process: `processIntro` (optional), `prepIntro`, `prepBullets[]`, `materialsBody` (rich text, **bold only**), `materialsBlocks[]` { title, body (bold-only rich text) }
- Warranty banner: `warrantyBannerBody` text (tokens), see D5
- `whatWePaint[]` { `icon` (string list of curated lucide names), `title`, `description` }
- `faqs[]` { `question`, `answer` (text, tokens) }
- Token fields document `{city}`, `{state}`, `{owner}` (owner first name) in their descriptions.

### Location
- **Per-location overrides (D1):** add `transformationBody` (tokens) to `serviceDetail`. Override wins over the service default; before/after come from the existing `serviceDetail.beforeImage/afterImage` (hotspot + required alt already).
- `galleryImages[]`: add `services` (refs → service), `projectType`, `area`. Caption renders `"{projectType}, {area}"` (whichever parts exist); no caption if both are empty.
- `reviews[]`: add `services` (refs → service).
- Existing string tags (`serviceType`, `serviceTag`) are hidden in Studio and kept read-only, not deleted (D2).

## 3. Components

| Section | Component | Reuse / new |
|---|---|---|
| 0 Page header (breadcrumb + H1) | `components/service/ServicePageHeader.tsx` | new, compact. Home → `absoluteUrl('/')` (the root `/` of this app is still the create-next-app starter), City → `/{slug}`, Service (current). H1 `{title} in {City}, {State}`. When `showPageHeader` is false the transformation heading renders as the H1 (exactly one H1 either way). |
| 1 Transformation | `TransformationSection` refactored to take `heading`, `body`, `before/after`, `headingLevel`, optional CTA; homepage keeps its current output | reuse + refactor. Text-only when the pair is missing. Button "Get My Free Estimate →" → `/{slug}/free-estimate`. |
| 2 Owner card | `components/service/OwnerCard.tsx` (featured / compact) | new (homepage section is too heavy). Quote only from `ownerQuote`; no quote → card without one. |
| 3 Process + warranty banner | `ServiceProcess.tsx`, `WarrantyBanner.tsx` | new. Portable text via `next-sanity`'s `PortableText` (strong only). Link uses `getWarrantyHref()`. Link colour: `#B9520A` on #112A52 is **2.89:1 (fails)**, so this link uses the lighter orange already used on navy in the trust strip (`orange-300`, about 8.3:1). |
| 4 What We Paint | `WhatWePaint.tsx` | new. 4 → 4 cols, 6 → 3 cols, else auto-fit; tablet 2, small mobile 1. White lucide icon on navy rounded square. |
| 5 Recent Work | `GalleryGrid` gains optional captions + 4-col variant | reuse. Up to 8 tagged images; hidden if fewer than 4. |
| 6 Reviews | `ServiceReviews` (existing, reworked) + `ReviewCards` | reuse. 3 tagged; if fewer than 3, fill with latest reviews and switch heading to "What {city} Homeowners Are Saying". Review objects feed the Service JSON-LD. |
| 7 FAQ | `ServiceFaq.tsx` | new; all answers visible; FAQPage JSON-LD. |
| 8 Final CTA | `ServiceCta.tsx` | new. "Call {phone}" (cta orange, `tel:`) + "Start My Free Estimate →" (navy) → `/{slug}/free-estimate`. |

Shared: `lib/tokens.ts` (`fillTokens(text, location)`: `{city}` → city or location name, `{state}`, `{owner}` → owner first name; never leaves a raw `{token}` on the page).

## 4. Route and SEO
- `app/[location]/[service]/page.tsx`. `generateStaticParams({ params })` returns every service slug for each parent location (Next 16 runs the child once per parent params). `dynamicParams` stays default (true) and the page calls `notFound()` when the service doc or location is missing. A service doc added later then works via ISR without a redeploy; `cabinet-refinishing` 404s until its doc exists.
- Maintenance locations: `notFound()` (their nav/homepage cards don't link to service pages). **Confirm (D6).**
- Metadata: title `{Service title} in {City}, {State} | Painter1 of {City}`, description from `metaDescription` with tokens, canonical `absoluteUrl('/{location}/{service}')`, OG image = transformation after-image, else location `heroImage`.
- JSON-LD: `Service` (provider `@id` → location `#business`, areaServed city, reviews), `BreadcrumbList`, `FAQPage`. Parsed with `JSON.parse` in the test run to confirm well-formed.
- Sitemap gains every location × service URL.
- Queries: `SERVICE_QUERY`, `SERVICE_SLUGS_QUERY`, location query extended with the new fields; cache tag `service`.

## 5. Seed — `scripts/seed-services.ts`
- Runs with Node 24's built-in TypeScript: `node --env-file=.env.local scripts/seed-services.ts [--dry-run]`, using `createClient` from `next-sanity`.
- Service docs get stable IDs `service-interior-painting` / `service-exterior-painting` (no dot: Sanity treats dotted IDs as private, so the public site couldn't read them): `createIfNotExists`, then `patch.set` of the seeded fields only. Re-runs reset seeded copy but never delete fields editors add later.
- `**bold**` in the brief becomes portable-text `strong` marks.
- Knoxville reviews: Stasia Porter and Jason Tallent get `services: [ref interior-painting]` (matched by `_key`, verified by name). Only the Knoxville document is patched (by `_id`).
- `--dry-run` prints every create/patch and a before → after diff, and writes nothing.
- **Needs a write token (D3).**

## 6. Quality checks (Phase 2)
Typecheck, lint, build; no horizontal scroll at 360/768/1024/1440; axe WCAG AA on both pages; layout shift 0; Lighthouse mobile on both pages (local production build); JSON-LD parse check; screenshots at 1440 and 360 compared against the mockups.

Commits (sbharvadiya1, no attribution): 1 schema → 2 components → 3 route + SEO → 4 seed script. Push the branch and send the PR link (no `gh` on this machine). Seed: dry-run output shown to you before any real write.

## 7. Decisions needed before "go"

- **D1. Per-location overrides.** The brief asks for a new `location.serviceOverrides[] { service ref, transformationBody, beforeImage, afterImage }`. Locations already carry `services.{interior,exterior,cabinet}` with `beforeImage/afterImage`, which the homepage uses and Knoxville's exterior pair lives in.
  **Recommend:** extend `serviceDetail` with `transformationBody` and link each service doc via `locationKey`. No duplicate before/after fields, and Knoxville's exterior pair works immediately.
  **Alternative:** build `serviceOverrides[]` exactly as written and copy Knoxville's exterior pair into it. That leaves two places to upload before/after photos.
- **D2. Existing string tags.** Gallery `serviceType` and review `serviceTag` already tag Knoxville's content. If only Stasia and Jason get refs:
  - Exterior Recent Work has 0 tagged images, so it's hidden.
  - Interior reviews fall back to the generic heading.
  **Recommend:** the seed also converts Knoxville's existing string tags to `services` refs: 7 exterior + 3 interior images, and 4 interior reviews including Stasia and Jason. That changes more Knoxville data than the brief lists, so it's your call.
  **Alternative:** tag only Stasia and Jason.
- **D3. Write token.** `.env.local` only has `SANITY_API_READ_TOKEN`; there's no write-token variable to reuse. Please add `SANITY_API_WRITE_TOKEN` (Editor permissions, from sanity.io/manage → API → Tokens) to `.env.local`. I won't use it in app code.
- **D4. `next/image`.** Like the warranty photo last round, I recommend `SanityImage`: Sanity CDN srcset, correct `sizes`, lazy by default, `preload` on the first image only, fixed-ratio containers so layout shift is 0. `next/image` would need a custom loader or would optimise every Sanity image twice.
- **D5. Warranty banner copy.** The brief gives no seed text. The mockup says "…covered against peeling and blistering… **no labor charge** on qualifying repairs", while the homepage warranty says "peels, blisters, or flakes within two years… **labor and materials included**". These are two different warranty promises.
  **Recommend:** seed `Every {service} job gets the same written warranty: if paint we applied peels, blisters, or flakes within two years, we'll come back and fix it, labor and materials included.`, matching the homepage.
  **Alternative:** use the mockup wording if Rick confirms it.
- **D6. Maintenance locations.** I'll 404 service pages for them unless you want them built.

## 8. Known gaps that will show (not fixed in this task)
- `/{slug}/free-estimate` 404s today; both service-page estimate buttons point there as specified (same as every other estimate button on the site).
- Interior Recent Work stays hidden: Knoxville has only 3 interior-tagged images, below the 4-image minimum.
- No gallery image has `projectType`/`area` yet, so captions stay empty until someone fills them in Studio.
- Exterior reviews: none tagged exterior, so the exterior page uses the fallback heading with the latest 3 reviews.
- Two Knoxville gallery alts contain mojibake (`â€“` for an en dash, "Kadunza Auto Service"). This is existing data; I'll leave it unless you want the seed to fix it.
- Mockup copy errors I'll correct rather than copy:
  - The exterior mockup says "Interior Services" and "Interior Painting FAQ".
  - Both mockups mix Columbus and Salt Lake City and show placeholder owners, reviews and tiles.
  - The interior mockup shows a PLACEHOLDER badge.
