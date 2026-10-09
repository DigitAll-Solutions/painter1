// Launch checklist for one location: what onboarding still needs before (and after) it goes live.
// Pure function over the raw location document (as Studio holds it), so the per-location view and
// the Onboarding overview always agree. Tested in location-checklist.test.ts.
import { slugError, slugWarning } from '../sanity/lib/location-slugs.ts'

export type Level = 'required' | 'recommended' | 'optional'
export type CheckItem = {
  id: string
  area: 'Basics' | 'Owner' | 'Homepage' | 'Services' | 'Photos' | 'Reviews' | 'Leads & consent' | 'SEO'
  label: string
  level: Level
  ok: boolean
  /** Why it matters / what's there now */
  detail?: string
  /** Field to open, e.g. "address.city" */
  path?: string
}

type Img = { asset?: { _ref?: string } } | undefined
type Gallery = { asset?: { _ref?: string }; services?: { _ref?: string }[]; notLocalProject?: boolean }
type Pair = { before?: Img; after?: Img }
type Detail = { title?: string; beforeImage?: Img; afterImage?: Img; transformations?: Pair[] } | undefined
type Block = { children?: { text?: string }[] }
export type LocationDoc = {
  name?: string
  slug?: { current?: string }
  locationType?: string
  phone?: string
  email?: string
  businessHours?: string[]
  address?: { street?: string; city?: string; state?: string; zip?: string }
  serviceCities?: string[]
  socialLinks?: Record<string, string | undefined>
  ownerName?: string
  ownerPhoto?: Img
  ownerBio?: string
  franchiseStructure?: string
  teamMembers?: unknown[]
  heroImage?: Img
  transformationBeforeImage?: Img
  transformationAfterImage?: Img
  services?: Partial<Record<ServiceKey, Detail>>
  galleryImages?: Gallery[]
  reviews?: unknown[]
  reviewsCount?: number
  rating?: number
  trustindexWidgetId?: string
  leadEmailSubject?: string
  leadEmailTemplate?: string
  hasScheduling?: boolean
  schedulingUrl?: string
  consentBlocks?: { name?: string; body?: Block[] }[]
  metaTitle?: string
  metaDescription?: string
}

export const SERVICE_KEYS = ['interior', 'exterior', 'cabinet'] as const
export type ServiceKey = (typeof SERVICE_KEYS)[number]
const SERVICE_LABEL: Record<ServiceKey, string> = { interior: 'Interior', exterior: 'Exterior', cabinet: 'Cabinet' }
/** Recent Work on a service page shows from this many photos */
export const MIN_RECENT_WORK = 3

const has = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null)
const hasImage = (img: Img) => Boolean(img?.asset?._ref)
const consentText = (blocks?: Block[]) => (blocks ?? []).flatMap((b) => b.children ?? []).map((c) => c.text ?? '').join(' ')

/**
 * @param recipients number of lead recipients in the private leads.<id> document (null = unknown)
 * @param serviceKeys service document _id → interior | exterior | cabinet
 * @param warrantyRecipients number of warranty recipients in the same document (null = unknown)
 */
