// Consent checkbox text. Blocks are shared in shape across locations and name the business with a
// {locationName} placeholder, filled per location on the form AND in the stored lead record, so the
// record always holds exactly what the visitor read. Pure functions (tested in consent.test.ts).
import type { ConsentBlock } from '../sanity/lib/types.ts'

export const LOCATION_NAME_TOKEN = '{locationName}'

type Span = { _type?: string; text?: string; [key: string]: unknown }

/** Replace {locationName} in every text span (a placeholder must sit inside one span, as typed in Studio) */
export function fillConsentBlocks(blocks: ConsentBlock[], locationName: string): ConsentBlock[] {
  return blocks.map((block) => ({
    ...block,
    body: block.body.map((part) => {
      const children = (part as { children?: Span[] }).children
      if (!children) return part
      return { ...part, children: children.map((child) => (typeof child.text === 'string' ? { ...child, text: child.text.split(LOCATION_NAME_TOKEN).join(locationName) } : child)) }
    }) as ConsentBlock['body'],
  }))
}

/** Consent text as the visitor read it: paragraphs separated by a blank line */
export const consentPlainText = (body: ConsentBlock['body']) =>
  body
    .map((block) => ((block.children as { text?: string }[] | undefined) ?? []).map((child) => child.text ?? '').join('').trim())
    .filter(Boolean)
    .join('\n\n')
