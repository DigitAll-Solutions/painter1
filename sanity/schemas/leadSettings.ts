import {defineArrayMember, defineField, defineType} from 'sanity'
import {Mail} from 'lucide-react'

// Private per-location lead recipients. Document ID is "leads.<location document id>": IDs with a
// dot are never served by the public API, so staff addresses stay off the public dataset.
// Opened from the location folder's "Email recipients" item; never created from the new-document menu.
export const leadSettings = defineType({
  name: 'leadSettings',
  title: 'Email recipients',
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
    defineField({
      name: 'warrantyRecipients',
      title: 'Warranty request recipients',
      type: 'array',
      description:
        'Warranty repair requests (/warranty form) go to these addresses only. Never add the Client Tether parse address: a warranty request would turn into a fake new lead (the site removes any @parse.clienttether.com address anyway).',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => [
            rule.email(),
            rule.custom((value?: string) => (value && /@parse\.clienttether\.com$/i.test(value) ? 'Client Tether would turn warranty requests into new leads: use a staff address.' : true)),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {recipients: 'leadRecipients', warranty: 'warrantyRecipients', id: '_id'},
    prepare: ({recipients, warranty, id}) => ({
      title: `Email recipients (${(recipients as string[] | undefined)?.length ?? 0} lead, ${(warranty as string[] | undefined)?.length ?? 0} warranty)`,
      subtitle: String(id).replace(/^drafts\./, ''),
    }),
  },
})
