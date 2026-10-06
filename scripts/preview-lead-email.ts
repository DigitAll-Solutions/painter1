/**
 * Prints the lead email a sample estimate request would produce for Knoxville, using the subject and
 * template stored in Sanity and the same code the server action uses. Sends and saves nothing.
 *
 *   node --env-file=.env.local scripts/preview-lead-email.ts [location-slug]
 */
import { readFileSync } from 'node:fs'

import { createClient } from '@sanity/client'

import { composeDescription, emptyAnswers, OTHER_AREA, type Answers, type SurveyContent } from '../lib/estimate-survey.ts'
import { resolveDelivery } from '../lib/lead-delivery.ts'
import { buildLeadEmail } from '../lib/lead-email.ts'

const slug = process.argv[2] ?? 'knoxville'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

const defaults = JSON.parse(readFileSync('lib/estimate-survey-defaults.json', 'utf-8')) as SurveyContent

// A sample request: exterior job with an "Other" area and a customer message
const sample: Answers = {
  ...emptyAnswers(),
  service: 'exterior',
  areas: ['Siding', 'Trim & Doors', OTHER_AREA],
  areasOther: 'garage door',
  timeline: 'Within 30 days',
  message: "The north side is peeling and we'd like it done before winter.",
  street: '123 Sample St',
  zip: '37919',
  firstName: 'Jane',
  lastName: 'Sample',
  email: 'jane.sample@example.com',
  phone: '(865) 555-0123',
}

const location = await client.fetch<{ name: string; city?: string; state?: string; leadEmailSubject?: string; leadEmailTemplate?: string } | null>(
  `*[_type == "location" && slug.current == $slug][0]{name, "city": address.city, "state": address.state, leadEmailSubject, leadEmailTemplate}`,
  { slug },
)
if (!location?.leadEmailTemplate) {
  console.error(`No lead email template on "${slug}" yet: run scripts/seed-leads.ts first.`)
  process.exit(1)
}

const answers = { ...sample, city: location.city ?? '' }
const body = buildLeadEmail(location.leadEmailTemplate, {
  inputs: {
    names: { first_name: answers.firstName, last_name: answers.lastName },
    email: answers.email,
    phone: answers.phone,
    input_text: answers.street,
    input_text_1: answers.city,
    input_text_2: location.state ?? '',
    input_text_3: answers.zip,
    description: composeDescription(answers, defaults),
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: `${slug}-exterior`,
    gclid: 'SAMPLE-GCLID',
    channel: 'Paid Search',
    channeldrilldown1: 'Google',
    channeldrilldown2: `${slug}-exterior`,
  },
  submission: { source_url: `https://www.painter1.com/${slug}/free-estimate?service=exterior&utm_source=google` },
})

const delivery = resolveDelivery(process.env, location.leadEmailSubject ?? '')
const recipients = delivery.kind === 'test' ? delivery.to.join(', ') : delivery.kind === 'live' ? `the recipients in leads.<${slug} location id>` : 'nobody'

console.log(`Location: ${location.name}   Mode: ${delivery.kind}${delivery.kind === 'refused' ? ` (${delivery.reason})` : ''}   To: ${recipients}`)
console.log(`Subject:  ${delivery.subject}`)
console.log(`Reply-To: ${answers.email}`)
console.log('─'.repeat(72))
console.log(body)
console.log('─'.repeat(72))
console.log(`(${body.length} characters; the line after "PARSER:" ends with ${JSON.stringify(body.slice(body.lastIndexOf('PARSER:')))})`)
