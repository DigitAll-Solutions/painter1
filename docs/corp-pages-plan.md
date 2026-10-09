# Corporate pages: plan (not built)

Mockups: "Corp Homepage — interim" and "Warranty page — corp" (docs/reference/corp/, not committed). Nothing here is built yet. This plan is for review.

## Routes

| Route | Page | Source |
|---|---|---|
| `/` | Corporate homepage (today: a temporary 307 redirect to /knoxville) | `franchisePage` singleton (exists, unused) |
| `/warranty` | Network warranty | the shared `warrantyTerms` singleton + a few corporate-only fields |
| `/locations` | Every location by state | `locationsPage` singleton + location documents |

All three need `[location]` to keep working: `warranty` and `locations` are already reserved slugs, so no location can take them.

## Corporate header and footer

- **Header:** logo → `/`; Find a Location (`/locations`), Residential, Commercial, Reviews, Own a Franchise; CTA "Find Your Local Painter1" (`/locations`).
- **Footer:**
  - Corporate HQ address and phone.
  - Homeowners: Find a Location, Residential Painting, Commercial Painting, Warranty, Reviews.
  - Company: About Painter1, Own a Franchise, Corporate Contact.
  - Follow: Facebook, Google, [other profiles].
  - "© {year} Painter1. Each location is independently owned and operated." Privacy Policy · Terms.
- The location header and footer stay as they are. The corporate pair is a separate layout (route group `app/(corporate)/`), so the location pages don't change.
- The HQ address, phone and social links go in a new `corporateSettings` singleton. They are not hard-coded.

## Reusing the warranty singleton on /warranty

Same text as every location page, so the terms are never written twice:

- **Reused:** stats, What's covered, Requirements, How covered repairs work, Exclusions (with "Nail pops" still marked for confirmation), "independently owned" disclaimer.
- **Corporate-only fields** (added to `warrantyTerms`, group "Corporate page"):
  - eyebrow "THE PAINTER1 WARRANTY";
  - H1 "2-Year **Workmanship** Warranty" (differs from the location H1 "Our 2-Year …");
  - corporate intro ("Every Painter1 location offers a two-year warranty to its residential and commercial clients…");
  - network PDF (file);
  - "How to make a claim": 3 cards (title + body);
  - closing CTA "Questions about your warranty?" / "Reach out to the Painter1 location that completed your project."
- **No form on /warranty:** requests go to the location that did the work. The CTA is "Find Your Local Painter1".
- **Once /warranty exists:** add the mockup's "View the Painter1 network warranty →" link on location warranty pages (left out for now).

## State list

- **Built from location documents:** `address.state` of every published location, deduped and A→Z, shown as chips. Each chip links to `/locations#<state>`, which lists that state's locations.
- **The mockup's 21 states** came from the live /locations/ page plus Scottsdale (AZ) and Bozeman (MT). The client's new list (Painter1 URLs.csv, 36 locations) differs from the live page by 18 locations, so the chips will follow the documents, not the mockup.
- **Only Knoxville has a document today:** the list fills in as locations are created. Until most exist, `/locations` should fall back to the client's CSV list (name + URL) generated into `known-location-slugs.ts`. That needs states added to the CSV, or to the sync script.

## Placeholders to fill (every [bracket] in the mockups)

### Homepage

1. Hero photo: real Painter1 crew + branded truck, dark overlay.
2. "[XX] locally owned locations in [XX] states": computed from location documents. Confirm whether basic-tier locations count.
3. Trust bar:
   - "[Licensed & insured — confirm network-wide]"
   - "[Written warranty — confirm terms]"
4. How it works, card 3: "[One line on the standard every location follows — prep, materials, cleanup, warranty. Confirm before publishing.]"
5. What we paint:
   - [Real residential before/after photo]
   - [Real commercial project photo]
   - Which services the chips link to. Residential/Commercial pages don't exist yet.
6. Reviews:
   - "[X.X] average across [X,XXX] Google reviews network-wide · [confirm source]"
   - 3 reviews: text, reviewer name, location, month. They must be real, from three locations in different regions, one commercial if available.
7. States note: "[States pulled from the current locations page plus Scottsdale (AZ) and Bozeman (MT)…]". Replaced by the generated list.
8. Own a Painter1: "[Two sentences on the opportunity… No earnings or cost claims until approved by franchise counsel against the FDD.]"
   - Where "Explore Ownership" and "Available Territories" link.
9. Footer: "[Other profiles]".

### Corporate warranty

10. Hero photo: finished interior by a Painter1 crew.
11. "[Confirm this process with Painter1 corporate before publishing.]" (How to make a claim).
12. Claim step 3: "[Your local Painter1 inspects the affected area and schedules covered repairs. Confirm timing.]"
13. "[Confirm with corporate: the terms of your signed contract govern your warranty coverage.]" This is the same `contractNote` that is hidden on location pages until `contractNoteConfirmed` is ticked.
14. Network warranty PDF.

### Shared

15. "Nail pops [confirm for network]" (exclusions, both pages).
16. Corporate HQ details: in the mockup as 105 N. Main St., Spanish Fork, UT 84660 · 801-919-8522. Confirm before use.
17. Pages the nav links to that don't exist yet: Residential, Commercial, Reviews, About Painter1, Own a Franchise, Available Territories, Corporate Contact, Terms.

## Order of work (when approved)

1. `corporateSettings` singleton and the corporate layout (header and footer).
2. `/warranty`, reusing `warrantyTerms`. This is the smallest page and only needs the placeholders in items 10–14.
3. `/locations`, with the state list and the CSV fallback.
4. `/`, once the review, stats and photo placeholders are filled.
5. Sitemap entries for each page, and `/` stops redirecting.
