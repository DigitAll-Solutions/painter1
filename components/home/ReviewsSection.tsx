import ReviewCards from '../ReviewCards'
import Section from '../Section'
import TrustindexWidget from '../TrustindexWidget'
import { homepageReviews } from '@/lib/reviews'
import type { Location } from '@/sanity/lib/types'

// Trustindex gives the live rating badge + carousel; the Sanity reviews below it are the
// same kind of content as real HTML, which is what search engines and AI tools can read.
export default function ReviewsSection({ location }: { location: Location }) {
  const widgetId = location.trustindexWidgetId
  const reviews = homepageReviews(location)
  if (!widgetId && !reviews.length) return null

  return (
    <Section id="reviews" eyebrow="Real Google Reviews" title="What Your Neighbors Are Saying">
      {widgetId && <TrustindexWidget widgetId={widgetId} />}
      {reviews.length > 0 && (
        <div className={widgetId ? 'mt-10' : ''}>
          <ReviewCards reviews={reviews} />
        </div>
      )}
    </Section>
  )
}
