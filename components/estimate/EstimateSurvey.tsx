'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CalendarCheck, Phone } from 'lucide-react'

import CtaButton from '../CtaButton'
import NextSteps from './NextSteps'
import Turnstile from './Turnstile'
import { submitEstimate, type EstimateState } from '@/app/[location]/free-estimate/actions'
import { pushDataLayer } from '@/lib/data-layer'
import { ATTRIBUTION_FIELDS, ATTRIBUTION_STORAGE_KEY, HONEYPOT_FIELD, URL_ATTRIBUTION } from '@/lib/estimate-form'
import {
  applicableSteps,
  emptyAnswers,
  fillTokens,
  formatUsPhone,
  OTHER_AREA,
  PRESET_SERVICES,
  SERVICE_KEYS,
  STEP_ORDER,
  validateAll,
  validateStep,
  type Answers,
  type AreaService,
  type FieldErrors,
  type StepKey,
  type SurveyContent,
} from '@/lib/estimate-survey'

type Props = {
  slug: string
  state: string
  city: string
  phone?: string
  tel?: string
  /** Survey copy with {owner}, {ownerFull} and {city} already filled in */
  survey: SurveyContent
  /** The location's consent checkboxes, rendered on the server */
  consents: { name: string; content: ReactNode }[]
  ownerCard: ReactNode
  confirmationMessage: string
  /** Online booking page: "Pick a time now" after a successful request */
  bookingUrl?: string
  turnstileSiteKey: string
}

const storageKey = (slug: string) => `p1-estimate:${slug}`
const fieldId = (name: string) => `estimate-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`

const card =
  'flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-ink transition-colors hover:border-brand-blue/60 has-checked:border-brand-blue has-checked:bg-brand-blue/5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-blue'
const input =
  'mt-1.5 block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base text-ink placeholder:text-slate-500 focus-visible:border-brand-blue focus-visible:outline-none aria-invalid:border-red-700'
const label = 'block text-sm font-bold text-ink'

function ErrorText({ name, errors }: { name: string; errors: FieldErrors }) {
  return errors[name] ? (
    <p id={`${fieldId(name)}-error`} className="mt-1.5 text-sm font-semibold text-red-700">
      {errors[name]}
    </p>
  ) : null
}

/** aria props linking a field to its error message */
const describe = (name: string, errors: FieldErrors) =>
  errors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `${fieldId(name)}-error` } : {}

