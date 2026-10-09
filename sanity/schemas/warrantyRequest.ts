import {defineArrayMember, defineField, defineType} from 'sanity'
import {Wrench} from 'lucide-react'

const ro = {readOnly: true}

// One per warranty repair request, written by the server (ID "warrantyRequest.<uuid>", private: never
// served by the public API). Saved before the email is sent. Emailed only to the location's warranty
// recipients, never to Client Tether (it would create a fake new lead).
export const warrantyRequest = defineType({
  name: 'warrantyRequest',
  title: 'Warranty request',
  type: 'document',
  icon: Wrench,
  readOnly: true,
  fields: [
    defineField({name: 'location', type: 'reference', to: [{type: 'location'}], ...ro, description: 'The location the request was sent to.'}),
    defineField({name: 'submittedAt', type: 'datetime', ...ro, description: 'When the customer pressed Submit.'}),
    defineField({name: 'pageUrl', type: 'url', ...ro, description: 'The page the form was submitted from.'}),
    defineField({name: 'testMode', type: 'boolean', ...ro, description: 'True while LEAD_TEST_RECIPIENT is set'}),
    defineField({
      name: 'contact',
      type: 'object',
      ...ro,
      description: 'Personal data: only people allowed to see lead data should have Studio access.',
      fields: ['firstName', 'lastName', 'email', 'phone'].map((name) => defineField({name, type: 'string'})),
    }),
    defineField({name: 'propertyAddress', title: 'Address of the painted property', type: 'string', ...ro}),
    defineField({name: 'projectDate', title: 'Approx. date of original project', type: 'string', ...ro, description: 'Month and year, as entered.'}),
    defineField({name: 'area', type: 'string', ...ro, description: 'Interior · Exterior · Cabinets · Other'}),
    defineField({name: 'issue', title: 'What are you seeing?', type: 'text', ...ro}),
    defineField({name: 'hasContract', title: 'Has the original signed contract', type: 'boolean', ...ro}),
    defineField({
      name: 'photos',
      type: 'array',
      ...ro,
      description: 'Uploaded by the customer (resized in their browser).',
      of: [defineArrayMember({type: 'image'})],
    }),
    defineField({name: 'ip', title: 'IP address', type: 'string', ...ro}),
    defineField({name: 'userAgent', type: 'string', ...ro}),
    defineField({
      name: 'email',
      title: 'Warranty email',
      type: 'object',
      ...ro,
      description: 'The notification email exactly as sent, and what happened to it.',
      fields: [
        defineField({name: 'status', type: 'string', description: 'pending · sent · failed (…) · skipped (…)'}),
        defineField({name: 'mode', type: 'string', description: 'test · live · refused (…)'}),
        defineField({name: 'subject', type: 'string'}),
        defineField({name: 'recipients', type: 'array', of: [defineArrayMember({type: 'string'})], description: 'Who it was (or would be) sent to: the warranty recipients, never Client Tether.'}),
        defineField({name: 'body', type: 'text', rows: 20}),
        defineField({name: 'messageId', title: 'Brevo message ID', type: 'string'}),
        // Planned Resend integration, never used for sending; hidden unless an old document has it
        defineField({name: 'resendId', type: 'string', hidden: ({value}) => !value}),
        defineField({name: 'error', type: 'string'}),
        defineField({name: 'sentAt', type: 'datetime'}),
      ],
    }),
  ],
  orderings: [{title: 'Newest first', name: 'submittedAtDesc', by: [{field: 'submittedAt', direction: 'desc'}]}],
  preview: {
    select: {first: 'contact.firstName', last: 'contact.lastName', city: 'location.address.city', at: 'submittedAt', area: 'area', test: 'testMode', media: 'photos.0'},
    prepare: ({first, last, city, at, area, test, media}) => ({
      title: `${test ? '[TEST] ' : ''}${[first, last].filter(Boolean).join(' ') || 'Warranty request'} — ${city ?? ''}`,
      subtitle: `${at ? new Date(at).toLocaleString('en-US') : ''}${area ? ` · ${area}` : ''}`,
      media,
    }),
  },
})
