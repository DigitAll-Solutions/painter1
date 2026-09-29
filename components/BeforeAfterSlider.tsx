'use client'

import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { ArrowLeftRight } from 'lucide-react'

type Props = { before: ReactNode; after: ReactNode; className?: string }

const chip = 'pointer-events-none absolute top-4 z-10 rounded-md bg-ink/85 px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase'

// Drag anywhere on the image (mouse or touch) to move the divider. touch-action: pan-y keeps
// vertical page scrolling working on phones; a visually hidden range input handles keyboard use.
export default function BeforeAfterSlider({ before, after, className = '' }: Props) {
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)
  const box = useRef<HTMLDivElement>(null)

  const moveTo = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect()
    if (!rect) return
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
  }
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    moveTo(e.clientX)
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => dragging.current && moveTo(e.clientX)
  const onUp = () => {
    dragging.current = false
  }

  return (
    <div
      ref={box}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`group relative isolate cursor-ew-resize touch-pan-y overflow-hidden rounded-3xl bg-mist shadow-[0_20px_50px_-20px_rgb(11_27_51/0.35)] select-none ${className}`}
    >
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {before}
      </div>

      <span className={`${chip} left-4`}>Before</span>
      <span className={`${chip} right-4`}>After</span>

      <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-orange text-white shadow-lg ring-4 ring-white/70 group-has-focus-visible:ring-brand-blue">
          <ArrowLeftRight className="size-5" aria-hidden />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Before and after comparison — use arrow keys to reveal more of either photo"
        className="sr-only"
      />
    </div>
  )
}
