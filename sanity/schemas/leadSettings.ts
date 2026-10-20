import {defineArrayMember, defineField, defineType} from 'sanity'
import {Mail} from 'lucide-react'

import {canEditLeadRecipients} from '../lib/lead-recipient-editors'

// Private per-location lead recipients. Document ID is "leads.<location document id>": IDs with a
// dot are never served by the public API, so staff addresses stay off the public dataset.
// Opened from the location folder's "Lead recipients" item; never created from the new-document menu.
// Read-only in the Studio for everyone but the people in sanity/lib/lead-recipient-editors.ts (a Studio
// guard: the Free plan has no per-document permissions).
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
      validation: (rule) => rule.min(1),
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
