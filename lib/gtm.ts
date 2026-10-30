// Google Tag Manager: one container per page. A location can have its own container (Studio "GTM container
// ID"); otherwise its pages use the site-wide NEXT_PUBLIC_GTM_ID. Studio stores only the ID (GTM-XXXXXXX);
// the site builds the loader itself and accepts nothing but a valid ID, so no other script can be injected.
// WordPress pages proxied by this site keep their own tags (docs/go-live-plan.md). Tested in gtm.test.ts.

/** GTM-, then the container's letters and digits (e.g. GTM-PVDK2ZFJ) */
const ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/

/** A valid container ID, or undefined (empty, a pasted script, lowercase, junk) */
export function gtmId(value?: string | null): string | undefined {
  const id = value?.trim()
  return id && ID_PATTERN.test(id) ? id : undefined
}

/** The single container a location's pages load: its own, else the site-wide one, else none */
export const locationGtmId = (own?: string | null, fallback = process.env.NEXT_PUBLIC_GTM_ID) => gtmId(own) ?? gtmId(fallback)
