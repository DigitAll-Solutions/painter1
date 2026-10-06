import {defineArrayMember, defineField, defineType} from 'sanity'
import {Inbox} from 'lucide-react'

const ro = {readOnly: true}

// One per estimate request, written by the server (ID "lead.<uuid>", private: never served by the
// public API). Saved before the email is sent, so a failed email never loses the lead.
export const lead = defineType({
  name: 'lead',
  title: 'Lead',
  type: 'document',
  icon: Inbox,
  readOnly: true,
  fields: [
    defineField({name: 'location', type: 'string', ...ro, description: 'Location slug'}),
    defineField({name: 'submittedAt', type: 'datetime', ...ro}),
    defineField({name: 'pageUrl', type: 'url', ...ro}),
    defineField({name: 'testMode', type: 'boolean', ...ro, description: 'True while LEAD_TEST_RECIPIENT is set'}),
    defineField({
      name: 'answers',
      type: 'object',
      ...ro,
      fields: [
        defineField({name: 'service', type: 'string'}),
        defineField({name: 'areas', type: 'array', of: [defineArrayMember({type: 'string'})]}),
        defineField({name: 'areasOther', type: 'string'}),
        defineField({name: 'timeline', type: 'string'}),
      ],
    }),
    defineField({name: 'message', type: 'text', ...ro, description: "The customer's own message"}),
    defineField({name: 'description', type: 'text', ...ro, description: 'The Message block exactly as emailed'}),
    defineField({
      name: 'contact',
      type: 'object',
      ...ro,
      fields: ['firstName', 'lastName', 'email', 'phone'].map((name) => defineField({name, type: 'string'})),
    }),
    defineField({
      name: 'address',
      type: 'object',
      ...ro,
      fields: ['street', 'city', 'state', 'zip'].map((name) => defineField({name, type: 'string'})),
    }),
    defineField({
      name: 'attribution',
      type: 'object',
      ...ro,
      fields: ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'channel', 'channeldrilldown1', 'channeldrilldown2', 'channeldrilldown3', 'landingpage', 'landingpagegroup'].map((name) =>
        defineField({name, type: 'string'}),
      ),
    }),
    defineField({
      name: 'consents',
      title: 'Consent record',
      type: 'array',
      ...ro,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'consent',
          fields: [
            defineField({name: 'name', type: 'string'}),
            defineField({name: 'checked', type: 'boolean'}),
            defineField({name: 'text', type: 'text', description: 'Exactly as shown to the visitor'}),
            defineField({name: 'textHash', type: 'string', description: 'SHA-256 of the text'}),
          ],
          preview: {select: {title: 'name', subtitle: 'textHash'}},
        }),
      ],
    }),
    defineField({name: 'ip', title: 'IP address', type: 'string', ...ro}),
    defineField({name: 'userAgent', type: 'string', ...ro}),
    defineField({
      name: 'email',
      type: 'object',
      ...ro,
      fields: [
        defineField({name: 'status', type: 'string', description: 'pending · sent · failed (…) · skipped (…)'}),
        defineField({name: 'mode', type: 'string', description: 'test · live · refused (…)'}),
        defineField({name: 'subject', type: 'string'}),
        defineField({name: 'body', type: 'text', rows: 20}),
        defineField({name: 'resendId', type: 'string'}),
        defineField({name: 'error', type: 'string'}),
        defineField({name: 'sentAt', type: 'datetime'}),
      ],
    }),
  ],
  orderings: [{title: 'Newest first', name: 'submittedAtDesc', by: [{field: 'submittedAt', direction: 'desc'}]}],
  preview: {
    select: {first: 'contact.firstName', last: 'contact.lastName', location: 'location', at: 'submittedAt', status: 'email.status', test: 'testMode'},
    prepare: ({first, last, location, at, status, test}) => ({
      title: `${test ? '[TEST] ' : ''}${[first, last].filter(Boolean).join(' ') || 'Lead'} — ${location ?? ''}`,
      subtitle: `${at ? new Date(at).toLocaleString('en-US') : ''} · email: ${status ?? '—'}`,
    }),
  },
})
