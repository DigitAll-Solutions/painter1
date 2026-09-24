import {defineArrayMember, defineField, defineType} from 'sanity'
import {altField} from './objects/altField'
import {MapPin} from 'lucide-react'

const imageWithAlt = (name: string, title?: string) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    fields: [altField],
  })

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  icon: MapPin,
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'owner', title: 'Owner'},
    {name: 'content', title: 'Page content'},
    {name: 'services', title: 'Services'},
    {name: 'media', title: 'Images'},
    {name: 'reviews', title: 'Reviews'},
    {name: 'scheduling', title: 'Scheduling'},
    {name: 'legal', title: 'Warranty & privacy'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // Basics
    defineField({name: 'name', type: 'string', group: 'basics', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'basics',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'locationType',
      type: 'string',
      group: 'basics',
      description: 'Maintenance locations only show the homepage and About page in the navigation.',
      options: {
        list: [
          {title: 'Growth', value: 'growth'},
          {title: 'Maintenance', value: 'maintenance'},
        ],
        layout: 'radio',
      },
      initialValue: 'growth',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'tagline', type: 'string', group: 'basics'}),
    defineField({name: 'phone', type: 'string', group: 'basics'}),
    defineField({name: 'email', type: 'string', group: 'basics', validation: (rule) => rule.email()}),
    defineField({
      name: 'address',
      type: 'object',
      group: 'basics',
      fields: [
        defineField({name: 'street', type: 'string'}),
        defineField({name: 'city', type: 'string'}),
        defineField({name: 'state', type: 'string'}),
        defineField({name: 'zip', type: 'string'}),
      ],
    }),
    defineField({name: 'serviceArea', type: 'string', group: 'basics', description: 'Short summary, e.g. "Knoxville & East Tennessee".'}),
    defineField({
      name: 'serviceCities',
      title: 'Service cities',
      type: 'array',
      group: 'basics',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'businessHours',
      type: 'array',
      group: 'basics',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'socialLinks',
      type: 'object',
      group: 'basics',
      fields: [
        defineField({name: 'facebook', type: 'url'}),
        defineField({name: 'google', type: 'url'}),
        defineField({name: 'instagram', type: 'url'}),
        defineField({name: 'yelp', type: 'url'}),
        defineField({name: 'youtube', type: 'url'}),
      ],
    }),

    // Owner
    defineField({name: 'ownerName', type: 'string', group: 'owner'}),
    defineField({name: 'ownerBio', type: 'text', rows: 12, group: 'owner'}),
    {...imageWithAlt('ownerPhoto'), group: 'owner'},

    // Page content
    defineField({name: 'heroHeadline', type: 'string', group: 'content'}),
    defineField({name: 'heroSubheadline', type: 'text', rows: 2, group: 'content'}),
    defineField({name: 'intro', title: 'Welcome text', type: 'text', rows: 6, group: 'content'}),
    defineField({name: 'yearsInBusiness', type: 'number', group: 'content'}),
    defineField({
      name: 'whyChooseUs',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'processSteps',
      title: 'How it works',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', type: 'text', rows: 2}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'aboutSections',
      title: 'About page sections',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'aboutSection',
          fields: [
            defineField({name: 'heading', type: 'string'}),
            defineField({name: 'body', type: 'text', rows: 6}),
          ],
        }),
      ],
    }),

    // Services
    defineField({
      name: 'services',
      type: 'object',
      group: 'services',
      fields: [
        defineField({name: 'interior', type: 'serviceDetail'}),
        defineField({name: 'exterior', type: 'serviceDetail'}),
        defineField({name: 'cabinet', type: 'serviceDetail'}),
      ],
    }),

    // Images
    {...imageWithAlt('heroImage'), group: 'media'},
    defineField({
      name: 'heroVideo',
      type: 'file',
      group: 'media',
      description: 'Optional muted background video for the homepage hero. The hero image is used as its poster.',
      options: {accept: 'video/mp4,video/webm'},
    }),
    defineField({
      name: 'galleryImages',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            altField,
            defineField({name: 'caption', type: 'string'}),
            defineField({
              name: 'serviceType',
              type: 'string',
              description: 'Used to filter the Our Work gallery.',
              options: {
                list: [
                  {title: 'Interior', value: 'interior'},
                  {title: 'Exterior', value: 'exterior'},
                  {title: 'Cabinet', value: 'cabinet'},
                  {title: 'Commercial', value: 'commercial'},
                ],
              },
            }),
          ],
        }),
      ],
    }),

    // Reviews
    defineField({
      name: 'testimonials',
      type: 'array',
      group: 'reviews',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'testimonial',
          fields: [
            defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'text', type: 'text', rows: 4, validation: (rule) => rule.required()}),
            defineField({name: 'rating', type: 'number', validation: (rule) => rule.min(1).max(5)}),
            defineField({name: 'location', type: 'string'}),
            defineField({name: 'date', type: 'date'}),
            defineField({name: 'source', type: 'string', options: {list: ['Google', 'Facebook', 'Yelp', 'Other']}}),
          ],
          preview: {select: {title: 'name', subtitle: 'text'}},
        }),
      ],
    }),
    defineField({name: 'reviewsCount', type: 'number', group: 'reviews'}),
    defineField({name: 'rating', type: 'number', group: 'reviews', validation: (rule) => rule.min(0).max(5)}),
    defineField({name: 'trustindexWidgetId', type: 'string', group: 'reviews'}),

    // Scheduling
    defineField({
      name: 'hasScheduling',
      type: 'boolean',
      group: 'scheduling',
      description: 'When on, every CTA says "Schedule Estimate" and links to the scheduling URL.',
      initialValue: false,
    }),
    defineField({
      name: 'schedulingUrl',
      type: 'url',
      group: 'scheduling',
      hidden: ({document}) => !document?.hasScheduling,
    }),

    // Warranty & privacy
    defineField({name: 'warranty', type: 'blockContent', group: 'legal'}),
    defineField({name: 'privacyPolicy', type: 'blockContent', group: 'legal'}),

    // SEO
    defineField({name: 'metaTitle', type: 'string', group: 'seo'}),
    defineField({name: 'metaDescription', type: 'text', rows: 3, group: 'seo'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'locationType', media: 'ownerPhoto'},
  },
})