export function locationChecklist(doc: LocationDoc, recipients: number | null, serviceKeys: Record<string, string>, warrantyRecipients: number | null = null): CheckItem[] {
  const items: CheckItem[] = []
  const add = (item: CheckItem) => items.push(item)
  const maintenance = doc.locationType === 'maintenance'
  const slug = doc.slug?.current

  // Basics
  add({ id: 'name', area: 'Basics', label: 'Business name', level: 'required', ok: has(doc.name), path: 'name' })
  const slugProblem = slugError(slug)
  const slugNote = slugWarning(slug)
  add({ id: 'slug', area: 'Basics', label: 'URL slug matches the live site', level: 'required', ok: !slugProblem && !slugNote, detail: slugProblem ?? slugNote ?? (slug ? `/${slug}` : undefined), path: 'slug' })
  add({ id: 'city', area: 'Basics', label: 'City', level: 'required', ok: has(doc.address?.city), detail: 'Used in every page title', path: 'address.city' })
  add({ id: 'state', area: 'Basics', label: 'State', level: 'required', ok: has(doc.address?.state), detail: 'Groups the location in the Studio', path: 'address.state' })
  add({ id: 'phone', area: 'Basics', label: 'Phone', level: 'required', ok: has(doc.phone), detail: 'Header and every call button', path: 'phone' })
  add({ id: 'email', area: 'Basics', label: 'Public email', level: 'recommended', ok: has(doc.email), path: 'email' })
  add({ id: 'street', area: 'Basics', label: 'Street address', level: 'recommended', ok: has(doc.address?.street), path: 'address.street' })
  add({ id: 'serviceCities', area: 'Basics', label: 'Service cities', level: 'recommended', ok: has(doc.serviceCities), detail: `${doc.serviceCities?.length ?? 0} listed`, path: 'serviceCities' })
  add({ id: 'hours', area: 'Basics', label: 'Business hours', level: 'recommended', ok: has(doc.businessHours), path: 'businessHours' })
  add({ id: 'social', area: 'Basics', label: 'Social links', level: 'optional', ok: Object.values(doc.socialLinks ?? {}).some(has), path: 'socialLinks' })

  // Owner
  add({ id: 'ownerName', area: 'Owner', label: 'Owner name', level: 'recommended', ok: has(doc.ownerName), path: 'ownerName' })
  add({ id: 'ownerPhoto', area: 'Owner', label: 'Owner photo', level: 'recommended', ok: hasImage(doc.ownerPhoto), path: 'ownerPhoto' })
  add({ id: 'ownerBio', area: 'Owner', label: 'Owner bio (About page)', level: 'optional', ok: has(doc.ownerBio), path: 'ownerBio' })
  if (doc.franchiseStructure === 'owner-with-team') add({ id: 'team', area: 'Owner', label: 'Team members', level: 'recommended', ok: has(doc.teamMembers), path: 'teamMembers' })

  // Homepage
  add({ id: 'hero', area: 'Homepage', label: 'Hero image', level: 'recommended', ok: hasImage(doc.heroImage), path: 'heroImage' })
  add({
    id: 'transformation',
    area: 'Homepage',
    label: 'Before/after slider photos',
    level: 'recommended',
    ok: hasImage(doc.transformationBeforeImage) && hasImage(doc.transformationAfterImage),
    detail: 'The section hides without both',
    path: 'transformationBeforeImage',
  })

  // Services and photos (growth locations only: maintenance locations have no service pages)
  const local = (doc.galleryImages ?? []).filter((g) => !g.notLocalProject)
  if (!maintenance) {
    for (const key of SERVICE_KEYS) {
      const detail = doc.services?.[key]
      add({ id: `title-${key}`, area: 'Services', label: `${SERVICE_LABEL[key]}: menu title`, level: 'required', ok: has(detail?.title), path: `services.${key}.title` })
      // Before/after pairs (the legacy single pair counts until it's migrated)
      const pairs = (detail?.transformations ?? []).filter((p) => hasImage(p.before) && hasImage(p.after))
      const allPairs = pairs.length ? pairs : hasImage(detail?.beforeImage) && hasImage(detail?.afterImage) ? [{ before: detail?.beforeImage, after: detail?.afterImage }] : []
      add({
        id: `pair-${key}`,
        area: 'Services',
        label: `${SERVICE_LABEL[key]}: before/after photos`,
        level: 'recommended',
        ok: allPairs.length > 0,
        detail: allPairs.length ? `${allPairs.length} pair${allPairs.length === 1 ? '' : 's'}` : undefined,
        path: `services.${key}.transformations`,
      })
      const slider = new Set(allPairs.flatMap((p) => [p.before?.asset?._ref, p.after?.asset?._ref]).filter(Boolean))
      const tagged = local.filter((g) => g.services?.some((s) => s._ref && serviceKeys[s._ref] === key))
      const recent = tagged.filter((g) => !slider.has(g.asset?._ref)).length
      add({
        id: `photos-${key}`,
        area: 'Photos',
        label: `${SERVICE_LABEL[key]} photos`,
        level: 'recommended',
        ok: recent >= MIN_RECENT_WORK,
        detail: `${tagged.length} tagged, ${recent} for Recent Work (shows from ${MIN_RECENT_WORK})`,
        path: 'galleryImages',
      })
    }
  }
  const hidden = (doc.galleryImages ?? []).length - local.length
  add({ id: 'gallery', area: 'Photos', label: 'Gallery photos', level: 'recommended', ok: local.length > 0, detail: `${local.length} shown${hidden ? `, ${hidden} hidden (not local)` : ''}`, path: 'galleryImages' })

  // Reviews
  add({ id: 'reviews', area: 'Reviews', label: 'Reviews (at least 3)', level: 'recommended', ok: (doc.reviews?.length ?? 0) >= 3, detail: `${doc.reviews?.length ?? 0} entered`, path: 'reviews' })
  add({ id: 'rating', area: 'Reviews', label: 'Rating and review count', level: 'recommended', ok: doc.rating != null && doc.reviewsCount != null, path: 'rating' })
  add({ id: 'trustindex', area: 'Reviews', label: 'Trustindex widget ID', level: 'optional', ok: has(doc.trustindexWidgetId), path: 'trustindexWidgetId' })

  // Leads & consent
  add({
    id: 'recipients',
    area: 'Leads & consent',
    label: 'Lead recipients',
    level: 'required',
    ok: (recipients ?? 0) > 0,
    detail: recipients == null ? 'Not checked' : `${recipients} recipient${recipients === 1 ? '' : 's'} (in the private Email recipients document)`,
  })
  // Warranty requests never go to Client Tether, so they need their own list (growth locations have the page)
  if (!maintenance)
    add({
      id: 'warrantyRecipients',
      area: 'Leads & consent',
      label: 'Warranty recipients',
      level: 'required',
      ok: (warrantyRecipients ?? 0) > 0,
      detail: warrantyRecipients == null ? 'Not checked' : `${warrantyRecipients} recipient${warrantyRecipients === 1 ? '' : 's'} (in the private Email recipients document)`,
    })
  const blocks = doc.consentBlocks ?? []
  add({ id: 'consent', area: 'Leads & consent', label: 'Consent checkboxes', level: 'required', ok: blocks.length > 0, detail: 'Without them the form says "please call us"', path: 'consentBlocks' })
  // Consent must name THIS business: the {locationName} placeholder, or the location's own name
  const wrongName = blocks
    .map((b) => consentText(b.body))
    .flatMap((text) => [...text.matchAll(/Painter1 of ([A-Z][\w .'-]*?)(?=\s(?:at|regarding|about|to|and|for)\b|[.,;:]|$)/g)].map((m) => `Painter1 of ${m[1]}`))
    .filter((name) => name !== doc.name)
  if (blocks.length)
    add({
      id: 'consentName',
      area: 'Leads & consent',
      label: 'Consent names this business',
      level: 'required',
      ok: wrongName.length === 0,
      detail: wrongName.length ? `Mentions "${wrongName[0]}": use {locationName}` : 'Uses {locationName} or this name',
      path: 'consentBlocks',
    })
  add({ id: 'subject', area: 'Leads & consent', label: 'Lead email subject', level: 'required', ok: has(doc.leadEmailSubject), path: 'leadEmailSubject' })
  add({ id: 'template', area: 'Leads & consent', label: 'Lead email template', level: 'required', ok: has(doc.leadEmailTemplate), path: 'leadEmailTemplate' })
  if (doc.hasScheduling)
    add({
      id: 'booking',
      area: 'Leads & consent',
      label: 'Booking page (online scheduling is on)',
      level: 'recommended',
      ok: has(doc.schedulingUrl),
      detail: doc.schedulingUrl ? undefined : 'Buttons go to the survey and "Pick a time now" is hidden until it is set',
      path: 'schedulingUrl',
    })

  // SEO (automatic values exist)
  add({ id: 'meta', area: 'SEO', label: 'Custom homepage title / description', level: 'optional', ok: has(doc.metaTitle) || has(doc.metaDescription), detail: 'Automatic values are used when empty', path: 'metaDescription' })

  return items
}

export const missing = (items: CheckItem[], level: Level) => items.filter((item) => item.level === level && !item.ok)
