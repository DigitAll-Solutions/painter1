import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import Section from '../Section'
import TrustindexWidget from '../TrustindexWidget'
import type { Location } from '@/sanity/lib/types'

export default function ReviewsSection({ location }: { location: Location }) {
  if (!location.trustindexWidgetId) return null

  return (
    <Section eyebrow="Real Google Reviews" title="What Your Neighbors Are Saying">
      <TrustindexWidget widgetId={location.trustindexWidgetId} />
      {location.locationType !== 'maintenance' && (
        <div className="mt-8 text-center">
          <Link
            href={`/${location.slug}/reviews`}
            className="inline-flex items-center gap-2 text-lg font-bold text-brand-blue-text hover:underline"
          >
            Read All Reviews <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      )}
    </Section>
  )
}
