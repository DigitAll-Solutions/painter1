import type { PortableTextBlock } from 'next-sanity'

export type SanityImage = {
  alt?: string
  hotspot?: { x: number; y: number; height: number; width: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  asset: {
    _id: string
    metadata?: {
      lqip?: string
      dimensions?: { width: number; height: number; aspectRatio: number }
    }
  }
}

export type GalleryImage = SanityImage & {
  _key: string
  caption?: string
  /** Overlay text on the Recent Work slider (max 60 chars) */
  title?: string
  projectType?: string
  area?: string
  /** _ids of the service documents this photo is tagged with */
  services?: string[]
  /** "Hide: not a local project": never shown anywhere */
  notLocalProject?: boolean
  commercial?: boolean
  /** A before and an after photo with the same projectId form one before/after card */
  projectId?: string
  role?: 'before' | 'after'
  /** Map-ready: municipality (empty = the location's city) and position */
  city?: string
  geo?: { lat: number; lng: number }
}

export type Transformation = {
  _key: string
  before?: SanityImage
  after?: SanityImage
  title?: string
  projectType?: string
  area?: string
}

export type ServiceDetail = {
  title: string
  summary?: string
  description?: string
  cardBullets?: string[]
  /** Legacy single pair, read until the migration moves it into transformations[0] */
  beforeImage?: SanityImage
  afterImage?: SanityImage
  /** "See The Transformation" before/after pairs, first one first */
  transformations?: Transformation[]
  transformationBody?: string
  metaTitle?: string
  metaDescription?: string
  /** Crew-at-work photo for this location's service page hero */
  heroImage?: SanityImage
  highlights?: string[]
  process?: { _key: string; title: string; description?: string; items?: string[] }[]
  subServices?: { _key: string; title: string; anchor?: string; description?: string; image?: SanityImage }[]
  /** This location's own photo per What We Paint surface, keyed to the surface's _key */
  surfacePhotos?: { _key: string; surface: string; image: SanityImage }[]
  images?: (SanityImage & { _key: string })[]
}

export type Review = {
  _key: string
  reviewText: string
  reviewerName: string
  rating?: number
  reviewDate?: string
  source?: string
  /** _ids of the service documents this review is tagged with */
  services?: string[]
  /** Legacy string tag from the WordPress import: interior | exterior | cabinet | general */
  serviceTag?: string
  neighborhoodTag?: string
  teamMemberMentioned?: string
}

export type TeamMember = {
  _key: string
  name: string
  jobTitle: string
  withOwnerSince?: string
  bio?: string
  photo?: SanityImage
  namedInReviews?: boolean
}

export type Location = {
  _id: string
  name: string
  slug: string
  locationType: 'growth' | 'maintenance'
  tagline?: string
  phone?: string
  email?: string
  address?: { street?: string; city?: string; state?: string; zip?: string }
  serviceArea?: string
  serviceCities?: string[]
  businessHours?: string[]
  socialLinks?: { facebook?: string; google?: string; instagram?: string; yelp?: string; youtube?: string }
  ownerName?: string
  ownerBio?: string
  ownerPhoto?: SanityImage
  ownerPronoun?: 'he' | 'she' | 'they'
  ownerSinceYear?: string
  ownerBackground?: string
  ownerPersonalLine?: string
  ownerQuote?: string
  ownerQuoteAttribution?: string
  ownerActionPhoto?: SanityImage & { caption?: string }
  franchiseStructure?: 'owner-led' | 'owner-with-team'
  teamMembers?: TeamMember[]
  projectsCount?: number
  interiorProjectsCount?: number
  exteriorProjectsCount?: number
  heroHeadline?: string
  heroSubtitleVariant?: 'auto' | 'established' | 'standard'
  transformationBeforeImage?: SanityImage
  transformationAfterImage?: SanityImage
  transformationBody?: string
  intro?: string
  yearsInBusiness?: number
  whyChooseUs?: string[]
  processSteps?: { _key: string; title: string; description?: string }[]
  aboutSections?: { _key: string; heading?: string; body?: string }[]
  services?: { interior?: ServiceDetail; exterior?: ServiceDetail; cabinet?: ServiceDetail }
  heroImage?: SanityImage
  heroVideo?: { asset?: { url: string; mimeType?: string } }
  galleryImages?: GalleryImage[]
  reviews?: Review[]
  reviewsCount?: number
  rating?: number
  trustindexWidgetId?: string
  hasScheduling?: boolean
  schedulingUrl?: string
  /** Where Schedule CTAs go: the survey (default) or the booking page directly */
  bookingTarget?: 'survey' | 'booking'
  warranty?: PortableTextBlock[]
  warrantyEyebrow?: string
  warrantyHeading?: string
  warrantyBody?: string
  warrantyButtonLabel?: string
  warrantyCtaHref?: string
  warrantyPdf?: { asset?: { url?: string; originalFilename?: string } }
  warrantyResponseTime?: string
  warrantyImage?: SanityImage
  warrantyGraphic?: SanityImage
  privacyPolicy?: PortableTextBlock[]
  leadEmailSubject?: string
  leadEmailTemplate?: string
  leadConfirmationMessage?: string
  consentBlocks?: ConsentBlock[]
  estimateSurvey?: { _ref: string }
  metaTitle?: string
  metaDescription?: string
  ourWorkPage?: { metaTitle?: string; metaDescription?: string; intro?: string }
}

export type PaintSurface = {
  _key: string
  icon?: string
  title: string
  /** Card text */
  description?: string
  /** Anchor id; derived from the title when missing (older data) */
  slug?: string
  /** Section text (Portable Text). Photos are per location: ServiceDetail.surfacePhotos */
  body?: PortableTextBlock[]
}

export type ServiceLocationKey = 'interior' | 'exterior' | 'cabinet'

export type Service = {
  _id: string
  title: string
  slug: string
  shortName: string
  locationKey: ServiceLocationKey
  heroSubtitle?: string
  heroImage?: SanityImage
  metaDescription?: string
  ownerCardVariant?: 'featured' | 'compact'
  transformationHeading?: string
  transformationBody?: string
  processIntro?: string
  prepIntro?: string
  prepBullets?: string[]
  materialsBody?: PortableTextBlock[]
  materialsBlocks?: { _key: string; title: string; body?: PortableTextBlock[] }[]
  warrantyBannerBody?: string
  whatWePaintTitle?: string
  /** Surfaces: each is a card at the top of What We Paint and its own section below (#slug) */
  whatWePaint?: PaintSurface[]
  faqs?: { _key: string; question: string; answer: string }[]
}

export type ConsentBlock = { _key: string; name: string; body: PortableTextBlock[] }

/** Shared network warranty terms (document "warranty-terms"). **x** = bold (accent color in headings). */
export type WarrantyTerms = {
  title?: string
  heroIntro?: string
  heroIntroNoOwner?: string
  stats?: { _key: string; icon?: 'calendar' | 'shield' | 'wrench' | 'user'; title: string; body?: string }[]
  coveredHeading?: string
  covered?: string[]
  requirementsHeading?: string
  requirementsIntro?: string
  requirements?: string[]
  repairsEyebrow?: string
  repairsHeading?: string
  repairs?: string[]
  exclusionsEyebrow?: string
  exclusionsHeading?: string
  exclusionsIntro?: string
  exclusions?: { _key: string; text: string; editorNote?: string }[]
  sameEverywhere?: string
  requestEyebrow?: string
  requestHeading?: string
  requestIntro?: string
  steps?: string[]
  disclaimer?: string
  contractNote?: string
  contractNoteConfirmed?: boolean
}
