import type { ReactNode } from 'react'

type Props = {
  id?: string
  eyebrow?: string
  title?: ReactNode
  intro?: ReactNode
  className?: string
  children: ReactNode
}

/** Highlight one word of a heading in brand blue */
export const Accent = ({ children }: { children: ReactNode }) => <span className="text-brand-blue">{children}</span>

export default function Section({ id, eyebrow, title, intro, className = 'bg-white', children }: Props) {
  return (
    <section id={id} className={`relative isolate py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        {(eyebrow || title || intro) && (
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
            {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-orange-text">{eyebrow}</p>}
            {title && (
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">{title}</h2>
            )}
            {intro && <div className="mt-5 text-lg text-slate-500">{intro}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
