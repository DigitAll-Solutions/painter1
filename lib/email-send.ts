// Server-side email through Brevo's SMTP relay (smtp-relay.brevo.com:587, nodemailer), used by the estimate
// action. The Client Tether parser reads the lead email, so the body must arrive exactly as built
// (lib/lead-email.ts): it is sent as `text` only, one text/plain part. Brevo's transactional API is not
// used for sending: it turns a text-only send into text/html (newlines become <br/>, & becomes &amp;,
// an open-tracking pixel is added). Docs: docs/email-setup.md.
import nodemailer from 'nodemailer'

export const BREVO_SMTP_HOST = 'smtp-relay.brevo.com'

export type Sender = { email: string; name: string }
export type EmailMessage = { from: Sender; to: string[]; subject: string; text: string; replyTo?: string }
export type EmailResult = { status: string; messageId?: string; error?: string; sentAt?: string }
type Env = Record<string, string | undefined>

/** Sender from env: LEAD_FROM_EMAIL (verified in Brevo) and LEAD_FROM_NAME (default "Painter1") */
export const senderFromEnv = (env: Env): Sender => ({
  email: env.LEAD_FROM_EMAIL?.trim() ?? '',
  name: env.LEAD_FROM_NAME?.trim() || 'Painter1',
})

/** SMTP credentials (Brevo → SMTP & API → SMTP): both BREVO_SMTP_USER and BREVO_SMTP_KEY, or nothing */
const smtpAuth = (env: Env) => {
  const user = env.BREVO_SMTP_USER?.trim()
  const pass = env.BREVO_SMTP_KEY?.trim()
  return user && pass ? { user, pass } : undefined
}

export const emailConfigured = (env: Env = process.env) => Boolean(smtpAuth(env))

/** The message nodemailer builds: `text` only (no `html`), so it is a single text/plain part */
export function smtpMessage(message: EmailMessage) {
  return {
    from: { name: message.from.name, address: message.from.email },
    to: message.to,
    subject: message.subject,
    text: message.text,
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
  }
}

export async function sendEmail(message: EmailMessage, env: Env = process.env): Promise<EmailResult> {
  const auth = smtpAuth(env)
  if (!auth) return { status: 'skipped (no BREVO_SMTP_USER/BREVO_SMTP_KEY)' }
  if (!message.from.email) return { status: 'skipped (LEAD_FROM_EMAIL is not set)' }
  if (!message.to.length) return { status: 'failed', error: 'No recipients' }
  try {
    const transport = nodemailer.createTransport({ host: BREVO_SMTP_HOST, port: 587, secure: false, requireTLS: true, auth })
    const info = await transport.sendMail(smtpMessage(message))
    return { status: 'sent', messageId: info.messageId, sentAt: new Date().toISOString() }
  } catch (error) {
    // nodemailer errors carry the server's reply, never the credentials
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) }
  }
}
