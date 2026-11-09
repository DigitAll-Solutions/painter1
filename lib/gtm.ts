// Google Tag Manager: at most one container per page (Rick, Nov 9).
//   - Location pages (/[location]/...): that location's own container (Studio "GTM container ID"), or no
//     GTM at all when it has none. Never the corp container, never another location's.
//   - Corp pages (anything not under a location): the corp container, NEXT_PUBLIC_GTM_ID (GTM-5LG3XH7S).
// Studio stores only the ID (GTM-XXXXXXX); the site builds the loader itself and accepts nothing but a
// valid ID, so no other script can be injected. WordPress pages proxied by this site keep their own tags
// (docs/go-live-plan.md). Tested in gtm.test.ts.

/** GTM-, then the container's letters and digits (e.g. GTM-PVDK2ZFJ) */
const ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/

/** A valid container ID, or undefined (empty, a pasted script, lowercase, junk) */
export function gtmId(value?: string | null): string | undefined {
  const id = value?.trim()
  return id && ID_PATTERN.test(id) ? id : undefined
}

/** A location page's container: the location's own, else none. No fallback to the corp container. */
export const locationGtmId = (own?: string | null) => gtmId(own)

/** A corp page's container (any page not under a location): NEXT_PUBLIC_GTM_ID */
export const corpGtmId = (corp = process.env.NEXT_PUBLIC_GTM_ID) => gtmId(corp)

/**
 * The single container a page loads. `location` is the page's location (null/undefined on a corp page).
 * A location page never gets the corp container, even when it has none of its own.
 */
export function pageGtmId(location: { gtmId?: string | null } | null | undefined, corp = process.env.NEXT_PUBLIC_GTM_ID) {
  return location ? locationGtmId(location.gtmId) : corpGtmId(corp)
}
