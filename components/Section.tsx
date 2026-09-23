import type { ReactNode } from 'react'

type Props = {
  id?: string
  eyebrow?: string
  title?: ReactNode
  intro?: ReactNode
  className?: string
  children: ReactNode
}

export default function Section({ id, eyebrow, title, intro, className = 'bg-white', children }: Props) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        {(eyebrow || title || intro) && (
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
            {eyebrow && <p className="text-sm font-bold uppercase tracking-wider text-brand-orange">{eyebrow}</p>}
            {title && <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance md:text-4xl">{title}</h2>}
            {intro && <div className="mt-4 text-lg text-slate-600">{intro}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
