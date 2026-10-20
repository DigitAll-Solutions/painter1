import type { Location } from '@/sanity/lib/types'

import { cityOrPlace } from './place.ts'

// Copy in service documents can say {city}, {state} and {owner} (owner first name).
// Every token always resolves, so a raw "{city}" never reaches the page.
export function tokenValues(location: Location) {
  return {
    city: cityOrPlace(location),
    state: location.address?.state ?? '',
    owner: location.ownerName?.split(' ')[0] ?? 'our owner',
  }
}

export function fillTokens(text: string, location: Location) {
  const values = tokenValues(location)
  // No state yet: drop ", {state}" with it, so "in {city}, {state} by…" doesn't read "in Upstate SC,  by…"
  const source = values.state ? text : text.replace(/,?[ \t]*\{state\}/gi, '')
  return source.replace(/\{(city|state|owner)\}/gi, (_, key: string) => values[key.toLowerCase() as keyof typeof values])
}

/** fillTokens in every text span of Portable Text */
export function fillTokenBlocks<T extends { _type?: string; children?: unknown }>(blocks: T[], location: Location): T[] {
  return blocks.map((block) =>
    block._type === 'block' && Array.isArray(block.children)
      ? { ...block, children: (block.children as { text?: unknown }[]).map((child) => (typeof child.text === 'string' ? { ...child, text: fillTokens(child.text, location) } : child)) }
      : block,
  )
}
