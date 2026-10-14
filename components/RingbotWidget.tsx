'use client'

import { useEffect } from 'react'

import { ringbotSrc } from '@/lib/ringbot'

// The Ringbot chat bundle is heavy (~180 KB gzipped), so it loads only once the visitor interacts with
// the page (scroll, tap, key), or after a quiet 10 seconds, never during the page's own load.
const INTERACTIONS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
const FALLBACK_MS = 10_000

export default function RingbotWidget({ id }: { id: string }) {
  useEffect(() => {
    let loaded = false
    const load = () => {
      if (loaded) return
      loaded = true
      stop()
      // One install per page session (client-side navigation keeps the layout, and the widget, in place)
      if (document.querySelector('script[data-ringbot]')) return
      const script = document.createElement('script')
      script.src = ringbotSrc(id)
      script.async = true
      script.dataset.ringbot = ''
      document.body.appendChild(script)
    }
    const timer = window.setTimeout(() => ('requestIdleCallback' in window ? window.requestIdleCallback(load) : load()), FALLBACK_MS)
    const stop = () => {
      window.clearTimeout(timer)
      for (const event of INTERACTIONS) window.removeEventListener(event, load)
    }
    for (const event of INTERACTIONS) window.addEventListener(event, load, { once: true, passive: true })
    return stop
  }, [id])
  return null
}
