'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'

import type { NavLink } from '@/lib/location'

type Props = {
  links: NavLink[]
  cta: NavLink
  phone?: string
  tel?: string
}

// Full-screen sheet on phones, dropdown panel on desktop.
export default function NavMenu({ links, cta, phone, tel }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.classList.add('max-lg:overflow-hidden')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('max-lg:overflow-hidden')
    }
  }, [open])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-2.5 font-semibold text-ink hover:border-slate-300"
      >
        {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        <span className="hidden lg:inline">Menu</span>
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close menu" onClick={close} className="fixed inset-0 top-16 hidden bg-ink/30 md:top-20 lg:block" />
          <div
            id="site-menu"
            className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-white md:top-20 lg:absolute lg:inset-x-auto lg:top-full lg:right-4 lg:bottom-auto lg:mt-2 lg:w-80 lg:rounded-2xl lg:shadow-xl lg:ring-1 lg:ring-slate-200"
          >
            <nav aria-label="Main" className="px-4 py-6 lg:p-4">
              <ul className="divide-y divide-slate-100 text-lg font-semibold lg:text-base">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={close} className="block py-3.5 hover:text-brand-blue lg:py-2.5">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid gap-3 lg:mt-4">
                <Link
                  href={cta.href}
                  onClick={close}
                  className="rounded-lg bg-brand-orange px-6 py-4 text-center text-lg font-bold text-white hover:bg-brand-orange-dark lg:py-3"
                >
                  {cta.label}
                </Link>
                {tel && (
                  <a
                    href={tel}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-brand-blue px-6 py-3.5 text-lg font-bold text-brand-blue lg:py-2.5"
                  >
                    <Phone className="size-5" aria-hidden /> Call {phone}
                  </a>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
