import {defineArrayMember, defineField, defineType} from 'sanity'
import {Link2, ShieldCheck} from 'lucide-react'

// One franchise-wide privacy notice (document ID "privacy-policy"), rendered at
// /<location>/privacy-policy with the location's name and contact details filled in.
// Anchor items keep the live page's link targets (#infocollect, #uslaws, #communication-opt-in, …).
export const privacyPolicy = defineType({
  name: 'privacyPolicy',
  title: 'Privacy Policy',
  type: 'document',
  icon: ShieldCheck,
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Privacy Policy', description: 'Page heading.'}),
    defineField({
      name: 'body',
      type: 'array',
      description:
        'Tokens: {locationName} (e.g. "Painter1 of Knoxville"), {phone}, {email}. "Anchor" items are link targets (e.g. #communication-opt-in, which the Google Ads form links to); keep them.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
          ],
          lists: [{title: 'Bullet', value: 'bullet'}],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Underline', value: 'underline'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{name: 'href', type: 'string', title: 'URL or #anchor'}],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'privacyAnchor',
          title: 'Anchor',
          icon: Link2,
          fields: [defineField({name: 'id', type: 'string', description: 'Link target id, e.g. "uslaws" for #uslaws.', validation: (rule) => rule.required()})],
          preview: {select: {id: 'id'}, prepare: ({id}) => ({title: `#${id}`})},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title'}, prepare: ({title}) => ({title: title || 'Privacy Policy'})},
})
