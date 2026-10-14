// Ringbot web chat (api.callwidget.co): one install per location; its iID carries that location's
// business name and phone, so a location must never use another location's ID. Studio takes either the
// whole embed code or just the iID. Tested in ringbot.test.ts.
export const RINGBOT_EMBED = 'https://api.callwidget.co/embed'

/** The iID from a pasted embed code (or the bare ID); undefined if it isn't one */
export function ringbotId(value?: string | null): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined
  const match = raw.match(/[?&]iID=([^"'&\s>]+)/)
  let id = match ? match[1] : raw
  try {
    id = decodeURIComponent(id)
  } catch {
    return undefined
  }
  return /^[A-Za-z0-9+/=_-]{20,}$/.test(id) ? id : undefined
}

export const ringbotSrc = (id: string) => `${RINGBOT_EMBED}?iID=${encodeURIComponent(id)}`
