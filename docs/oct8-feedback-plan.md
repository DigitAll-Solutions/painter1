# Client feedback batch (Oct 8): plan

Branch `rick-feedback-oct8`. Data changes run as one dry-run-first script (`scripts/seed-oct8.ts`).

## 1. Locations list
- **Source:** `docs/reference/Painter1 URLs.csv` (gitignored: `/docs/reference/*.csv`). Columns: Location, URL, Home Page, Free Estimate, Service Pages, About Page, Our Work, Warranty.
- **Script:** `scripts/sync-location-slugs.ts` reads it (header layout, page-tier columns) and regenerates `sanity/lib/known-location-slugs.ts`. It reports totals, tiers, odd URLs and the differences from the earlier CSV and the live /locations/ page.
- **No location documents** are created yet.

## 2. Several before/after pairs per service
- **Schema:** `services.<key>.transformations[]` with `{before, after (hotspot + required alt), title, projectType, area}`. The migration (dry run → apply) copies the old `beforeImage`/`afterImage` into item 1 and keeps them, because the site on main reads only those. Every reader takes `transformations[0]` first and falls back to the old fields. Removing them is a post-merge step (`seed-oct8.ts --remove-legacy`).
- **One pair:** today's TransformationBlock, unchanged.
- **Two or more pairs:** heading and body on top, then a row of slider cards (4 / 2 / 1 per view).
  - Reuses the GallerySlider pattern: manual arrows, hidden when everything fits.
  - Uses BeforeAfterSlider in a handle-only drag mode, so swiping the row never moves a divider.
  - Title overlay like the gallery cards.
- **Every consumer reads the pairs:** Recent Work, homepage service cards and the dedupe, the launch checklist, the Live pages links.

## 3. Scheduling
- **`schedulingUrl`:** https only, with the appointment.painter1.com example.
- **New setting `bookingTarget`:** `survey` (default) or `booking`. `getCta()` returns `schedulingUrl` only when `hasScheduling` is on, `bookingTarget` is `booking` and the URL is set. Every CTA already goes through `getCta()`.
- **Survey success screen:** "Pick a time now" button (same tab) whenever `schedulingUrl` is set.
- **Checklist:** a warning when `hasScheduling` is on and the URL is missing.
- **Knoxville:** URL stays empty.

## 4. Location warranty page `/[location]/warranty`
- **Shared terms:** a `warrantyTerms` singleton (id `warranty-terms`) holds every terms text from the mockup, word for word: stats, covered, requirements, repairs, exclusions (with an editor-only "confirm for network" flag on Nail pops), disclaimer, form intro and steps. Seeded by the script.
- **From the location:** owner quote, photo and year; phone; hours; email; address.
  - New optional fields: `warrantyPdf` (file) and `warrantyResponseTime` (step 3 suffix).
  - Hero photo: `warrantyImage`, else `heroImage`.
  - An empty field hides its line.
- **Request form:** the estimate pipeline (honeypot, Turnstile, save before email, test/live guard), plus a new per-IP rate limit for both forms.
  - Photos: up to 5, resized in the browser, stored as Sanity assets on a private `warrantyRequest.<uuid>` document.
  - **Email goes to `warrantyRecipients` only** (on `leads.<id>`), never to Client Tether. The server also strips any `@parse.clienttether.com` address.
  - Knoxville's default: its lead recipients minus Client Tether (masked in the dry run).
- **Studio:** a "Warranty requests" list in each location folder and under All leads; checklist item "Warranty recipients".
- **Links:** the homepage warranty button, service-page banner, footer and nav all go to `/{slug}/warranty`; the `#estimate` fallback goes.
- **Tiers:** locations without the Warranty tier (CSV) get no page or links.
- **SEO:** metadata, BreadcrumbList, sitemap.

## 5. Corporate pages
Plan only, in `docs/corp-pages-plan.md`.

## Open items found while planning
- **Rate limit:** the estimate form had none; this batch adds one.
- **Photo privacy:** uploaded photos live in a public dataset, so they're reachable by anyone who has the exact URL. They aren't listed or searchable.
- **Corporate warranty link:** the mockup's "View the Painter1 network warranty →" points at the corporate /warranty page, which doesn't exist yet, so the link is left out.
