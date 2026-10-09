import { leadReadClient } from '@/sanity/lib/private-client'

// Per-IP limit for the public forms, counted from the private documents they save (lead / warrantyRequest
// store the visitor's IP), so it holds across serverless instances. Fails open: if the count can't be
// read, the request goes through (Turnstile and the honeypot still apply).
export const FORM_LIMIT = { requests: 5, minutes: 60 }

export async function tooManyRequests(type: 'lead' | 'warrantyRequest', ip: string): Promise<boolean> {
  if (!ip) return false
  const reader = leadReadClient()
  if (!reader) return false
  try {
    const since = new Date(Date.now() - FORM_LIMIT.minutes * 60_000).toISOString()
    const count = await reader.fetch<number>(`count(*[_type == $type && ip == $ip && submittedAt > $since])`, { type, ip, since }, { cache: 'no-store' })
    return count >= FORM_LIMIT.requests
  } catch {
    return false
  }
}
