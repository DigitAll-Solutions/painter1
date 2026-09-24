import Link from 'next/link'

import { getCta } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

// Vertical tab pinned to the right edge on tablet/desktop; phones get the bottom bar instead.
export default function FloatingCta({ location }: { location: Location }) {
  const cta = getCta(location)
  return (
    <Link
      href={cta.href}
      className="fixed top-1/2 right-0 z-30 hidden -translate-y-1/2 rounded-l-2xl bg-brand-orange px-3 py-6 text-sm font-extrabold tracking-[0.12em] text-white uppercase shadow-xl transition-colors [writing-mode:vertical-rl] hover:bg-brand-orange-dark sm:block"
    >
      Free Estimate
    </Link>
  )
}
