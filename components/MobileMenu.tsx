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

export default function MobileMenu({ links, cta, phone, tel }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex size-11 items-center justify-center rounded-lg border border-slate-200 text-ink"
      >
        {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
      </button>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-white md:top-20">
          <nav aria-label="Mobile" className="px-4 py-6">
            <ul className="divide-y divide-slate-100 text-lg font-semibold">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={close} className="block py-3.5 hover:text-brand-blue">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3">
              <Link href={cta.href} onClick={close} className="rounded-lg bg-brand-orange px-6 py-4 text-center text-lg font-bold text-white">
                {cta.label}
              </Link>
              {tel && (
                <a
                  href={tel}
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-6 py-4 text-lg font-bold text-white"
                >
                  <Phone className="size-5" aria-hidden /> Call {phone}
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
