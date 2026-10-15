'use client'

import { useEffect } from 'react'

import { ringbotSrc } from '@/lib/ringbot'

// The Ringbot chat bundle is heavy, so it loads only once the page has finished loading and the browser
// is idle, never during the page's own load. Only rendered for locations with a valid iID.
export default function RingbotWidget({ id }: { id: string }) {
  useEffect(() => {
    const idleApi = typeof window.requestIdleCallback === 'function'
    let idle: number | undefined
    const load = () => {
      // One install per page session (client-side navigation keeps the layout, and the widget, in place)
      if (document.querySelector('script[data-ringbot]')) return
      const script = document.createElement('script')
      script.src = ringbotSrc(id)
      script.async = true
      script.dataset.ringbot = ''
      document.body.appendChild(script)
    }
    const start = () => {
      idle = idleApi ? window.requestIdleCallback(load, { timeout: 4000 }) : window.setTimeout(load, 2000)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      window.removeEventListener('load', start)
      if (idle === undefined) return
      if (idleApi) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [id])
  return null
}
