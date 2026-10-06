// Cloudflare Turnstile. Until the client's Turnstile account exists, Cloudflare's official
// always-pass test keys are used; in production that also logs a warning (no code change later,
// only TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY need adding).
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/

const TEST_SITE_KEY = '1x00000000000000000000AA'
const TEST_SECRET_KEY = '1x0000000000000000000000000000000AA'

const isProduction = () => process.env.VERCEL_ENV === 'production' || (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production')

function warnIfTestKeys(which: string) {
  if (isProduction()) console.warn(`[estimate] ${which} is not set: using Cloudflare's always-pass Turnstile test keys (every check passes)`)
}

/** Public site key for the widget */
export function turnstileSiteKey() {
  if (process.env.TURNSTILE_SITE_KEY) return process.env.TURNSTILE_SITE_KEY
  warnIfTestKeys('TURNSTILE_SITE_KEY')
  return TEST_SITE_KEY
}

/** Verifies a widget token with Cloudflare. No token, a network error or a failed check → false. */
export async function verifyTurnstile(token: string, ip?: string) {
  if (!token) return false
  const secret = process.env.TURNSTILE_SECRET_KEY || TEST_SECRET_KEY
  if (!process.env.TURNSTILE_SECRET_KEY) warnIfTestKeys('TURNSTILE_SECRET_KEY')
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, cache: 'no-store' })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) console.warn('[estimate] Turnstile check failed', data['error-codes'])
    return data.success === true
  } catch (error) {
    console.error('[estimate] Turnstile verification error', error)
    return false
  }
}
