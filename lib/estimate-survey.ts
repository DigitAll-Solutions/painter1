// The estimate survey: step order, skip rules, validation and the Message block that goes into
// {inputs.description}. Pure functions only (no framework imports), shared by the form, the server
// action, the unit test and scripts. Copy comes from the estimateSurvey document; the step keys,
// skip rules and email labels below are fixed so editors can't break the email Client Tether reads.

export type ServiceKey = 'interior' | 'exterior' | 'cabinet' | 'notSure'
export type AreaService = Exclude<ServiceKey, 'notSure'>
export const SERVICE_KEYS: ServiceKey[] = ['interior', 'exterior', 'cabinet', 'notSure']
/** Values accepted in ?service= (service-page CTAs pass the service's locationKey) */
export const PRESET_SERVICES: AreaService[] = ['interior', 'exterior', 'cabinet']

export type StepKey = 'service' | 'areas' | 'timeline' | 'address' | 'name' | 'email' | 'phone'
export const STEP_ORDER: StepKey[] = ['service', 'areas', 'timeline', 'address', 'name', 'email', 'phone']

/** Value of the "Other" area checkbox; its text goes in areasOther */
export const OTHER_AREA = '__other__'

export type SurveyContent = {
  serviceQuestion: string
  serviceOptions: Record<ServiceKey, string>
  areasQuestion: string
  areasHelper: string
  areaOptions: Record<AreaService, string[]>
  otherLabel: string
  otherPlaceholder: string
  timelineQuestion: string
  timelineOptions: string[]
  messageLabel: string
  addressQuestion: string
  streetLabel: string
  cityLabel: string
  zipLabel: string
  nameQuestion: string
  nameHelper: string
  firstNameLabel: string
  lastNameLabel: string
  emailQuestion: string
  emailLabel: string
  nextStepsTitle: string
  nextSteps: string[]
  phoneQuestion: string
  phoneLabel: string
  ownerRole: string
  ownerCardLine: string
  submitLabel: string
  nextLabel: string
  backLabel: string
  progressLabel: string
  successHeading: string
}

export type Answers = {
  service?: ServiceKey
  areas: string[]
  areasOther: string
  timeline?: string
  message: string
  street: string
  city: string
  zip: string
  firstName: string
  lastName: string
  email: string
  phone: string
  consents: Record<string, boolean>
}

export const emptyAnswers = (city = ''): Answers => ({
  areas: [],
  areasOther: '',
  message: '',
  street: '',
  city,
  zip: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  consents: {},
})

/** Steps that apply: the service question is skipped when preset from the URL, areas for "Not sure" */
export const applicableSteps = (service: ServiceKey | undefined, preset: boolean): StepKey[] =>
  STEP_ORDER.filter((step) => !(step === 'service' && preset) && !(step === 'areas' && service === 'notSure'))

/** Which step each answer field belongs to (for sending focus to the step with an error) */
export const FIELD_STEP: Record<string, StepKey> = {
  service: 'service',
  areas: 'areas',
  areasOther: 'areas',
  timeline: 'timeline',
  message: 'timeline',
  street: 'address',
  city: 'address',
  zip: 'address',
  firstName: 'name',
  lastName: 'name',
  email: 'email',
  phone: 'phone',
}

// #73's own error messages where it had them
export const MESSAGES = {
  required: 'This field is required',
  email: 'This field must contain a valid email',
  phone: 'Please enter a 10-digit US phone number',
  areas: 'Please select at least one area',
  other: 'Please tell us what else you would like painted',
  consent: 'This field is required',
  tooLong: 'This is too long',
}

const LIMITS = { short: 120, other: 60, message: 5000 }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const phoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