export default function EstimateSurvey({ slug, state, city, phone, tel, survey, consents, ownerCard, confirmationMessage, bookingUrl, turnstileSiteKey }: Props) {
  const [result, formAction, pending] = useActionState<EstimateState, FormData>(submitEstimate, { status: 'idle' })
  const [answers, setAnswers] = useState<Answers>(() => emptyAnswers(city))
  const [preset, setPreset] = useState(false)
  const [stepKey, setStepKey] = useState<StepKey>('service')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [attribution, setAttribution] = useState<Record<string, string>>({})
  const [pageUrl, setPageUrl] = useState('')
  const [ready, setReady] = useState(false)
  const legends = useRef<Partial<Record<StepKey, HTMLLegendElement | null>>>({})
  const successHeading = useRef<HTMLHeadingElement>(null)
  /** Focus moves to the step's legend only after the visitor navigates, never on page load */
  const navigated = useRef(false)

  const consentNames = consents.map((consent) => consent.name)
  const steps = applicableSteps(answers.service, preset)
  const index = Math.max(0, steps.indexOf(stepKey))
  const current = steps[index]
  const isLast = index === steps.length - 1
  const percent = Math.round((index / steps.length) * 100)

  // Browser-only state after hydration: saved answers, ?service= preset, attribution, page URL
  useEffect(() => {
    let saved: { answers?: Partial<Answers>; step?: StepKey } | null = null
    try {
      saved = JSON.parse(sessionStorage.getItem(storageKey(slug)) ?? 'null')
    } catch {
      // storage unavailable
    }
    let next: Answers = { ...emptyAnswers(city), ...saved?.answers }
    let nextStep: StepKey = saved?.step && STEP_ORDER.includes(saved.step) ? saved.step : 'service'

    const presetService = new URLSearchParams(window.location.search).get('service') as AreaService | null
    const isPreset = !!presetService && PRESET_SERVICES.includes(presetService)
    if (isPreset && presetService) {
      if (next.service !== presetService) next = { ...next, service: presetService, areas: [], areasOther: '' }
      if (nextStep === 'service') nextStep = 'areas'
    }

    let stored: Record<string, string> = {}
    try {
      stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? '{}')
    } catch {
      // storage unavailable
    }
    const params = new URLSearchParams(window.location.search)
    const fromUrl = Object.fromEntries(URL_ATTRIBUTION.flatMap((key) => (params.get(key) ? [[key, params.get(key) as string]] : [])))

    setAnswers(next)
    setPreset(isPreset)
    setStepKey(nextStep)
    setAttribution({ ...stored, ...fromUrl })
    setPageUrl(window.location.href)
    setReady(true)
  }, [slug, city])

  // Keep answers across Back and reloads (cleared after a successful request)
  useEffect(() => {
    if (!ready || result.status === 'success') return
    try {
      sessionStorage.setItem(storageKey(slug), JSON.stringify({ answers, step: current }))
    } catch {
      // storage unavailable
    }
  }, [ready, answers, current, slug, result.status])

  // Analytics + focus on every step shown
  useEffect(() => {
    if (!ready || result.status === 'success') return
    pushDataLayer({ event: 'estimate_step_view', step: STEP_ORDER.indexOf(current), step_key: current })
    if (navigated.current) legends.current[current]?.focus()
  }, [ready, current, result.status])

  // Server answer
  useEffect(() => {
    if (result.status === 'invalid') {
      navigated.current = true
      setErrors(result.errors)
      setStepKey(result.step)
    }
    if (result.status === 'success') {
      pushDataLayer({ event: 'estimate_submit', service: answers.service ? survey.serviceOptions[answers.service] : '' })
      try {
        sessionStorage.removeItem(storageKey(slug))
      } catch {
        // storage unavailable
      }
      successHeading.current?.focus()
    }
    // answers/survey are read only at the moment the result arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  const update = (patch: Partial<Answers>, clear: string[] = Object.keys(patch)) => {
    setAnswers((a) => ({ ...a, ...patch }))
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([key]) => !clear.includes(key))))
  }

  const focusFirstError = (found: FieldErrors) => {
    const first = Object.keys(found)[0]
    if (first) requestAnimationFrame(() => document.getElementById(fieldId(first))?.focus())
  }

  const goTo = (step: StepKey) => {
    navigated.current = true
    setStepKey(step)
  }

  const next = () => {
    const found = validateStep(current, answers, survey, consentNames)
    setErrors(found)
    if (Object.keys(found).length) return focusFirstError(found)
    if (!isLast) goTo(steps[index + 1])
  }

  const back = () => {
    setErrors({})
    if (index > 0) goTo(steps[index - 1])
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Enter in a text field on an earlier step means "Next", not "send"
    if (!isLast) {
      event.preventDefault()
      next()
      return
    }
    const { errors: found, step } = validateAll(answers, survey, consentNames)
    if (step) {
      event.preventDefault()
      setErrors(found)
      if (step !== current) goTo(step)
      else focusFirstError(found)
    }
  }

  if (result.status === 'success') {
    return (
      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8" role="status">
        <h2 ref={successHeading} tabIndex={-1} className="text-2xl font-extrabold tracking-tight text-ink focus:outline-none md:text-3xl">
          {fillTokens(survey.successHeading, { firstName: result.firstName })}
        </h2>
        <p className="mt-3 text-lg text-slate-700">{confirmationMessage}</p>
        <NextSteps title={survey.nextStepsTitle} items={survey.nextSteps} />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {bookingUrl && (
            <CtaButton href={bookingUrl} className="w-full sm:w-auto">
              <CalendarCheck className="size-5" aria-hidden /> Pick a time now
            </CtaButton>
          )}
          {tel && (
            <CtaButton href={tel} variant={bookingUrl ? 'navy' : 'orange'} className="w-full sm:w-auto">
              <Phone className="size-5" aria-hidden /> Call {phone}
            </CtaButton>
          )}
        </div>
      </div>
    )
  }

  const areaChoices = answers.service && answers.service !== 'notSure' ? survey.areaOptions[answers.service] : []
  const fieldsetProps = (key: StepKey) => ({ 'data-step': key, hidden: key !== current, className: 'min-w-0' })
  const legend = (key: StepKey, text: string) => (
    <legend
      ref={(el) => {
        legends.current[key] = el
      }}
      tabIndex={-1}
      className="text-2xl leading-tight font-extrabold tracking-tight text-balance text-ink focus:outline-none md:text-3xl"
    >
      {text}
    </legend>
  )
  const text = (name: keyof Answers, formName: string, labelText: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={fieldId(name)} className={label}>
        {labelText}
      </label>
      <input
        id={fieldId(name)}
        name={formName}
        value={answers[name] as string}
        onChange={(e) => update({ [name]: e.target.value } as Partial<Answers>)}
        className={input}
        {...describe(name, errors)}
        {...props}
      />
      <ErrorText name={name} errors={errors} />
    </div>
  )

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="mt-5">
      {/* Without JavaScript every step shows at once (one-page form) and online submission isn't available */}
      <noscript>
        <style>{'[data-step]{display:block!important}[data-js-only]{display:none!important}[data-submit]{display:inline-flex!important}'}</style>
        <p className="mb-6 rounded-xl bg-orange-50 p-4 font-semibold text-ink ring-1 ring-orange-200">
          Please call us at {tel ? <a href={tel} className="text-cta underline">{phone}</a> : phone} to request your free estimate.
        </p>
      </noscript>

      <input type="hidden" name="location" value={slug} />
      <input type="hidden" name="page_url" value={pageUrl} />
      <input type="hidden" name="input_text_2" value={state} />
      {ATTRIBUTION_FIELDS.map((key) =>
        (URL_ATTRIBUTION as readonly string[]).includes(key) ? (
          <input key={key} type="hidden" name={key} value={attribution[key] ?? ''} />
        ) : (
          // Uncontrolled: Attributer (via GTM) writes these values directly
          <input key={key} type="hidden" name={key} defaultValue="" />
        ),
      )}
      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div data-js-only>
        <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>{fillTokens(survey.progressLabel, { percent: String(percent) })}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Survey progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
        >
          <div className="h-full rounded-full bg-brand-blue transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {/* 0. Service */}
        <fieldset {...fieldsetProps('service')}>
          {legend('service', survey.serviceQuestion)}
          <div className="mt-5 grid gap-3" {...describe('service', errors)}>
            {SERVICE_KEYS.map((key) => (
              <label key={key} className={card}>
                <input
                  type="radio"
                  name="service"
                  value={key}
                  id={key === SERVICE_KEYS[0] ? fieldId('service') : undefined}
                  checked={answers.service === key}
                  onChange={() => update({ service: key, areas: answers.service === key ? answers.areas : [], areasOther: '' }, ['service', 'areas', 'areasOther'])}
                  className="size-5 accent-brand-blue"
                />
                {survey.serviceOptions[key]}
              </label>
            ))}
          </div>
          <ErrorText name="service" errors={errors} />
        </fieldset>

        {/* 1. Areas */}
        <fieldset {...fieldsetProps('areas')}>
          {legend('areas', survey.areasQuestion)}
          <p className="mt-2 text-slate-600">{survey.areasHelper}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" {...describe('areas', errors)}>
            {[...areaChoices, OTHER_AREA].map((area, i) => (
              <label key={area} className={card}>
                <input
                  type="checkbox"
                  name="areas"
                  value={area}
                  id={i === 0 ? fieldId('areas') : undefined}
                  checked={answers.areas.includes(area)}
                  onChange={(e) =>
                    update(
                      { areas: e.target.checked ? [...answers.areas, area] : answers.areas.filter((a) => a !== area), ...(area === OTHER_AREA && !e.target.checked ? { areasOther: '' } : {}) },
                      ['areas', 'areasOther'],
                    )
                  }
                  className="size-5 accent-brand-blue"
                />
                {area === OTHER_AREA ? survey.otherLabel : area}
              </label>
            ))}
          </div>
          <ErrorText name="areas" errors={errors} />
          {answers.areas.includes(OTHER_AREA) && (
            <div className="mt-4">{text('areasOther', 'areas_other', survey.otherLabel, { placeholder: survey.otherPlaceholder, maxLength: 60 })}</div>
          )}
        </fieldset>

        {/* 2. Timeline + optional message */}
        <fieldset {...fieldsetProps('timeline')}>
          {legend('timeline', survey.timelineQuestion)}
          <div className="mt-5 grid gap-3" {...describe('timeline', errors)}>
            {survey.timelineOptions.map((option, i) => (
              <label key={option} className={card}>
                <input
                  type="radio"
                  name="timeline"
                  value={option}
                  id={i === 0 ? fieldId('timeline') : undefined}
                  checked={answers.timeline === option}
                  onChange={() => update({ timeline: option })}
                  className="size-5 accent-brand-blue"
                />
                {option}
              </label>
            ))}
          </div>
          <ErrorText name="timeline" errors={errors} />
          <div className="mt-6">
            <label htmlFor={fieldId('message')} className={label}>
              {survey.messageLabel} <span className="font-normal text-slate-600">(optional)</span>
            </label>
            <textarea
              id={fieldId('message')}
              name="message"
              rows={3}
              maxLength={5000}
              value={answers.message}
              onChange={(e) => update({ message: e.target.value })}
              className={input}
              {...describe('message', errors)}
            />
            <ErrorText name="message" errors={errors} />
          </div>
        </fieldset>

        {/* 3. Address (state comes from the location) */}
        <fieldset {...fieldsetProps('address')}>
          {legend('address', survey.addressQuestion)}
          <div className="mt-5 space-y-4">
            {text('street', 'input_text', survey.streetLabel, { autoComplete: 'street-address' })}
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              {text('city', 'input_text_1', survey.cityLabel, { autoComplete: 'address-level2' })}
              {text('zip', 'input_text_3', survey.zipLabel, { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 10 })}
            </div>
          </div>
        </fieldset>

        {/* 4. Name */}
        <fieldset {...fieldsetProps('name')}>
          {legend('name', survey.nameQuestion)}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {text('firstName', 'first_name', survey.firstNameLabel, { autoComplete: 'given-name' })}
            {text('lastName', 'last_name', survey.lastNameLabel, { autoComplete: 'family-name' })}
          </div>
          <p className="mt-3 text-slate-600">{survey.nameHelper}</p>
        </fieldset>

        {/* 5. Email + what happens next */}
        <fieldset {...fieldsetProps('email')}>
          {legend('email', survey.emailQuestion)}
          <div className="mt-5">{text('email', 'email', survey.emailLabel, { type: 'email', autoComplete: 'email', inputMode: 'email' })}</div>
          <NextSteps title={survey.nextStepsTitle} items={survey.nextSteps} />
        </fieldset>

        {/* 6. Phone + owner + consent + submit */}
        <fieldset {...fieldsetProps('phone')}>
          {legend('phone', survey.phoneQuestion)}
          <div className="mt-5">
            <label htmlFor={fieldId('phone')} className={label}>
              {survey.phoneLabel}
            </label>
            <input
              id={fieldId('phone')}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={answers.phone}
              onChange={(e) => update({ phone: formatUsPhone(e.target.value) })}
              placeholder="(865) 555-0123"
              className={input}
              {...describe('phone', errors)}
            />
            <ErrorText name="phone" errors={errors} />
          </div>
          <div className="mt-6">{ownerCard}</div>
          <div className="mt-6 space-y-4">
            {consents.map(({ name, content }) => {
              const key = `consent:${name}`
              return (
                <div key={name}>
                  <div className="flex items-start gap-3">
                    <input
                      id={fieldId(key)}
                      type="checkbox"
                      name={key}
                      value="yes"
                      checked={!!answers.consents[name]}
                      onChange={(e) => update({ consents: { ...answers.consents, [name]: e.target.checked } }, [key])}
                      className="mt-1 size-5 shrink-0 accent-brand-blue"
                      {...describe(key, errors)}
                    />
                    <label htmlFor={fieldId(key)} className="text-sm leading-relaxed text-slate-700">
                      {content}
                    </label>
                  </div>
                  <ErrorText name={key} errors={errors} />
                </div>
              )
            })}
          </div>
          <Turnstile siteKey={turnstileSiteKey} />
          <button
            type="submit"
            data-submit
            hidden={!isLast}
            disabled={pending}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cta px-6 py-3.5 text-lg font-bold text-white shadow-sm transition-colors hover:bg-cta-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-70"
          >
            {pending ? 'Sending…' : survey.submitLabel}
          </button>
        </fieldset>
      </div>

      {result.status === 'call-us' && (
        <div role="alert" className="mt-6 rounded-xl bg-orange-50 p-5 ring-1 ring-orange-200">
          <p className="font-bold text-ink">
            Please call us at {tel ? <a href={tel} className="text-cta underline underline-offset-2">{phone}</a> : phone}.
          </p>
          {tel && (
            <CtaButton href={tel} size="md" className="mt-3">
              <Phone className="size-5" aria-hidden /> Call {phone}
            </CtaButton>
          )}
        </div>
      )}

      <div data-js-only className="mt-8 flex items-center gap-3">
        {index > 0 && (
          <button
            type="button"
            onClick={back}
            className="rounded-xl border-2 border-slate-300 px-5 py-3 font-bold text-ink transition-colors hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {survey.backLabel}
          </button>
        )}
        {!isLast && (
          <button
            type="button"
            onClick={next}
            className="ml-auto rounded-xl bg-brand-blue-text px-7 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {survey.nextLabel}
          </button>
        )}
      </div>
    </form>
  )
}
