// Ringbot web chat (api.callwidget.co): one install per location; its iID carries that location's
// business name and phone, so a location must never use another location's ID. Studio stores only the
// iID (extractRingbotId pulls it out of a pasted embed code or URL); the site builds the script URL
// itself and accepts nothing but a bare iID, so no other script can be injected. Tested in ringbot.test.ts.
export const RINGBOT_EMBED = 'https://api.callwidget.co/embed'

/** A bare iID: base64 (standard or URL-safe) characters with optional padding, of a sensible length */
const ID_PATTERN = /^[A-Za-z0-9+/_-]{20,1024}={0,2}$/

/** The iID to load on the site: only a bare, valid iID; anything else (script tags, URLs, junk) is ignored */
export function ringbotId(value?: string | null): string | undefined {
  const id = value?.trim()
  return id && ID_PATTERN.test(id) ? id : undefined
}

/** Studio: the iID from what an editor pastes (the whole embed code, its URL or the bare iID) */
export function extractRingbotId(pasted?: string | null): string | undefined {
  const raw = pasted?.trim()
  if (!raw) return undefined
  const match = raw.match(/[?&]iID=([^"'&\s>]+)/)
  let id = match ? match[1] : raw
  try {
    id = decodeURIComponent(id)
  } catch {
    return undefined
  }
  return ringbotId(id)
}

export const ringbotSrc = (id: string) => `${RINGBOT_EMBED}?iID=${encodeURIComponent(id)}`
