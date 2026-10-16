'use client'

import { useEffect } from 'react'

import { pickAttribution, withAttribution } from '@/lib/booking-params'
import { ATTRIBUTION_STORAGE_KEY } from '@/lib/estimate-form'

const readStored = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

// Keeps utm_* and ad click IDs from the landing URL for this browser session, so they still reach the
// estimate form after the visitor browses to it (the live site only read the form page's own URL; the
// form reads its own keys from this store).
// Booking links (CtaButton `booking`, data-booking-href) get them too, added at the moment of the click
// (mouse, keyboard, middle click or "copy link"), so the booking page's Attributer and GA4 see the source.
// The rendered href stays the plain booking URL, which is what works without JavaScript.
export default function AttributionCapture() {
  useEffect(() => {
    const found = pickAttribution(window.location.search)
    if (!Object.keys(found).length) return
    try {
      // A new landing with its own tags replaces the old set: never mix two campaigns' source and click ID
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(found))
    } catch {
      // storage unavailable
    }
  }, [])

  useEffect(() => {
    const decorate = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-booking-href]')
      const base = link?.dataset.bookingHref
      if (link && base) link.href = withAttribution(base, window.location.search, readStored())
    }
    const events = ['click', 'auxclick', 'contextmenu'] as const
    for (const name of events) document.addEventListener(name, decorate, true)
    return () => {
      for (const name of events) document.removeEventListener(name, decorate, true)
    }
  }, [])
  return null
}
