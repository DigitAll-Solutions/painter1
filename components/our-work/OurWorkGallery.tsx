'use client'

import { useEffect, useRef, useState, type MouseEvent, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import type { WorkFilter } from '@/lib/our-work-filters'

export type GalleryItem = {
  key: string
  filters: WorkFilter[]
  /** Server-rendered grid card */
  card: ReactNode
  /** Server-rendered large view, mounted only while the lightbox shows it */
  large: ReactNode
  title: string
  caption?: string
}

export type Chip = { key: WorkFilter | null; label: string; href: string; count: number }

type Props = {
  items: GalleryItem[]
  chips: Chip[]
  /** The filter this page was rendered for (the ?service= value), or null for All */
  initialFilter: WorkFilter | null
  pageSize?: number
}

const chipBase =
  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue'
const iconButton =
  'flex size-11 items-center justify-center rounded-full bg-mist text-ink transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue'

const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

/**
 * Filter chips, grid, "Load more" and lightbox. Everything is server-rendered first:
 * - without JavaScript, chips are links to the prebuilt filter pages, a <noscript> style shows every
 *   card, and each card links to its large image
 * - with JavaScript, chips filter in place (URL updated with replaceState), 12 cards show at a time,
 *   and cards open a modal <dialog> (Esc closes, ←/→ move, focus returns to the card)
 */
export default function OurWorkGallery({ items, chips, initialFilter, pageSize = 12 }: Props) {
  const [filter, setFilter] = useState<WorkFilter | null>(initialFilter)
  const [limit, setLimit] = useState(pageSize)
  const [open, setOpen] = useState<number | null>(null)
  const revealFrom = useRef<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const listItems = useRef(new Map<string, HTMLLIElement>())
  const grid = useRef<HTMLUListElement>(null)

  const matches = items.filter((item) => !filter || item.filters.includes(filter))
  const shown = matches.slice(0, limit)
  const shownKeys = new Set(shown.map((item) => item.key))
  const hiddenMatches = new Set(matches.slice(limit).map((item) => item.key))
  const current = open === null ? undefined : shown[open]

  const choose = (e: MouseEvent<HTMLAnchorElement>, chip: Chip) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    setFilter(chip.key)
    setLimit(pageSize)
    window.history.replaceState(null, '', chip.href)
  }

  const loadMore = () => {
    revealFrom.current = limit
    setLimit(limit + pageSize)
  }

  // After Load more, move focus to the first newly revealed card so keyboard users continue from there
  useEffect(() => {
    if (revealFrom.current === null) return
    const item = matches[revealFrom.current]
    revealFrom.current = null
    if (item) listItems.current.get(item.key)?.focus()
  }, [limit, matches])

  // Deferred card photos (SanityImage `deferred`) get their src only when they come within 200px of
  // the viewport, so nothing below the first screen downloads while the page is still painting.
  // Cards hidden by a filter or Load more never intersect until they're shown.
  useEffect(() => {
    const images = grid.current?.querySelectorAll<HTMLImageElement>('img[data-src]')
    if (!images?.length) return
    const load = (img: HTMLImageElement) => {
      if (img.dataset.srcset) img.srcset = img.dataset.srcset
      if (img.dataset.src) img.src = img.dataset.src
      delete img.dataset.srcset
      delete img.dataset.src
    }
    if (!('IntersectionObserver' in window)) {
      images.forEach(load)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          load(entry.target as HTMLImageElement)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '200px 0px' },
    )
    images.forEach((img) => observer.observe(img))
    return () => observer.disconnect()
  }, [])

  // Delegated click: any [data-lightbox] link in a card opens the lightbox instead of the image
  const onGridClick = (e: MouseEvent<HTMLUListElement>) => {
    const link = (e.target as Element).closest<HTMLElement>('[data-lightbox]')
    const key = link?.closest<HTMLElement>('li[data-key]')?.dataset.key
    if (!link || !key || !isPlainClick(e)) return
    const index = shown.findIndex((item) => item.key === key)
    if (index < 0) return
    e.preventDefault()
    trigger.current = link
    setOpen(index)
  }

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open !== null && !el.open) {
      el.showModal()
      closeButton.current?.focus()
    }
    if (open === null && el.open) el.close()
  }, [open])

  // Native close (Esc, close button): clear state and give focus back to the card that opened it
  const onClose = () => {
    setOpen(null)
    trigger.current?.focus()
  }

  const step = (direction: 1 | -1) => setOpen((index) => (index === null ? null : (index + direction + shown.length) % shown.length))

  const onDialogKey = (e: KeyboardEvent<HTMLDialogElement>) => {
    // Arrow keys on the before/after slider's range input move the divider, not the lightbox
    if ((e.target as HTMLElement).matches('input[type="range"]')) return
    if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
    else return
    e.preventDefault()
  }

  // Keep the trigger in sync with navigation, so focus returns to the card being viewed
  useEffect(() => {
    if (open === null || !current) return
    const link = listItems.current.get(current.key)?.querySelector<HTMLElement>('[data-lightbox]')
    if (link) trigger.current = link
  }, [open, current])

  return (
    <div>
      <nav aria-label="Filter projects by service">
        <ul className="flex flex-wrap justify-center gap-2">
          {chips.map((chip) => {
            const active = chip.key === filter
            return (
              <li key={chip.label}>
                <a
                  href={chip.href}
                  onClick={(e) => choose(e, chip)}
                  aria-current={active ? 'page' : undefined}
                  className={`${chipBase} ${active ? 'bg-navy text-white ring-navy' : 'bg-white text-ink ring-slate-300 hover:bg-mist'}`}
                >
                  {chip.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-mist text-slate-700'}`}>
                    {chip.count}
                    <span className="sr-only"> {chip.count === 1 ? 'project' : 'projects'}</span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <p className="mt-6 text-center text-sm text-slate-600" aria-live="polite">
        {shown.length < matches.length ? `Showing ${shown.length} of ${matches.length} projects` : `${matches.length} ${matches.length === 1 ? 'project' : 'projects'}`}
      </p>

      {/* Every card is in the HTML. Other filters' cards get the hidden attribute; cards past the limit get
          the "hidden" class instead, which the <noscript> style can override (Tailwind's [hidden] rule is a
          layered !important that an unlayered style can't beat). */}
      <ul ref={grid} className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" onClick={onGridClick}>
        {items.map((item) => (
          <li
            key={item.key}
            data-key={item.key}
            data-more={hiddenMatches.has(item.key) ? '' : undefined}
            hidden={!shownKeys.has(item.key) && !hiddenMatches.has(item.key)}
            tabIndex={-1}
            ref={(el) => {
              if (el) listItems.current.set(item.key, el)
              else listItems.current.delete(item.key)
            }}
            className={`scroll-mt-28 outline-none ${hiddenMatches.has(item.key) ? 'hidden' : ''}`}
          >
            {item.card}
          </li>
        ))}
      </ul>

      {matches.length > limit && (
        <div className="our-work-more mt-10 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-xl bg-navy px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            Load more projects
          </button>
        </div>
      )}
      <noscript dangerouslySetInnerHTML={{ __html: '<style>li[data-more]{display:block!important}.our-work-more{display:none!important}</style>' }} />

      <dialog
        ref={dialog}
        onClose={onClose}
        onKeyDown={onDialogKey}
        aria-labelledby="our-work-lightbox-title"
        className="m-auto max-h-[calc(100dvh-1rem)] w-[min(calc(100%-1rem),72rem)] overflow-y-auto rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/85"
      >
        {current && (
          <div className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="our-work-lightbox-title" className="text-lg font-extrabold md:text-2xl">
                  {current.title || 'Project photo'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {open! + 1} of {shown.length}
                </p>
              </div>
              <button ref={closeButton} type="button" onClick={() => setOpen(null)} aria-label="Close" className={iconButton}>
                <X className="size-6" aria-hidden />
              </button>
            </div>
            <div className="mt-4" key={current.key}>
              {current.large}
            </div>
            {current.caption && <p className="mx-auto mt-4 max-w-3xl text-slate-700">{current.caption}</p>}
            {shown.length > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button type="button" onClick={() => step(-1)} aria-label="Previous project" className={iconButton}>
                  <ChevronLeft className="size-6" aria-hidden />
                </button>
                <p className="hidden text-sm text-slate-600 sm:block">Use ← and → to browse, Esc to close</p>
                <button type="button" onClick={() => step(1)} aria-label="Next project" className={iconButton}>
                  <ChevronRight className="size-6" aria-hidden />
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  )
}
