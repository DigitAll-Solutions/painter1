import Link from 'next/link'
import { CalendarCheck, Phone } from 'lucide-react'

import { getCta, telHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

// Always-visible call + estimate buttons on phones, where the header CTA is hidden.
export default function MobileCtaBar({ location }: { location: Location }) {
  const cta = getCta(location)
  const tel = telHref(location.phone)

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-slate-200 bg-white p-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:hidden">
      {tel && (
        <a href={tel} className="mr-1 flex items-center justify-center gap-2 rounded-lg bg-brand-blue py-3 font-bold text-white">
          <Phone className="size-5" aria-hidden /> Call Now
        </a>
      )}
      <Link
        href={cta.href}
        className={`flex items-center justify-center gap-2 rounded-lg bg-brand-orange py-3 font-bold text-white ${tel ? 'ml-1' : 'col-span-2'}`}
      >
        <CalendarCheck className="size-5" aria-hidden /> Free Estimate
      </Link>
    </div>
  )
}
