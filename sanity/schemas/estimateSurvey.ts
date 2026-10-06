import {defineArrayMember, defineField, defineType} from 'sanity'
import {ListChecks} from 'lucide-react'

const TOKENS = 'Tokens: {owner} (owner first name), {ownerFull} (owner full name), {city}.'
const text = (name: string, title: string, description?: string, group?: string) =>
  defineField({name, title, type: 'string', group, description: description ?? TOKENS})
const list = (name: string, title: string, description: string, group?: string) =>
  defineField({name, title, type: 'array', group, description, of: [defineArrayMember({type: 'string'})]})

// All the words on the free-estimate survey. The step order, skip rules and the "Service / Areas /
// Timeline" email labels are fixed in code (lib/estimate-survey.ts) so the email format can't change.
// Empty fields fall back to the default copy.
export const estimateSurvey = defineType({
  name: 'estimateSurvey',
  title: 'Estimate survey',
  type: 'document',
  icon: ListChecks,
  groups: [
    {name: 'project', title: 'Project steps', default: true},
    {name: 'contact', title: 'Contact steps'},
    {name: 'general', title: 'Buttons & success'},
  ],
  fields: [
    defineField({name: 'title', type: 'string', group: 'general', description: 'Internal name, e.g. "Default survey".'}),
    text('serviceQuestion', 'Step 1: question', undefined, 'project'),
    defineField({
      name: 'serviceOptions',
      title: 'Step 1: options',
      type: 'object',
      group: 'project',
      description: 'Labels for the four fixed choices. These labels also appear in the email ("Service: …").',
      fields: [
        defineField({name: 'interior', type: 'string'}),
        defineField({name: 'exterior', type: 'string'}),
        defineField({name: 'cabinet', type: 'string'}),
        defineField({name: 'notSure', title: 'Not sure', type: 'string'}),
      ],
    }),
    text('areasQuestion', 'Step 2: question', undefined, 'project'),
    text('areasHelper', 'Step 2: helper text', undefined, 'project'),
    defineField({
      name: 'areaOptions',
      title: 'Step 2: areas per service',
      type: 'object',
      group: 'project',
      description: '"Other" is added automatically at the end of each list. The labels appear in the email ("Areas: …").',
      fields: [
        list('interior', 'Interior', 'Interior areas'),
        list('exterior', 'Exterior', 'Exterior areas'),
        list('cabinet', 'Cabinets', 'Cabinet areas'),
      ],
    }),
    text('otherLabel', 'Step 2: "Other" label', 'Shown as the last option and in the email as "Other (…)".', 'project'),
    text('otherPlaceholder', 'Step 2: "Other" placeholder', '', 'project'),
    text('timelineQuestion', 'Step 3: question', undefined, 'project'),
    list('timelineOptions', 'Step 3: options', 'The chosen label appears in the email ("Timeline: …").', 'project'),
    text('messageLabel', 'Step 3: message label', 'Label of the optional customer message.', 'project'),
    text('addressQuestion', 'Step 4: question', undefined, 'contact'),
    text('streetLabel', 'Step 4: street label', '', 'contact'),
    text('cityLabel', 'Step 4: city label', '', 'contact'),
    text('zipLabel', 'Step 4: zip label', '', 'contact'),
    text('nameQuestion', 'Step 5: question', undefined, 'contact'),
    text('nameHelper', 'Step 5: helper text', undefined, 'contact'),
    text('firstNameLabel', 'Step 5: first name label', '', 'contact'),
    text('lastNameLabel', 'Step 5: last name label', '', 'contact'),
    text('emailQuestion', 'Step 6: question', undefined, 'contact'),
    text('emailLabel', 'Step 6: email label', '', 'contact'),
    text('nextStepsTitle', '"What happens next" title', undefined, 'contact'),
    list('nextSteps', '"What happens next" items', TOKENS, 'contact'),
    text('phoneQuestion', 'Step 7: question', undefined, 'contact'),
    text('phoneLabel', 'Step 7: phone label', '', 'contact'),
    text('ownerRole', 'Owner card: name line', undefined, 'contact'),
    text('ownerCardLine', 'Owner card: text', undefined, 'contact'),
    text('submitLabel', 'Submit button', '', 'general'),
    text('nextLabel', 'Next button', '', 'general'),
    text('backLabel', 'Back button', '', 'general'),
    text('progressLabel', 'Progress text', 'Use {percent} for the number, e.g. "{percent}% complete".', 'general'),
    text('successHeading', 'Success heading', 'Use {firstName} for the visitor\'s first name.', 'general'),
  ],
  preview: {select: {title: 'title'}, prepare: ({title}) => ({title: title || 'Estimate survey'})},
})
