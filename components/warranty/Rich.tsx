import { Fragment } from 'react'

/**
 * Text from the warranty terms where **double asterisks** mark emphasis: bold in body text, the accent
 * color in headings (pass accentClass).
 */
export default function Rich({ text, accentClass }: { text?: string; accentClass?: string }) {
  if (!text) return null
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 ? (
          accentClass ? (
            <span key={i} className={accentClass}>
              {part}
            </span>
          ) : (
            <strong key={i} className="font-bold text-ink">
              {part}
            </strong>
          )
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

/** Fill {city}, {ownerFull}, {locationName} */
export const fillWarranty = (text: string | undefined, tokens: { city: string; ownerFull: string; locationName: string }) =>
  (text ?? '').replace(/\{(city|ownerFull|locationName)\}/g, (_, key: keyof typeof tokens) => tokens[key])
