// Booking links (appointment.painter1.com) carry the visitor's campaign source, so Attributer and GA4 on
// the booking page still see where the visit came from. Tested in booking-params.test.ts; applied on
// click by components/BookingParams.tsx.

/** UTM tags and ad click IDs (Google, Microsoft, Meta) worth passing on */
export const ATTRIBUTION_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'fbclid'] as const

/** The attribution params in a query string, in a stable order; empty values are dropped */
export function pickAttribution(search: string): Record<string, string> {
  const params = new URLSearchParams(search)
  const out: Record<string, string> = {}
  for (const name of ATTRIBUTION_PARAMS) {
    const value = params.get(name)?.trim()
    if (value) out[name] = value
  }
  return out
}

/**
 * The booking URL with attribution added: the current page's params, or, when it has none (the visitor
 * clicked through from the landing page), the ones the session landed with. Params already in the booking
 * URL are replaced; anything else in it (path, other params, hash) stays as Studio has it.
 */
export function withAttribution(bookingUrl: string, currentSearch: string, landed: Record<string, string> = {}): string {
  const current = pickAttribution(currentSearch)
  const params = Object.keys(current).length ? current : landed
  if (!Object.keys(params).length) return bookingUrl
  try {
    const url = new URL(bookingUrl)
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value)
    return url.toString()
  } catch {
    return bookingUrl
  }
}
