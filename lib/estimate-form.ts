// Field names shared by the survey form and its server action

/** Hidden attribution fields, named exactly as in Fluent Forms #73 (Attributer fills the channel ones) */
export const ATTRIBUTION_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'gclid',
  'channel',
  'channeldrilldown1',
  'channeldrilldown2',
  'channeldrilldown3',
  'landingpage',
  'landingpagegroup',
] as const

/** URL parameters kept across pages (sessionStorage) so they reach the estimate form */
export const URL_ATTRIBUTION = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'] as const
export const ATTRIBUTION_STORAGE_KEY = 'p1-attribution'

/** Honeypot field name: unusual on purpose so browser autofill never fills it */
export const HONEYPOT_FIELD = 'p1_hp_website'
