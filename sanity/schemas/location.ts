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
    {name: 'leads', title: 'Leads'},
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
    defineField({
      name: 'ownerPronoun',
      type: 'string',
      group: 'owner',
      description: 'Used in the "Why homeowners call…" copy (e.g. "He does every estimate himself").',
      options: {
        list: [
          {title: 'He / his', value: 'he'},
          {title: 'She / her', value: 'she'},
          {title: 'They / their', value: 'they'},
        ],
        layout: 'radio',
      },
      initialValue: 'he',
    }),
    defineField({name: 'ownerSinceYear', title: 'Owner since (year)', type: 'string', group: 'owner', validation: (rule) => rule.regex(/^\d{4}$/, {name: 'year'})}),
    defineField({
      name: 'ownerBackground',
      type: 'text',
      rows: 2,
      group: 'owner',
      description: 'Completes "…opened Painter1 of [City] in [Year] after ___". E.g. "15 years running crews for a Knoxville remodeler".',
    }),
    defineField({name: 'ownerPersonalLine', type: 'text', rows: 2, group: 'owner', description: 'One personal line shown on the owner card for teams.'}),
    defineField({
      name: 'ownerQuote',
      type: 'text',
      rows: 3,
      group: 'owner',
      description: "The owner's own words — recorded, not written for them.",
    }),
    defineField({name: 'ownerQuoteAttribution', type: 'string', group: 'owner', description: 'Defaults to "[Owner Full Name], Owner".'}),
    {
      ...defineField({
        name: 'ownerActionPhoto',
        title: 'Owner on the job photo',
        type: 'image',
        options: {hotspot: true},
        description: 'Owner doing an estimate or walkthrough. Falls back to the owner photo.',
        fields: [
          altField,
          defineField({name: 'caption', type: 'string', description: 'E.g. "Sequoyah Hills estimate · May 2026"'}),
        ],
      }),
      group: 'owner',
    },
    defineField({
      name: 'franchiseStructure',
      type: 'string',
      group: 'owner',
      description: 'Owner-led: the owner runs every estimate and job. Owner with team: the owner plus 1–2 named estimators or leads.',
      options: {
        list: [
          {title: 'Owner-led', value: 'owner-led'},
          {title: 'Owner with team', value: 'owner-with-team'},
        ],
        layout: 'radio',
      },
      initialValue: 'owner-led',
    }),
    defineField({
      name: 'teamMembers',
      type: 'array',
      group: 'owner',
      hidden: ({document}) => document?.franchiseStructure !== 'owner-with-team',
      validation: (rule) => rule.max(2),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'teamMember',
          fields: [
            defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'jobTitle', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'withOwnerSince', title: 'With owner since (year)', type: 'string', validation: (rule) => rule.regex(/^\d{4}$/, {name: 'year'})}),
            defineField({name: 'bio', type: 'text', rows: 2, description: 'One or two lines: background, specialty.'}),
            defineField({name: 'photo', type: 'image', options: {hotspot: true}, fields: [altField]}),
            defineField({name: 'namedInReviews', title: 'Named in Google reviews', type: 'boolean', initialValue: false}),
          ],
          preview: {select: {title: 'name', subtitle: 'jobTitle', media: 'photo'}},
        }),
      ],
    }),
    defineField({name: 'projectsCount', type: 'number', group: 'owner'}),
    defineField({name: 'interiorProjectsCount', type: 'number', group: 'owner'}),
    defineField({name: 'exteriorProjectsCount', type: 'number', group: 'owner'}),

    // Page content
    defineField({name: 'heroHeadline', type: 'string', group: 'content'}),
    defineField({
      name: 'heroSubtitleVariant',
      title: 'Hero subtitle',
      type: 'string',
      group: 'content',
      description:
        'Auto shows "[City] homeowners have trusted us with [projects]+ projects since [year]" once both Projects count and Owner since are filled, otherwise "Locally owned by [owner]…". Established falls back to standard while that data is missing.',
      options: {
        list: [
          {title: 'Auto', value: 'auto'},
          {title: 'Established (projects + year)', value: 'established'},
          {title: 'Standard (locally owned)', value: 'standard'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
    }),
    {
      ...imageWithAlt('transformationBeforeImage', 'Transformation: before image'),
      group: 'content',
      description: 'Before/after slider under the hero. Use a pair shot from the same angle. The section hides if either image is missing.',
    },
    {...imageWithAlt('transformationAfterImage', 'Transformation: after image'), group: 'content'},
    defineField({
      name: 'transformationBody',
      type: 'text',
      rows: 5,
      group: 'content',
      description: 'Copy beside the slider. "[City]" is replaced with the location city.',
    }),
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
            defineField({
              name: 'services',
              type: 'array',
              description: 'Service pages this photo appears on (Recent Work).',
              of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
            }),
            defineField({
              name: 'title',
              type: 'string',
              description: 'Shown over the bottom of the photo, e.g. Exterior repaint in Farragut',
              validation: (rule) => rule.max(60),
            }),
            defineField({name: 'projectType', type: 'string', description: 'Caption, first part, e.g. "Exterior Repaint".'}),
            defineField({name: 'area', type: 'string', description: 'Caption, second part, e.g. "Farragut". Shown as "Exterior Repaint, Farragut".'}),
            defineField({name: 'caption', type: 'string'}),
            defineField({
              name: 'serviceType',
              type: 'string',
              hidden: true,
              readOnly: true,
              description: 'Legacy tag, replaced by Services.',
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
      name: 'reviews',
      type: 'array',
      group: 'reviews',
      description: 'Rendered as real HTML with Review schema (search engines and AI tools cannot read the Trustindex widget).',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'review',
          fields: [
            defineField({name: 'reviewText', type: 'text', rows: 4, validation: (rule) => rule.required()}),
            defineField({name: 'reviewerName', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'rating', type: 'number', initialValue: 5, validation: (rule) => rule.min(1).max(5).integer()}),
            defineField({name: 'reviewDate', type: 'date'}),
            defineField({name: 'source', type: 'string', initialValue: 'Google', options: {list: ['Google', 'Facebook', 'Yelp', 'Other']}}),
            defineField({
              name: 'services',
              type: 'array',
              description: 'Service pages this review appears on. Leave empty for general reviews.',
              of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
            }),
            defineField({
              name: 'serviceTag',
              type: 'string',
              hidden: true,
              readOnly: true,
              description: 'Legacy tag, replaced by Services.',
              options: {
                list: [
                  {title: 'Interior', value: 'interior'},
                  {title: 'Exterior', value: 'exterior'},
                  {title: 'Cabinet', value: 'cabinet'},
                  {title: 'General', value: 'general'},
                ],
                layout: 'radio',
              },
            }),
            defineField({name: 'neighborhoodTag', type: 'string', description: 'Optional, e.g. "Farragut" or "Sequoyah Hills".'}),
            defineField({name: 'teamMemberMentioned', type: 'string', description: 'Names mentioned in the review, e.g. "Jarrod Davenport, Charlie".'}),
          ],
          preview: {select: {title: 'reviewerName', subtitle: 'reviewText'}},
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

    // Leads (free-estimate survey). Recipients are NOT here: this dataset is public, so they live in
    // the private "Lead recipients" document (Studio → Lead recipients).
    defineField({
      name: 'leadEmailSubject',
      title: 'Lead email subject',
      type: 'string',
      group: 'leads',
      description: 'Subject of the estimate-request email, e.g. "Painter1.com - Get Free Estimate - Form Submission".',
    }),
    defineField({
      name: 'leadEmailTemplate',
      title: 'Lead email template',
      type: 'text',
      rows: 18,
      group: 'leads',
      description:
        "Plain-text body, copied exactly from this location's Fluent Forms notification. Placeholders: {submission.source_url}, {inputs.names.first_name}, {inputs.names.last_name}, {inputs.email}, {inputs.phone}, {inputs.input_text} (street), {inputs.input_text_1} (city), {inputs.input_text_2} (state), {inputs.input_text_3} (zip), {inputs.description} (survey answers + message), {inputs.utm_source}, {inputs.utm_medium}, {inputs.utm_campaign}, {inputs.gclid}, {inputs.channel}, {inputs.channeldrilldown1}–{inputs.channeldrilldown3}, {inputs.landingpage}, {inputs.landingpagegroup}. Client Tether parses this email: change it only on purpose.",
    }),
    defineField({
      name: 'leadConfirmationMessage',
      title: 'Confirmation message',
      type: 'string',
      group: 'leads',
      description: 'Shown after a successful request, under "Thanks, {first name}!".',
      initialValue: 'Thank you for your message. We will get in touch with you shortly',
    }),
    defineField({
      name: 'consentBlocks',
      title: 'Consent checkboxes',
      type: 'array',
      group: 'leads',
      description: 'Each item is one required, unchecked checkbox on the last survey step. The name is stored with every lead as the consent record.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'consentBlock',
          fields: [
            defineField({name: 'name', type: 'string', description: 'Stable key, e.g. "terms-n-condition".', validation: (rule) => rule.required()}),
            defineField({name: 'body', type: 'consentText', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'name'}},
        }),
      ],
    }),
    defineField({
      name: 'estimateSurvey',
      title: 'Estimate survey',
      type: 'reference',
      to: [{type: 'estimateSurvey'}],
      group: 'leads',
      description: 'Leave empty to use the default survey.',
    }),

    // Warranty & privacy
    defineField({name: 'warranty', type: 'blockContent', group: 'legal'}),
    {...imageWithAlt('warrantyImage'), group: 'legal', description: 'Photo shown beside the warranty banner on the homepage.'},
    defineField({
      name: 'warrantyEyebrow',
      title: 'Homepage warranty: eyebrow',
      type: 'string',
      group: 'legal',
      description: 'Leave blank for the default: "2 Year Workmanship Warranty".',
    }),
    defineField({
      name: 'warrantyHeading',
      title: 'Homepage warranty: heading',
      type: 'string',
      group: 'legal',
      description: 'Leave blank for the default: "Coverage You Get in Writing".',
    }),
    defineField({
      name: 'warrantyBody',
      title: 'Homepage warranty: body',
      type: 'text',
      rows: 4,
      group: 'legal',
      description: 'Leave blank for the default two-year peel/blister/flake coverage text.',
    }),
    defineField({
      name: 'warrantyButtonLabel',
      title: 'Homepage warranty: button label',
      type: 'string',
      group: 'legal',
      description: `Leave blank for the default: "See What's Covered".`,
    }),
    defineField({
      name: 'warrantyCtaHref',
      title: 'Warranty button link',
      type: 'string',
      group: 'legal',
      description: 'Leave empty to use the default estimate link',
    }),
    {
      ...imageWithAlt('warrantyGraphic', 'Homepage warranty: graphic'),
      group: 'legal',
      description: 'Shown beside the warranty copy on the homepage. Leave blank for the default blue paint fan-deck illustration.',
    },
    defineField({
      name: 'privacyPolicy',
      type: 'blockContent',
      group: 'legal',
      hidden: true,
      description: 'Legacy import. The site uses the shared Privacy Policy document (Studio → Privacy Policy).',
    }),

    // SEO
    defineField({name: 'metaTitle', type: 'string', group: 'seo', description: 'Homepage title. Leave empty for "Painters in {City}, {State} | Painter1".'}),
    defineField({
      name: 'metaDescription',
      type: 'text',
      rows: 3,
      group: 'seo',
      description: 'Homepage description (max ~160 characters). Leave empty to generate it from the location name, city, owner and phone.',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'locationType', media: 'ownerPhoto'},
  },
})
