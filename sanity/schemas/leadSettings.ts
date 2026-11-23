import {defineArrayMember, defineField, defineType, type ValidationContext} from 'sanity'
import {Mail} from 'lucide-react'

import {canEditLeadRecipients} from '../lib/lead-recipient-editors'
import {STUDIO_API_VERSION} from '../components/useSiteData'
import {locationIdOf, NO_RECIPIENTS_LIVE, NO_RECIPIENTS_NOT_LIVE, recipientsProblem} from '../../lib/lead-recipients-rule'

// Private per-location lead recipients. Document ID is "leads.<location document id>": IDs with a
// dot are never served by the public API, so staff addresses stay off the public dataset.
// Opened from the location folder's "Lead recipients" item; never created from the new-document menu.
// Read-only in the Studio for everyone but the people in sanity/lib/lead-recipient-editors.ts (a Studio
// guard: the Free plan has no per-document permissions).
// No recipients: an error (blocks publishing) only for a live location, a warning for the others
async function problem(value: unknown, context: ValidationContext) {
  const recipients = value as string[] | undefined
  if (recipients?.some(Boolean)) return null
  const id = locationIdOf(context.document?._id)
  const slug = await context
    .getClient({apiVersion: STUDIO_API_VERSION})
    .fetch<string | null>(`coalesce(*[_id == $id][0].slug.current, *[_id == $draft][0].slug.current)`, {id, draft: `drafts.${id}`})
  return recipientsProblem(recipients, slug)
}

export const leadSettings = defineType({
  name: 'leadSettings',
  title: 'Lead recipients',
  type: 'document',
  icon: Mail,
  fields: [
    defineField({
      name: 'leadRecipients',
      title: 'Recipients',
      type: 'array',
      description:
        '⚠ Managed by the website developer: ask them to add, change or remove an address. Every estimate request for this location is emailed to all of these, including the Client Tether parse address (…@parse.clienttether.com), which turns each email into a lead. A wrong or missing address means leads silently stop reaching the team or Client Tether. Empty: no emails are sent for this location. Only used when live sending is switched on.',
      readOnly: ({currentUser}) => !canEditLeadRecipients(currentUser),
      of: [defineArrayMember({type: 'string', validation: (rule) => rule.email()})],
      validation: (rule) => [
        rule.custom(async (value, context) => ((await problem(value, context)) === 'error' ? NO_RECIPIENTS_LIVE : true)),
        rule.custom(async (value, context) => ((await problem(value, context)) === 'warning' ? NO_RECIPIENTS_NOT_LIVE : true)).warning(),
      ],
    }),
  ],
  preview: {
    select: {recipients: 'leadRecipients', id: '_id'},
    prepare: ({recipients, id}) => ({
      title: `Lead recipients (${(recipients as string[] | undefined)?.length ?? 0})`,
      subtitle: String(id).replace(/^drafts\./, ''),
    }),
  },
})
