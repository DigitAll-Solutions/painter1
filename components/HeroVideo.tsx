'use client'

import { useEffect, useState } from 'react'

// Homepage hero video (ready for 2027; no location has one yet). Nothing is downloaded during the page
// load: the <video> is added only after the page has loaded and the browser is idle, so the headline,
// buttons and hero image (the poster, and the LCP) come first. It fades in once it's actually playing.
// Skipped for visitors who ask for reduced motion or less data. Only rendered when a location has a
// video, so pages without one load none of this.
export default function HeroVideo({ src, type }: { src: string; type?: string }) {
  const [mounted, setMounted] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return
    const idleApi = typeof window.requestIdleCallback === 'function'
    let idle: number | undefined
    const start = () => {
      idle = idleApi ? window.requestIdleCallback(() => setMounted(true), { timeout: 3000 }) : window.setTimeout(() => setMounted(true), 200)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      window.removeEventListener('load', start)
      if (idle === undefined) return
      if (idleApi) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [])

  if (!mounted) return null
  return (
    <video
      className={`absolute inset-0 -z-10 size-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden
      onPlaying={() => setPlaying(true)}
    >
      <source src={src} type={type} />
    </video>
  )
}
