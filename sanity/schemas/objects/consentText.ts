import {defineArrayMember, defineType} from 'sanity'

// Consent checkbox text: paragraphs with italic/bold and links (e.g. to the Terms and Conditions)
export const consentText = defineType({
  name: 'consentText',
  title: 'Consent text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [
          {title: 'Italic', value: 'em'},
          {title: 'Bold', value: 'strong'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{name: 'href', type: 'url', title: 'URL', validation: (rule) => rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']})}],
          },
        ],
      },
    }),
  ],
})
