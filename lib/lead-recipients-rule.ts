// Studio validation for a location's private Lead recipients document (sanity/schemas/leadSettings.ts).
// No recipients blocks publishing only for a live location (LIVE_LOCATIONS); everywhere else it's a
// warning, so locations can be published before their Client Tether address exists. Tested in
// lead-recipients-rule.test.ts.
import { isLiveLocation } from './indexing.ts'

export const NO_RECIPIENTS_LIVE =
  'This location is live: add at least one recipient (the Client Tether parse address), otherwise its estimate requests are not emailed to anyone.'
export const NO_RECIPIENTS_NOT_LIVE =
  'No recipients yet: estimate requests for this location are not emailed to anyone. Add the Client Tether parse address before the location goes live.'

/** The location document's id for a "leads.<location id>" document (draft prefix ignored) */
export const locationIdOf = (leadSettingsId: string | undefined) => (leadSettingsId ?? '').replace(/^drafts\./, '').replace(/^leads\./, '')

/** No recipients: an error for a live location, a warning for any other; otherwise nothing */
export function recipientsProblem(recipients: unknown[] | undefined, slug: string | null | undefined): 'error' | 'warning' | null {
  if ((recipients ?? []).filter(Boolean).length > 0) return null
  return slug && isLiveLocation(slug) ? 'error' : 'warning'
}
