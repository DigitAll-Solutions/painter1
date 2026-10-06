'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  /** Accessible name, e.g. "Exterior projects in Knoxville" */
  label: string
  /** Pre-rendered slides (server components), shown 1 / 2 / 3 per view on mobile / tablet / desktop */
  slides: ReactNode[]
}

type View = { first: number; last: number; canPrev: boolean; canNext: boolean }

const arrow =
  'absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-slate-200 transition-opacity hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:pointer-events-none disabled:opacity-0'

// Manual carousel: CSS scroll-snap track, prev/next arrows, no autoplay. Swipe and keyboard
// scrolling work natively; the arrows move one view at a time.
export default function GallerySlider({ label, slides }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const prevButton = useRef<HTMLButtonElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)
  const total = slides.length
  // Before hydration assume one slide per view (phones); measured right after mount
  const [view, setView] = useState<View>({ first: 1, last: 1, canPrev: false, canNext: total > 1 })
  const [announce, setAnnounce] = useState('')

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const visible = [...el.children].flatMap((child, i) => {
      const r = child.getBoundingClientRect()
      return r.left >= box.left - 2 && r.right <= box.right + 2 ? [i + 1] : []
    })
    const next: View = {
      first: visible[0] ?? 1,
      last: visible.at(-1) ?? 1,
      canPrev: el.scrollLeft > 1,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    }
    setView(next)
    return next
  }, [])

  // Announce only once scrolling settles, not on every scroll frame
  const onScroll = useCallback(() => {
    measure()
    clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      const v = measure()
      if (v) setAnnounce(v.first === v.last ? `Showing photo ${v.first} of ${total}` : `Showing photos ${v.first}–${v.last} of ${total}`)
    }, 150)
  }, [measure, total])

  useEffect(() => {
    measure()
    const el = track.current
    if (!el) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(settle.current)
    }
  }, [measure])

  // A disabled button drops focus; hand it to the other arrow instead of losing it
  useEffect(() => {
    if (document.activeElement === prevButton.current && !view.canPrev) nextButton.current?.focus()
    if (document.activeElement === nextButton.current && !view.canNext) prevButton.current?.focus()
  }, [view.canPrev, view.canNext])

  const scroll = (direction: 1 | -1) => {
    const el = track.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: direction * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
  }

  const arrows = view.canPrev || view.canNext

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="relative">
      {/* Slides are groups, not list items: a list can't hold role="group" children */}
      <div
        ref={track}
        onScroll={onScroll}
        tabIndex={0}
        role="group"
        aria-label={`${label}, ${total} photos`}
        className="-mx-2 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${total}`}
            className="shrink-0 basis-full snap-start px-2 md:basis-1/2 lg:basis-1/3"
          >
            {slide}
          </div>
        ))}
      </div>

      {arrows && (
        <>
          <button ref={prevButton} type="button" onClick={() => scroll(-1)} disabled={!view.canPrev} aria-label="Previous photos" className={`${arrow} left-2 md:-left-4`}>
            <ChevronLeft className="size-6" aria-hidden />
          </button>
          <button ref={nextButton} type="button" onClick={() => scroll(1)} disabled={!view.canNext} aria-label="Next photos" className={`${arrow} right-2 md:-right-4`}>
            <ChevronRight className="size-6" aria-hidden />
          </button>
        </>
      )}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
