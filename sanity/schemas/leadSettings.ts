import {defineArrayMember, defineField, defineType} from 'sanity'
import {Mail} from 'lucide-react'

// Private per-location lead recipients. Document ID is "leads.<location document id>": IDs with a
// dot are never served by the public API, so staff addresses stay off the public dataset.
// Opened from Studio's "Lead recipients" list; never created from the new-document menu.
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
        'Every estimate request is emailed to all of these (one email, like the old Fluent Forms notification). Include the Client Tether parse address. Only used when live sending is switched on.',
      of: [defineArrayMember({type: 'string', validation: (rule) => rule.email()})],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {recipients: 'leadRecipients', id: '_id'},
    prepare: ({recipients, id}) => ({title: `Lead recipients (${(recipients as string[] | undefined)?.length ?? 0})`, subtitle: String(id).replace(/^drafts\./, '')}),
  },
})
