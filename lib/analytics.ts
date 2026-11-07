// Which dataLayer event a link click is (docs/analytics.md). Pure, tested in analytics.test.ts.

export type LinkEvent = 'phone_click' | 'booking_click' | 'estimate_cta_click'

export const BOOKING_HOST = 'schedule.painter1.com'

/** The event for a link's href (as written), or null when the link isn't tracked */
export function linkEvent(href: string, pageUrl: string): LinkEvent | null {
  const raw = href.trim()
  if (/^tel:/i.test(raw)) return 'phone_click'
  let url: URL
  try {
    url = new URL(raw, pageUrl)
  } catch {
    return null
  }
  if (!/^https?:$/.test(url.protocol)) return null
  if (url.hostname.toLowerCase() === BOOKING_HOST) return 'booking_click'
  // /<location>/free-estimate on this site (query and hash ignored)
  if (url.origin === new URL(pageUrl).origin && /^\/[^/]+\/free-estimate\/?$/.test(url.pathname)) return 'estimate_cta_click'
  return null
}
