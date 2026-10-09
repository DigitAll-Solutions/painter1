// Server-side email through Brevo's transactional API (plain fetch, no SDK). Used by the estimate and
// warranty actions. Bodies are sent as text only (textContent), exactly as built: the Client Tether
// parser reads the lead email, so not a byte may change. Docs: docs/email-setup.md.
export const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export type Sender = { email: string; name: string }
export type EmailMessage = { from: Sender; to: string[]; subject: string; text: string; replyTo?: string }
export type EmailResult = { status: string; messageId?: string; error?: string; sentAt?: string }

/** Sender from env: LEAD_FROM_EMAIL (verified in Brevo) and LEAD_FROM_NAME (default "Painter1") */
export const senderFromEnv = (env: Record<string, string | undefined>): Sender => ({
  email: env.LEAD_FROM_EMAIL?.trim() ?? '',
  name: env.LEAD_FROM_NAME?.trim() || 'Painter1',
})

/** The JSON body Brevo receives: text only, no htmlContent, so Brevo sends a text/plain message */
export function brevoPayload(message: EmailMessage) {
  return {
    sender: { name: message.from.name, email: message.from.email },
    to: message.to.map((email) => ({ email })),
    subject: message.subject,
    textContent: message.text,
    ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
  }
}

export async function sendEmail(message: EmailMessage, apiKey = process.env.BREVO_API_KEY): Promise<EmailResult> {
  if (!apiKey) return { status: 'skipped (no BREVO_API_KEY)' }
  if (!message.from.email) return { status: 'skipped (LEAD_FROM_EMAIL is not set)' }
  if (!message.to.length) return { status: 'failed', error: 'No recipients' }
  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(brevoPayload(message)),
      cache: 'no-store',
    })
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; code?: string; message?: string }
    if (!res.ok) return { status: 'failed', error: `Brevo ${res.status}: ${data.code ?? ''} ${data.message ?? 'unknown error'}`.replace(/\s+/g, ' ') }
    return { status: 'sent', messageId: data.messageId, sentAt: new Date().toISOString() }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) }
  }
}
