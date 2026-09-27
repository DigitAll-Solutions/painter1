'use client'

import { useEffect, useRef } from 'react'

const LOADER = 'https://cdn.trustindex.io/loader.js'

// The loader fills every element whose data-src is "loader.js?<widgetId>". Once the section
// scrolls near the viewport we add that placeholder (outside React's tree, since the loader
// replaces it) and the loader itself — without an id, so it doesn't render a second widget.
export default function TrustindexWidget({ widgetId }: { widgetId: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const load = () => {
      const slot = document.createElement('div')
      slot.dataset.src = `${LOADER}?${widgetId}`
      el.replaceChildren(slot)
      if (document.querySelector(`script[src="${LOADER}"]`)) {
        ;(window as unknown as { renderTrustindexWidgets?: () => void }).renderTrustindexWidgets?.()
        return
      }
      const script = document.createElement('script')
      script.src = LOADER
      script.async = true
      document.body.appendChild(script)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          load()
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [widgetId])

  return (
    <div ref={ref} className="min-h-72" />
  )
}