/** Formats as the visitor types: (865) 555-0123 */
export function formatUsPhone(value: string) {
  const d = phoneDigits(value).slice(0, 10)
  if (!d) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export const isValidUsPhone = (value: string) => phoneDigits(value).length === 10

export type FieldErrors = Record<string, string>

/** Validates one step. `consentNames` are the location's required consent checkboxes. */
export function validateStep(step: StepKey, a: Answers, survey: SurveyContent, consentNames: string[]): FieldErrors {
  const e: FieldErrors = {}
  const required = (key: keyof Answers, value: string | undefined, max = LIMITS.short) => {
    if (!value?.trim()) e[key] = MESSAGES.required
    else if (value.length > max) e[key] = MESSAGES.tooLong
  }
  switch (step) {
    case 'service':
      if (!a.service || !SERVICE_KEYS.includes(a.service)) e.service = MESSAGES.required
      break
    case 'areas': {
      if (!a.service || a.service === 'notSure') break
      const allowed = [...survey.areaOptions[a.service], OTHER_AREA]
      if (!a.areas.length) e.areas = MESSAGES.areas
      else if (a.areas.some((area) => !allowed.includes(area))) e.areas = MESSAGES.areas
      if (a.areas.includes(OTHER_AREA)) {
        if (!a.areasOther.trim()) e.areasOther = MESSAGES.other
        else if (a.areasOther.length > LIMITS.other) e.areasOther = MESSAGES.tooLong
      }
      break
    }
    case 'timeline':
      if (!a.timeline || !survey.timelineOptions.includes(a.timeline)) e.timeline = MESSAGES.required
      if (a.message.length > LIMITS.message) e.message = MESSAGES.tooLong
      break
    case 'address':
      required('street', a.street)
      required('city', a.city)
      if (a.zip.length > 10) e.zip = MESSAGES.tooLong
      break
    case 'name':
      required('firstName', a.firstName)
      required('lastName', a.lastName)
      break
    case 'email':
      if (!a.email.trim()) e.email = MESSAGES.required
      else if (!EMAIL.test(a.email.trim()) || a.email.length > LIMITS.short) e.email = MESSAGES.email
      break
    case 'phone':
      if (!a.phone.trim()) e.phone = MESSAGES.required
      else if (!isValidUsPhone(a.phone)) e.phone = MESSAGES.phone
      for (const name of consentNames) if (!a.consents[name]) e[`consent:${name}`] = MESSAGES.consent
      break
  }
  return e
}

/**
 * Validates every step that applies; returns the errors and the first step that has one.
 * The service answer is always required (a ?service= preset fills it in), so it's always checked.
 */
export function validateAll(a: Answers, survey: SurveyContent, consentNames: string[]) {
  for (const step of applicableSteps(a.service, false)) {
    const errors = validateStep(step, a, survey, consentNames)
    if (Object.keys(errors).length) return { errors, step }
  }
  return { errors: {} as FieldErrors, step: undefined }
}

/** Label shown for an area value ("Other" becomes "Other (<text>)") */
const areaLabel = (area: string, a: Answers, survey: SurveyContent) => (area === OTHER_AREA ? `${survey.otherLabel} (${a.areasOther.trim()})` : area)

/**
 * The value of {inputs.description}: one "Label: value" line per answered survey question, then a
 * blank line and the customer's own message (if any). The labels are fixed here on purpose.
 */
export function composeDescription(a: Answers, survey: SurveyContent): string {
  const lines: string[] = []
  if (a.service) lines.push(`Service: ${survey.serviceOptions[a.service]}`)
  if (a.service && a.service !== 'notSure' && a.areas.length) lines.push(`Areas: ${a.areas.map((area) => areaLabel(area, a, survey)).join(', ')}`)
  if (a.timeline) lines.push(`Timeline: ${a.timeline}`)
  const message = a.message.trim()
  return message ? `${lines.join('\n')}\n\n${message}` : lines.join('\n')
}

/** Replaces {owner}, {ownerFull}, {city}, {firstName}, {percent} in every string of the survey copy */
export function fillTokens<T>(value: T, tokens: Record<string, string>): T {
  if (typeof value === 'string') return value.replace(/\{(\w+)\}/g, (match, key: string) => (key in tokens ? tokens[key] : match)) as T
  if (Array.isArray(value)) return value.map((item) => fillTokens(item, tokens)) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTokens(v, tokens)])) as T
  return value
}
