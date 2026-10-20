// Who may change a location's lead recipients in the Studio (Sanity user IDs, from Manage → Members).
// On the Free plan everyone who edits is an Administrator, and Sanity has no per-document permissions
// below Enterprise, so this is a Studio guard, not access control: anyone with an Administrator login
// or an editor API token could still change the document through the API. It stops accidental edits
// (and deleting the document) by everyone else in the Studio.
export const LEAD_RECIPIENT_EDITORS: readonly string[] = [
  'pQLEHelgs', // Sagar Bharvadiya
]

export const canEditLeadRecipients = (user: { id?: string } | null | undefined) => Boolean(user?.id && LEAD_RECIPIENT_EDITORS.includes(user.id))
