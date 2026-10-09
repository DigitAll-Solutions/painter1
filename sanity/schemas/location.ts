import {defineArrayMember, defineField, defineType, type Rule} from 'sanity'
import {MapPin} from 'lucide-react'

import {altField} from './objects/altField'
import {LockedSlugInput} from '../components/LockedSlugInput'
import {slugError, slugify, slugWarning} from '../lib/location-slugs'
import {US_STATES} from '../lib/us-states'

const imageWithAlt = (name: string, title?: string) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    fields: [altField],
  })

const SERVICE_KEYS = ['interior', 'exterior', 'cabinet'] as const

// One document per franchise location. Field order follows the pages from top to bottom; every field
// says where it shows on the site and what happens when it's empty. Only fields that would break a
// page block publishing; everything else is a warning (and an item in the Launch checklist view).
export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  icon: MapPin,
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'owner', title: 'Owner & team'},
    {name: 'content', title: 'Homepage'},
    {name: 'services', title: 'Services'},
    {name: 'media', title: 'Photos'},
    {name: 'reviews', title: 'Reviews'},
    {name: 'leads', title: 'Leads & consent'},
    {name: 'legal', title: 'Warranty'},
    {name: 'seo', title: 'SEO'},
  ],
  fieldsets: [
    {name: 'contact', title: 'Contact', options: {columns: 2}},
    {name: 'area', title: 'Service area'},
    {name: 'stats', title: 'Project counts (homepage owner section and hero subtitle)', options: {columns: 3}},
    {name: 'scheduling', title: 'Online scheduling', options: {collapsible: true, collapsed: true}},
    {name: 'notOnSite', title: 'Not on the site yet (About and Warranty pages)', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    // ---------- Basics ----------
    defineField({
      name: 'name',
      type: 'string',
      group: 'basics',
      description: 'Business name, shown in the header, footer, titles and consent text. Format: "Painter1 of {City}".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'basics',
      description:
        'The location URL: painter1.com/<slug>. Must match the live site (usually the city, e.g. "knoxville"). "Generate" uses the city. Locked after publishing.',
      options: {source: (doc) => (doc as {address?: {city?: string}; name?: string}).address?.city || (doc as {name?: string}).name || '', slugify, maxLength: 64},
      components: {input: LockedSlugInput},
      validation: (rule) => [
        rule.custom((value?: {current?: string}) => slugError(value?.current) ?? true),
        rule.custom((value?: {current?: string}) => slugWarning(value?.current) ?? true).warning(),
      ],
    }),
    defineField({
      name: 'locationType',
      type: 'string',
      group: 'basics',
      description: 'Growth: every page. Maintenance (the client list’s basic tier): only the homepage, free estimate and privacy pages (service pages, Our Work and Warranty return 404).',
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
    defineField({name: 'tagline', type: 'string', group: 'basics', description: 'Short line under the logo in the footer and the business slogan in search data. Optional.'}),
    defineField({
      name: 'phone',
      type: 'string',
      group: 'basics',
      fieldset: 'contact',
      description: 'Shown in the header, every call button and the footer. Format: (865) 345-5800.',
      validation: (rule) => rule.required().warning('Without a phone number the call buttons disappear.'),
    }),
    defineField({
      name: 'email',
      type: 'string',
      group: 'basics',
      fieldset: 'contact',
      description: 'Public contact email (footer, privacy page). Lead emails go to the private Email recipients instead.',
      validation: (rule) => [rule.email(), rule.required().warning('Shown in the footer and on the privacy page.')],
    }),
    defineField({
      name: 'businessHours',
      type: 'array',
      group: 'basics',
      description: 'Footer, one line each, e.g. "Monday–Friday: 9:00 AM – 5:00 PM".',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'address',
      type: 'object',
      group: 'basics',
      description: 'Office address (footer and search data). City and state are used in every page title, e.g. "Painters in Knoxville, TN".',
      fields: [
        defineField({name: 'street', type: 'string', description: 'E.g. "5227 N. Middlebrook Pike, Suite D".'}),
        defineField({name: 'city', type: 'string', description: 'The main city, e.g. "Knoxville".', validation: (rule) => rule.required()}),
        defineField({
          name: 'state',
          type: 'string',
          description: 'Groups the location under its state in the Studio.',
          options: {list: US_STATES.map(([value, name]) => ({value, title: `${value} — ${name}`}))},
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'zip', type: 'string', description: 'Five digits.', validation: (rule) => rule.regex(/^\d{5}(-\d{4})?$/, {name: 'ZIP code'})}),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'serviceArea',
      type: 'string',
      group: 'basics',
      fieldset: 'area',
      description: 'Heading line of the homepage "Service areas" section, e.g. "Knoxville & East Tennessee".',
    }),
    defineField({
      name: 'serviceCities',
      title: 'Service cities',
      type: 'array',
      group: 'basics',
      fieldset: 'area',
      description: 'Listed on the homepage and in search data ("areaServed"). One city per item, e.g. "Farragut, TN".',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.min(1).warning('Add at least one service city.'),
    }),
    defineField({
      name: 'socialLinks',
      type: 'object',
      group: 'basics',
      description: 'Footer icons and search data. Leave a network empty to hide its icon.',
      options: {collapsible: true, collapsed: true},
      fields: ['facebook', 'google', 'instagram', 'yelp', 'youtube'].map((name) =>
        defineField({name, type: 'url', description: `Full ${name === 'google' ? 'Google Business Profile' : name} URL.`}),
      ),
    }),

    // ---------- Owner & team ----------
    defineField({
      name: 'ownerName',
      type: 'string',
      group: 'owner',
      description: 'Full name. Shown in the hero seal, owner section, service pages and survey; the first name fills {owner}.',
      validation: (rule) => rule.required().warning('Owner sections fall back to generic text without a name.'),
    }),
    {
      ...imageWithAlt('ownerPhoto'),
      group: 'owner',
      description: 'Portrait for the homepage owner section, service pages and the survey card. Square-ish, face centered.',
      validation: (rule: Rule) => rule.required().warning('Owner sections show without a photo.'),
    },
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
    defineField({
      name: 'ownerSinceYear',
      title: 'Owner since (year)',
      type: 'string',
      group: 'owner',
      description: 'Year the owner opened this location, e.g. "2021". Used in the owner section and the "established" hero subtitle.',
      validation: (rule) => rule.regex(/^\d{4}$/, {name: 'year'}),
    }),
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
      description: "The owner's own words, recorded, not written for them. Shown in the owner section and service pages.",
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
      description: 'Up to two people shown beside the owner (only for "Owner with team").',
      hidden: ({document}) => document?.franchiseStructure !== 'owner-with-team',
      validation: (rule) => rule.max(2),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'teamMember',
          fields: [
            defineField({name: 'name', type: 'string', description: 'Full name.', validation: (rule) => rule.required()}),
            defineField({name: 'jobTitle', type: 'string', description: 'E.g. "Estimator" or "Crew lead".', validation: (rule) => rule.required()}),
            defineField({name: 'withOwnerSince', title: 'With owner since (year)', type: 'string', description: 'E.g. "2022".', validation: (rule) => rule.regex(/^\d{4}$/, {name: 'year'})}),
            defineField({name: 'bio', type: 'text', rows: 2, description: 'One or two lines: background, specialty.'}),
            defineField({name: 'photo', type: 'image', description: 'Portrait, face centered.', options: {hotspot: true}, fields: [altField]}),
            defineField({name: 'namedInReviews', title: 'Named in Google reviews', type: 'boolean', description: 'Tick when customers mention this person by name.', initialValue: false}),
          ],
          preview: {select: {title: 'name', subtitle: 'jobTitle', media: 'photo'}},
        }),
      ],
    }),
    defineField({name: 'projectsCount', type: 'number', group: 'owner', fieldset: 'stats', description: 'Total projects completed.'}),
    defineField({name: 'interiorProjectsCount', type: 'number', group: 'owner', fieldset: 'stats', description: 'Interior projects (optional).'}),
    defineField({name: 'exteriorProjectsCount', type: 'number', group: 'owner', fieldset: 'stats', description: 'Exterior projects (optional).'}),
    defineField({name: 'ownerBio', type: 'text', rows: 12, group: 'owner', fieldset: 'notOnSite', description: 'Long owner biography for the About page (not built yet).'}),

    // ---------- Homepage ----------
    defineField({
      name: 'heroHeadline',
      type: 'string',
      group: 'content',
      description: 'Homepage H1. Leave empty for "Professional Painters in {City}, {ST}".',
    }),
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
    {...imageWithAlt('transformationAfterImage', 'Transformation: after image'), group: 'content', description: 'The "after" photo of the same pair, same angle.'},
    defineField({
      name: 'transformationBody',
      type: 'text',
      rows: 5,
      group: 'content',
      description: 'Copy beside the slider. "[City]" is replaced with the location city.',
    }),
    defineField({name: 'yearsInBusiness', type: 'number', group: 'content', description: 'Homepage stats row ("12+ Years Experience"). Leave empty to hide that stat.'}),
    defineField({
      name: 'processSteps',
      title: 'How it works',
      type: 'array',
      group: 'content',
      description: 'Homepage "How It Works" steps. Leave empty for the standard four steps.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({name: 'title', type: 'string', description: 'Short step name, e.g. "Free estimate".', validation: (rule) => rule.required()}),
            defineField({name: 'description', type: 'text', rows: 2, description: 'One or two sentences.'}),
          ],
        }),
      ],
    }),
    defineField({name: 'intro', title: 'Welcome text', type: 'text', rows: 6, group: 'content', fieldset: 'notOnSite', description: 'Imported welcome copy, for the About page (not built yet).'}),
    defineField({
      name: 'whyChooseUs',
      type: 'array',
      group: 'content',
      fieldset: 'notOnSite',
      description: 'Imported list, for the About page (not built yet).',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'aboutSections',
      title: 'About page sections',
      type: 'array',
      group: 'content',
      fieldset: 'notOnSite',
      description: 'Sections for the About page (not built yet).',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'aboutSection',
          fields: [
            defineField({name: 'heading', type: 'string', description: 'Section heading.'}),
            defineField({name: 'body', type: 'text', rows: 6, description: 'Section text.'}),
          ],
        }),
      ],
    }),

    // ---------- Services ----------
    defineField({
      name: 'services',
      type: 'object',
      group: 'services',
      description:
        'This location\'s version of each service: nav label, homepage card and service-page overrides. Shared copy lives in Shared → Services.',
      fields: SERVICE_KEYS.map((name) => defineField({name, type: 'serviceDetail', description: `Overrides for /<slug>/${{interior: 'interior-painting', exterior: 'exterior-painting', cabinet: 'cabinet-painting'}[name]}.`})),
      validation: (rule) =>
        rule.custom((value: Partial<Record<(typeof SERVICE_KEYS)[number], {title?: string}>> | undefined, context) => {
          if ((context.document as {locationType?: string} | undefined)?.locationType === 'maintenance') return true
          const missing = SERVICE_KEYS.filter((key) => !value?.[key]?.title?.trim())
          return missing.length ? `Add a title for ${missing.join(', ')}: it's the label in the header menu.` : true
        }),
    }),

    // ---------- Photos ----------
    {
      ...imageWithAlt('heroImage'),
      group: 'media',
      description: 'Homepage hero background (also the fallback hero for service pages and the share image). Landscape, at least 1920px wide.',
      validation: (rule: Rule) => rule.required().warning('The homepage hero has no photo.'),
    },
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
      description:
        'Newest first: the top photo shows first on Our Work, the homepage and service pages. Drag new photos to the top.',
      // A before/after pair needs exactly one "before" and one "after" with the same project ID
      validation: (rule) =>
        rule.custom((images?: {projectId?: string; role?: string}[]) => {
          const roles = new Map<string, string[]>()
          for (const image of images ?? []) {
            const id = image.projectId?.trim()
            if (id) roles.set(id, [...(roles.get(id) ?? []), image.role ?? 'none'])
          }
          const broken = [...roles].filter(([, r]) => r.length > 1 && (r.length !== 2 || !r.includes('before') || !r.includes('after')))
          return broken.length
            ? {message: `Project ID ${broken.map(([id]) => `"${id}"`).join(', ')}: a pair needs one Before and one After photo, so these show as separate photos.`, level: 'warning'}
            : true
        }),
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          preview: {
            select: {title: 'title', projectType: 'projectType', role: 'role', hidden: 'notLocalProject', commercial: 'commercial', media: 'asset'},
            prepare: ({title, projectType, role, hidden, commercial, media}) => ({
              title: title || projectType || 'Untitled photo',
              subtitle: [hidden && 'HIDDEN: not a local project', commercial && 'Commercial', role && `${role[0].toUpperCase()}${role.slice(1)}`].filter(Boolean).join(' · '),
              media,
            }),
          },
          fields: [
            altField,
            defineField({
              name: 'notLocalProject',
              title: 'Hide: not a local project',
              type: 'boolean',
              initialValue: false,
              description: "Hides the photo everywhere on the site (homepage, service pages, Our Work). For photos that aren't this location's own work.",
            }),
            defineField({
              name: 'services',
              type: 'array',
              description: 'Service pages this photo appears on (Recent Work) and its Our Work filters.',
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
            defineField({name: 'caption', type: 'string', description: 'Longer description, shown in the Our Work lightbox.'}),
            defineField({
              name: 'commercial',
              title: 'Commercial project',
              type: 'boolean',
              initialValue: false,
              description: 'Shows under "Commercial" on Our Work.',
            }),
            defineField({
              name: 'projectId',
              title: 'Project ID',
              type: 'string',
              description:
                'Give a before and an after photo the same ID (e.g. "brick-ranch") to show them as one before/after slider on Our Work.',
              validation: (rule) => rule.regex(/^[a-z0-9-]+$/, {name: 'lowercase letters, numbers and dashes'}),
            }),
            defineField({
              name: 'role',
              title: 'Before or after',
              type: 'string',
              description: 'Which half of the pair this photo is.',
              options: {list: [{title: 'Before', value: 'before'}, {title: 'After', value: 'after'}], layout: 'radio', direction: 'horizontal'},
              hidden: ({parent}) => !parent?.projectId,
            }),
            // Map-ready: a project map can read these later without changing the page template
            defineField({name: 'city', type: 'string', description: 'For the project map. Leave empty for the location\'s city.'}),
            defineField({name: 'geo', title: 'Map position', type: 'geopoint', description: 'For the project map (optional).'}),
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

    // ---------- Reviews ----------
    defineField({
      name: 'reviews',
      type: 'array',
      group: 'reviews',
      description: 'Rendered as real HTML with Review schema (search engines and AI tools cannot read the Trustindex widget).',
      validation: (rule) => rule.min(3).warning('The homepage and service pages show three reviews.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'review',
          fields: [
            defineField({name: 'reviewText', type: 'text', rows: 4, description: 'Copied word for word from the review.', validation: (rule) => rule.required()}),
            defineField({name: 'reviewerName', type: 'string', description: 'As shown on the review site, e.g. "Christian Melson".', validation: (rule) => rule.required()}),
            defineField({name: 'rating', type: 'number', description: 'Stars, 1–5.', initialValue: 5, validation: (rule) => rule.min(1).max(5).integer()}),
            defineField({name: 'reviewDate', type: 'date', description: 'Newest reviews show first.'}),
            defineField({name: 'source', type: 'string', description: 'Where the review was posted.', initialValue: 'Google', options: {list: ['Google', 'Facebook', 'Yelp', 'Other']}}),
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
    defineField({
      name: 'reviewsCount',
      type: 'number',
      group: 'reviews',
      description: 'Total Google reviews ("242 reviews") for the hero, stats row and search rating. Update now and then.',
    }),
    defineField({
      name: 'rating',
      type: 'number',
      group: 'reviews',
      description: 'Average star rating, e.g. 4.9. Shown with the review count; both are needed for the search rating.',
      validation: (rule) => rule.min(0).max(5),
    }),
    defineField({
      name: 'trustindexWidgetId',
      title: 'Trustindex widget ID',
      type: 'string',
      group: 'reviews',
      description: 'The ID after "loader.js?" in the Trustindex embed code. Leave empty to hide the review carousel.',
    }),

    // ---------- Leads & consent ----------
    // Recipients are NOT here: this dataset is public, so they live in the private "Email recipients"
    // document (the location's folder → Email recipients).
    defineField({
      name: 'leadEmailSubject',
      title: 'Lead email subject',
      type: 'string',
      group: 'leads',
      description: 'Subject of the estimate-request email, e.g. "Painter1.com - Get Free Estimate - Form Submission".',
      validation: (rule) => rule.required().warning('Lead emails need a subject.'),
    }),
    defineField({
      name: 'leadEmailTemplate',
      title: 'Lead email template',
      type: 'text',
      rows: 18,
      group: 'leads',
      description:
        "Plain-text body, copied exactly from this location's Fluent Forms notification. Placeholders: {submission.source_url}, {inputs.names.first_name}, {inputs.names.last_name}, {inputs.email}, {inputs.phone}, {inputs.input_text} (street), {inputs.input_text_1} (city), {inputs.input_text_2} (state), {inputs.input_text_3} (zip), {inputs.description} (survey answers + message), {inputs.utm_source}, {inputs.utm_medium}, {inputs.utm_campaign}, {inputs.gclid}, {inputs.channel}, {inputs.channeldrilldown1}–{inputs.channeldrilldown3}, {inputs.landingpage}, {inputs.landingpagegroup}. Client Tether parses this email: change it only on purpose.",
      validation: (rule) => rule.required().warning('Without a template, leads are saved but no email is sent.'),
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
      description:
        'Each item is one required, unchecked checkbox on the last survey step. Write the business name as {locationName}: it is filled with this location\'s name on the form and in every lead\'s consent record. Without consent checkboxes the form is replaced by "please call us".',
      validation: (rule) => rule.min(1).warning('The free-estimate form only works with consent checkboxes.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'consentBlock',
          fields: [
            defineField({name: 'name', type: 'string', description: 'Stable key stored with every lead, e.g. "terms-n-condition". Don\'t rename after launch.', validation: (rule) => rule.required()}),
            defineField({name: 'body', type: 'consentText', description: 'The checkbox text. Use {locationName} for the business name.', validation: (rule) => rule.required()}),
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
      description: 'Leave empty to use the default survey (Shared → Estimate survey).',
    }),
    defineField({
      name: 'hasScheduling',
      type: 'boolean',
      group: 'leads',
      fieldset: 'scheduling',
      description: 'When on, every CTA says "Schedule Your FREE Estimate" instead of "Get Your FREE Estimate".',
      initialValue: false,
    }),
    defineField({
      name: 'schedulingUrl',
      title: 'Booking page',
      type: 'url',
      group: 'leads',
      fieldset: 'scheduling',
      description:
        'Booking page on appointment.painter1.com, e.g. https://appointment.painter1.com/knoxville. Shown as "Pick a time now" after a survey request, and used by the setting below. Leave empty until the page is live.',
      hidden: ({document}) => !document?.hasScheduling,
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'bookingTarget',
      title: 'Schedule button goes to',
      type: 'string',
      group: 'leads',
      fieldset: 'scheduling',
      description: 'Where every "Schedule Your FREE Estimate" button links. "Booking page directly" only applies once the booking page above is set; until then buttons go to the survey.',
      options: {
        list: [
          {title: 'Estimate survey (booking offered at the end)', value: 'survey'},
          {title: 'Booking page directly', value: 'booking'},
        ],
        layout: 'radio',
      },
      initialValue: 'survey',
      hidden: ({document}) => !document?.hasScheduling,
    }),

    // ---------- Warranty ----------
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
      description: 'Leave empty to link to this location’s warranty page (/<slug>/warranty).',
    }),
    defineField({
      name: 'warrantyPdf',
      title: 'Warranty sheet (PDF)',
      type: 'file',
      group: 'legal',
      options: {accept: 'application/pdf'},
      description: 'Optional. Shows a "Download Warranty Sheet (PDF)" button on the warranty page.',
    }),
    defineField({
      name: 'warrantyResponseTime',
      title: 'Warranty response time',
      type: 'string',
      group: 'legal',
      description: 'Optional line after "We repair covered areas at no labor charge." on the warranty page, e.g. "We usually reply within two business days." Leave empty to hide.',
    }),
    {
      ...imageWithAlt('warrantyGraphic', 'Homepage warranty: graphic'),
      group: 'legal',
      description: 'Shown beside the warranty copy on the homepage. Leave blank for the default blue paint fan-deck illustration.',
    },
    defineField({name: 'warranty', title: 'Warranty terms', type: 'blockContent', group: 'legal', fieldset: 'notOnSite', description: 'Full warranty text for the Warranty page (not built yet).'}),
    defineField({
      name: 'privacyPolicy',
      type: 'blockContent',
      group: 'legal',
      hidden: true,
      description: 'Legacy import. The site uses the shared Privacy Policy document (Shared → Privacy Policy).',
    }),

    // ---------- SEO ----------
    defineField({name: 'metaTitle', type: 'string', group: 'seo', description: 'Homepage title. Leave empty for "Painters in {City}, {State} | Painter1".'}),
    defineField({
      name: 'metaDescription',
      type: 'text',
      rows: 3,
      group: 'seo',
      description: 'Homepage description (max ~160 characters). Leave empty to generate it from the location name, city, owner and phone.',
      validation: (rule) => rule.max(160).warning('Search results cut descriptions after about 160 characters.'),
    }),
    defineField({
      name: 'ourWorkPage',
      title: 'Our Work page',
      type: 'object',
      group: 'seo',
      description: 'All optional. Tokens: {city}, {state}, {owner}.',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'metaTitle', type: 'string', description: 'Leave empty for "Our Work in {City}, {ST} | Painter1 of {city}".'}),
        defineField({name: 'metaDescription', type: 'text', rows: 3, description: 'Max ~160 characters. Leave empty for the default description.'}),
        defineField({name: 'intro', type: 'text', rows: 3, description: 'Text under the page heading. Leave empty for the default.'}),
      ],
    }),
  ],
  preview: {
    select: {title: 'name', city: 'address.city', state: 'address.state', type: 'locationType', media: 'ownerPhoto'},
    prepare: ({title, city, state, type, media}) => ({
      title,
      subtitle: [[city, state].filter(Boolean).join(', ') || 'No city/state yet', type === 'maintenance' ? 'Maintenance' : 'Growth'].join(' · '),
      media,
    }),
  },
})
