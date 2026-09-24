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
  serviceType?: 'interior' | 'exterior' | 'cabinet' | 'commercial'
}

export type ServiceDetail = {
  title: string
  summary?: string
  description?: string
  highlights?: string[]
  process?: { _key: string; title: string; description?: string; items?: string[] }[]
  subServices?: { _key: string; title: string; description?: string; image?: SanityImage }[]
  images?: (SanityImage & { _key: string })[]
}

export type Testimonial = {
  _key: string
  name: string
  text: string
  rating?: number
  location?: string
  date?: string
  source?: string
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
  heroHeadline?: string
  heroSubheadline?: string
  intro?: string
  yearsInBusiness?: number
  whyChooseUs?: string[]
  processSteps?: { _key: string; title: string; description?: string }[]
  aboutSections?: { _key: string; heading?: string; body?: string }[]
  services?: { interior?: ServiceDetail; exterior?: ServiceDetail; cabinet?: ServiceDetail }
  heroImage?: SanityImage
  heroVideo?: { asset?: { url: string; mimeType?: string } }
  galleryImages?: GalleryImage[]
  testimonials?: Testimonial[]
  reviewsCount?: number
  rating?: number
  trustindexWidgetId?: string
  hasScheduling?: boolean
  schedulingUrl?: string
  warranty?: PortableTextBlock[]
  warrantyImage?: SanityImage
  privacyPolicy?: PortableTextBlock[]
  metaTitle?: string
  metaDescription?: string
}
