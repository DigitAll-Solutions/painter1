import Link from '@/components/IntentLink'

import { estimateHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

// Vertical tab pinned to the right edge on tablet/desktop; phones get the bottom bar instead.
// Always the free-estimate survey, also where the main buttons go to the booking page (Rick, Oct 16).
export default function FloatingCta({ location }: { location: Location }) {
  // In a landmark (aside), like the phone bar, so no content sits outside a region
  return (
    <aside aria-label="Free estimate" className="hidden sm:block">
      <Link
        href={estimateHref(location)}
        className="fixed top-1/2 right-0 z-30 -translate-y-1/2 rounded-l-2xl bg-cta px-3 py-6 text-sm font-extrabold tracking-[0.12em] text-white uppercase shadow-xl transition-colors [writing-mode:vertical-rl] hover:bg-cta-dark"
      >
        Free Estimate
      </Link>
    </aside>
  )
}
