'use client'

import { startTransition, useActionState, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Phone, X } from 'lucide-react'

import CtaButton from '../CtaButton'
import Turnstile from '../estimate/Turnstile'
import { submitWarranty, type WarrantyState } from '@/app/[location]/warranty/actions'
import { HONEYPOT_FIELD } from '@/lib/estimate-form'
import { PHOTO_LIMITS, validateWarranty, WARRANTY_AREAS, type WarrantyErrors, type WarrantyFields } from '@/lib/warranty'

type Props = { slug: string; locationName: string; phone?: string; tel?: string; turnstileSiteKey: string }
type Photo = { id: string; name: string; file: File; preview: string }

const fieldId = (name: string) => `warranty-${name}`
const input =
  'mt-1.5 block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base text-ink placeholder:text-slate-500 focus-visible:border-brand-blue focus-visible:outline-none aria-invalid:border-red-700'
const label = 'block text-sm font-bold text-ink'
const describe = (name: string, errors: WarrantyErrors) =>
  errors[name as keyof WarrantyErrors] ? { 'aria-invalid': true as const, 'aria-describedby': `${fieldId(name)}-error` } : {}

function ErrorText({ name, errors }: { name: string; errors: WarrantyErrors }) {
  const message = errors[name as keyof WarrantyErrors]
  return message ? (
    <p id={`${fieldId(name)}-error`} className="mt-1.5 text-sm font-semibold text-red-700">
      {message}
    </p>
  ) : null
}

const isHeic = (file: File) => /hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name)

/** Shrink a photo to PHOTO_LIMITS.maxSide on its long side, as JPEG (also converts HEIC where the browser can read it) */
async function resize(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_LIMITS.maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!blob) throw new Error('resize failed')
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

/**
 * Warranty repair request form. With JavaScript: checks fields as the server does, resizes photos in
 * the browser (max 5, up to 10 MB each before resizing) and submits without a page reload. Without
 * JavaScript it posts the plain form to the same server action.
 */
