import {defineArrayMember, defineField, defineType} from 'sanity'
import {ShieldCheck} from 'lucide-react'

const MARKUP = 'Put **double asterisks** around words to bold them (in headings: show them in the accent color).'
const TOKENS = 'Tokens: {city}, {ownerFull} (owner full name), {locationName}.'

// One warranty for the whole network (document ID "warranty-terms"): every location's /warranty page
// shows these terms; only the owner, photo, contact details and PDF come from the location.
export const warrantyTerms = defineType({
  name: 'warrantyTerms',
  title: 'Warranty terms',
  type: 'document',
  icon: ShieldCheck,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'terms', title: 'Terms'},
    {name: 'exclusions', title: 'Exclusions'},
    {name: 'request', title: 'Repair request'},
  ],
  fields: [
    // Hero
    defineField({name: 'title', type: 'string', group: 'hero', description: `Page heading (H1). ${MARKUP}`, validation: (rule) => rule.required()}),
    defineField({name: 'heroIntro', type: 'text', rows: 3, group: 'hero', description: `Intro under the heading. ${TOKENS}`, validation: (rule) => rule.required()}),
    defineField({name: 'heroIntroNoOwner', title: 'Hero intro (no owner name)', type: 'text', rows: 3, group: 'hero', description: `Used when the location has no owner name. ${TOKENS}`}),

    // Terms
    defineField({
      name: 'stats',
      title: 'Stat cards',
      type: 'array',
      group: 'terms',
      description: 'The four cards under the owner quote.',
      validation: (rule) => rule.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({
              name: 'icon',
              type: 'string',
              description: 'Icon on the card.',
              options: {list: [{title: 'Calendar', value: 'calendar'}, {title: 'Shield', value: 'shield'}, {title: 'Wrench', value: 'wrench'}, {title: 'Person', value: 'user'}]},
            }),
            defineField({name: 'title', type: 'string', description: 'Big text, e.g. "24 months".', validation: (rule) => rule.required()}),
            defineField({name: 'body', type: 'text', rows: 2, description: 'One sentence.'}),
          ],
          preview: {select: {title: 'title', subtitle: 'body'}},
        }),
      ],
    }),
    defineField({name: 'coveredHeading', title: "What's covered: heading", type: 'string', group: 'terms', description: 'Card heading.'}),
    defineField({name: 'covered', title: "What's covered", type: 'array', group: 'terms', description: `One paragraph each. ${MARKUP}`, of: [defineArrayMember({type: 'text', rows: 2})]}),
    defineField({name: 'requirementsHeading', title: 'Requirements: heading', type: 'string', group: 'terms', description: 'Card heading.'}),
    defineField({name: 'requirementsIntro', title: 'Requirements: intro', type: 'string', group: 'terms', description: 'Line above the numbered list.'}),
    defineField({name: 'requirements', type: 'array', group: 'terms', description: 'Numbered list.', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'repairsEyebrow', title: 'Repairs: eyebrow', type: 'string', group: 'terms', description: 'Small heading above.'}),
    defineField({name: 'repairsHeading', title: 'Repairs: heading', type: 'string', group: 'terms', description: MARKUP}),
    defineField({name: 'repairs', title: 'Repairs: bullets', type: 'array', group: 'terms', description: 'How covered repairs work.', of: [defineArrayMember({type: 'string'})]}),

    // Exclusions
    defineField({name: 'exclusionsEyebrow', type: 'string', group: 'exclusions', description: 'Small heading above.'}),
    defineField({name: 'exclusionsHeading', type: 'string', group: 'exclusions', description: MARKUP}),
    defineField({name: 'exclusionsIntro', type: 'string', group: 'exclusions', description: 'Line under the heading.'}),
    defineField({
      name: 'exclusions',
      type: 'array',
      group: 'exclusions',
      description: 'Shown in three columns, left to right.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'exclusion',
          fields: [
            defineField({name: 'text', type: 'string', description: 'As shown on the page.', validation: (rule) => rule.required()}),
            defineField({name: 'editorNote', type: 'string', description: 'For editors only; never shown on the site (e.g. "Confirm for network").'}),
          ],
          preview: {select: {title: 'text', subtitle: 'editorNote'}, prepare: ({title, subtitle}) => ({title, subtitle: subtitle ? `Editor note: ${subtitle}` : undefined})},
        }),
      ],
    }),
    defineField({name: 'sameEverywhere', title: 'Same-at-every-location note', type: 'string', group: 'exclusions', description: 'Line under the exclusions.'}),

    // Request
    defineField({name: 'requestEyebrow', type: 'string', group: 'request', description: 'Small heading above the form section.'}),
    defineField({name: 'requestHeading', type: 'string', group: 'request', description: MARKUP}),
    defineField({name: 'requestIntro', type: 'text', rows: 2, group: 'request', description: 'Text beside the form.'}),
    defineField({name: 'steps', title: 'Steps', type: 'array', group: 'request', description: `Numbered steps beside the form. ${MARKUP} The location's response time (if set) follows the last step.`, of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'disclaimer', type: 'string', group: 'request', description: `Small print at the bottom of the page. ${TOKENS}`}),
    defineField({
      name: 'contractNote',
      title: 'Contract note',
      type: 'string',
      group: 'request',
      description: 'Shown after the disclaimer only when confirmed below.',
    }),
    defineField({
      name: 'contractNoteConfirmed',
      title: 'Contract note confirmed by corporate',
      type: 'boolean',
      group: 'request',
      initialValue: false,
      description: 'Leave off until corporate confirms the wording; the note stays hidden until then.',
    }),
  ],
  preview: {prepare: () => ({title: 'Warranty terms', subtitle: 'Shared by every location'})},
})
