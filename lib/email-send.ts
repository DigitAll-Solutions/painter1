// Server-side email through Resend's REST API (no SDK). Used by the estimate and warranty actions.
export type EmailResult = { status: string; resendId?: string; error?: string; sentAt?: string }

export async function sendEmail(message: { from: string; to: string[]; subject: string; text: string; replyTo?: string }): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { status: 'skipped (no RESEND_API_KEY)' }
  if (!message.to.length) return { status: 'failed', error: 'No recipients' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: message.from, to: message.to, subject: message.subject, text: message.text, reply_to: message.replyTo }),
      cache: 'no-store',
    })
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!res.ok) return { status: 'failed', error: `Resend ${res.status}: ${data.message ?? 'unknown error'}` }
    return { status: 'sent', resendId: data.id, sentAt: new Date().toISOString() }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) }
  }
}