export default function WarrantyForm({ slug, locationName, phone, tel, turnstileSiteKey }: Props) {
  const [result, formAction, pending] = useActionState<WarrantyState, FormData>(submitWarranty, { status: 'idle' })
  const [errors, setErrors] = useState<WarrantyErrors>({})
  const [photos, setPhotos] = useState<Photo[]>([])
  const [processing, setProcessing] = useState(false)
  const [seenResult, setSeenResult] = useState(result)
  const form = useRef<HTMLFormElement>(null)
  const pageUrl = useRef<HTMLInputElement>(null)
  const status = useRef<HTMLDivElement>(null)

  // A new server result replaces the field errors (derived during render, not in an effect)
  if (result !== seenResult) {
    setSeenResult(result)
    if (result.status === 'invalid') setErrors(result.errors)
  }

  useEffect(() => {
    if (pageUrl.current) pageUrl.current.value = window.location.href
  }, [])
  useEffect(() => {
    if (result.status === 'invalid') {
      const first = Object.keys(result.errors)[0]
      if (first) document.getElementById(fieldId(first))?.focus()
    }
    if (result.status === 'success' || result.status === 'call-us') status.current?.focus()
  }, [result])
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), [photos])

  const onPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = [...(event.target.files ?? [])]
    event.target.value = '' // the resized copies are sent, not the input's files
    if (!chosen.length) return
    const room = PHOTO_LIMITS.count - photos.length
    const problems: string[] = []
    if (chosen.length > room) problems.push(`Up to ${PHOTO_LIMITS.count} photos: the extra ${chosen.length - room} weren't added.`)
    setProcessing(true)
    const added: Photo[] = []
    for (const file of chosen.slice(0, Math.max(0, room))) {
      const okType = (PHOTO_LIMITS.types as readonly string[]).includes(file.type) || isHeic(file) || /\.(jpe?g|png|webp)$/i.test(file.name)
      if (!okType) problems.push(`${file.name}: please use a JPG, PNG, HEIC or WebP photo.`)
      else if (file.size > PHOTO_LIMITS.maxBytes) problems.push(`${file.name}: larger than 10 MB.`)
      else {
        try {
          const small = await resize(file)
          added.push({ id: `${file.name}-${file.lastModified}-${Math.random()}`, name: file.name, file: small, preview: URL.createObjectURL(small) })
        } catch {
          problems.push(`${file.name}: this browser can't read it${isHeic(file) ? ' (HEIC). Please send it as a JPG' : ''}.`)
        }
      }
    }
    setProcessing(false)
    setPhotos((list) => [...list, ...added])
    setErrors((e) => ({ ...e, photos: problems.length ? problems.join(' ') : undefined }))
  }

  const readFields = (data: FormData): WarrantyFields => ({
    firstName: String(data.get('first_name') ?? ''),
    lastName: String(data.get('last_name') ?? ''),
    phone: String(data.get('phone') ?? ''),
    email: String(data.get('email') ?? ''),
    address: String(data.get('address') ?? ''),
    projectDate: String(data.get('project_date') ?? ''),
    area: String(data.get('area') ?? ''),
    issue: String(data.get('issue') ?? ''),
    hasContract: data.get('has_contract') === 'yes',
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const found = validateWarranty(readFields(data))
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(fieldId(first))?.focus()
      return
    }
    data.delete('photos')
    for (const photo of photos) data.append('photos', photo.file)
    startTransition(() => formAction(data))
  }

  if (result.status === 'success') {
    return (
      <div ref={status} tabIndex={-1} role="status" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 focus:outline-none md:p-8">
        <h3 className="text-2xl font-extrabold tracking-tight text-ink">Thanks, {result.firstName}! We received your warranty request.</h3>
        <p className="mt-3 text-lg text-slate-700">{locationName} will contact you to schedule an inspection.</p>
        {tel && (
          <CtaButton href={tel} variant="navy" className="mt-6">
            <Phone className="size-5" aria-hidden /> Call {phone}
          </CtaButton>
        )}
      </div>
    )
  }

  const text = (name: keyof WarrantyFields, formName: string, labelText: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={fieldId(name)} className={label}>
        {labelText}
      </label>
      <input id={fieldId(name)} name={formName} className={input} {...describe(name, errors)} {...props} />
      <ErrorText name={name} errors={errors} />
    </div>
  )

  return (
    <form ref={form} action={formAction} onSubmit={onSubmit} noValidate encType="multipart/form-data" className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-24px_rgb(11_27_51/0.25)] ring-1 ring-slate-200 md:p-8">
      <input type="hidden" name="location" value={slug} />
      <input ref={pageUrl} type="hidden" name="page_url" defaultValue="" />
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>
          Website <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {result.status === 'call-us' && (
        <div ref={status} tabIndex={-1} role="alert" className="mb-6 rounded-2xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200 focus:outline-none">
          Sorry, we couldn&apos;t send your request online.{' '}
          {tel ? (
            <>
              Please call us at{' '}
              <a href={tel} className="font-bold underline">
                {phone}
              </a>
              .
            </>
          ) : (
            'Please try again in a few minutes.'
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {text('firstName', 'first_name', 'First name', { autoComplete: 'given-name', required: true })}
        {text('lastName', 'last_name', 'Last name', { autoComplete: 'family-name', required: true })}
        {text('phone', 'phone', 'Phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', required: true })}
        {text('email', 'email', 'Email', { type: 'email', autoComplete: 'email', required: true })}
        <div className="sm:col-span-2">{text('address', 'address', 'Address of the painted property', { autoComplete: 'street-address', required: true })}</div>
        {text('projectDate', 'project_date', 'Approx. date of original project', { type: 'month', placeholder: 'e.g. 2024-03' })}
        <div>
          <label htmlFor={fieldId('area')} className={label}>
            Area
          </label>
          <select id={fieldId('area')} name="area" defaultValue="Interior" className={input} {...describe('area', errors)}>
            {WARRANTY_AREAS.map((area) => (
              <option key={area}>{area}</option>
            ))}
          </select>
          <ErrorText name="area" errors={errors} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={fieldId('issue')} className={label}>
            What are you seeing?
          </label>
          <textarea
            id={fieldId('issue')}
            name="issue"
            rows={4}
            required
            placeholder="Where is the peeling or blistering, and roughly how large an area?"
            className={input}
            {...describe('issue', errors)}
          />
          <ErrorText name="issue" errors={errors} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={fieldId('photos')} className={label}>
            Photos (optional)
          </label>
          <p id={`${fieldId('photos')}-hint`} className="mt-1 text-sm text-slate-600">
            Up to {PHOTO_LIMITS.count} photos (JPG, PNG, HEIC or WebP, max 10 MB each).
          </p>
          <label
            className={`mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-mist px-4 py-4 font-semibold text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-blue ${photos.length >= PHOTO_LIMITS.count ? 'pointer-events-none opacity-60' : 'hover:border-brand-blue/60'}`}
          >
            <ImagePlus className="size-5 text-brand-blue-dark" aria-hidden />
            {processing ? 'Preparing photos…' : photos.length ? 'Add more photos' : 'Choose photos'}
            <input
              id={fieldId('photos')}
              type="file"
              name="photos"
              multiple
              accept={PHOTO_LIMITS.accept}
              onChange={onPhotos}
              disabled={photos.length >= PHOTO_LIMITS.count}
              className="sr-only"
              aria-describedby={errors.photos ? `${fieldId('photos')}-hint ${fieldId('photos')}-error` : `${fieldId('photos')}-hint`}
            />
          </label>
          <ErrorText name="photos" errors={errors} />
          {photos.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="Chosen photos">
              {photos.map((photo) => (
                <li key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-mist">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the resized photo */}
                  <img src={photo.preview} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((list) => list.filter((p) => p.id !== photo.id))}
                    aria-label={`Remove ${photo.name}`}
                    className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-ink/80 text-white focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-start gap-3 sm:col-span-2">
          <input id={fieldId('hasContract')} type="checkbox" name="has_contract" value="yes" className="mt-1 size-5 shrink-0 accent-brand-blue" />
          <label htmlFor={fieldId('hasContract')} className="text-slate-700">
            I have my original signed contract.
          </label>
        </div>
      </div>

      <Turnstile siteKey={turnstileSiteKey} />

      <button
        type="submit"
        disabled={pending || processing}
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-cta px-6 py-3.5 text-lg font-bold text-white shadow-sm transition-colors hover:bg-cta-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-70"
      >
        {pending ? 'Sending…' : 'Submit Warranty Request'}
      </button>
    </form>
  )
}
