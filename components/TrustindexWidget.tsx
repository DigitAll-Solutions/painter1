'use client'

import { useEffect, useRef } from 'react'

const LOADER = 'https://cdn.trustindex.io/loader.js'
// The widget's own font (font-display: swap), regular and semibold
const WIDGET_FONTS = ['400 16px "Trustindex Poppins"', '600 16px "Trustindex Poppins"']

// The loader fills every element whose data-src is "loader.js?<widgetId>". Once the section
// scrolls near the viewport we add that placeholder (outside React's tree, since the loader
// replaces it) and the loader itself — without an id, so it doesn't render a second widget.
export default function TrustindexWidget({ widgetId }: { widgetId: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let settle: ReturnType<typeof setTimeout> | undefined
    let fallback: ReturnType<typeof setTimeout> | undefined
    let building: MutationObserver | undefined

    // The widget builds itself in several passes (text, "Read more" trimming, carousel) and swaps in its
    // own web font, and each step shifts its text. Keep it transparent inside the reserved box until it
    // has been quiet for 400ms and its fonts have loaded, so none of that counts as layout shift; then
    // show it unchanged. Opacity, not visibility: hidden, because the widget postpones its "Read more"
    // pass until it's visible, which would push that shift past the reveal.
    const widgetFonts = () =>
      Promise.all(WIDGET_FONTS.map((font) => document.fonts.load(font).catch(() => []))).then(() => document.fonts.ready)
    const reveal = () => {
      building?.disconnect()
      clearTimeout(settle)
      clearTimeout(fallback)
      el.style.opacity = ''
    }
    const hideWhileBuilding = () => {
      el.style.opacity = '0'
      building = new MutationObserver(() => {
        clearTimeout(settle)
        if (!el.querySelector('.ti-widget')) return
        settle = setTimeout(() => void widgetFonts().then(reveal), 400)
        // Never stay hidden for long once the widget exists (e.g. a carousel that keeps mutating)
        fallback ??= setTimeout(reveal, 4000)
      })
      building.observe(el, { childList: true, subtree: true, characterData: true })
    }

    const load = () => {
      hideWhileBuilding()
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
    return () => {
      observer.disconnect()
      reveal()
    }
  }, [widgetId])

  // Reserve the widget's rendered height so it never pushes the reviews below it, whenever it loads.
  // Measured fully loaded (layout "5", light background); the widget switches layout at these
  // viewport widths: <480px 481.5px tall, 480–666px 438.5px, ≥667px 240px. Re-measure if the
  // Trustindex layout or settings change.
  return (
    <div ref={ref} className="trustindex min-h-[482px] min-[480px]:min-h-[439px] min-[667px]:min-h-60" />
  )
}
