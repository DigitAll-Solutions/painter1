'use client'

import { useEffect } from 'react'

import { linkEvent } from '@/lib/analytics'
import { pushDataLayer } from '@/lib/data-layer'

// One click listener for the whole location site: calls, booking and free-estimate links push a dataLayer
// event that GTM turns into GA4 / Ads events (docs/analytics.md). It reads the link at the moment of the
// click, so links added later (client navigation, the success screen) are covered too.
export default function AnalyticsClicks({ slug }: { slug: string }) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]')
      if (!link) return
      const name = linkEvent(link.getAttribute('href') ?? '', window.location.href)
      if (!name) return
      pushDataLayer({
        event: name,
        location_slug: slug,
        page_path: window.location.pathname,
        link_url: link.href,
        link_text: (link.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
      })
    }
    // Capture phase: still seen if a component stops the click from bubbling
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [slug])
  return null
}
