// Who a lead email goes to, decided only by env values (no code change at launch):
//   LEAD_TEST_RECIPIENT set           → test mode: only that address, "[TEST] " subject
//   unset + LEAD_SEND_LIVE=true       → live: the location's recipients
//   unset + LEAD_SEND_LIVE not "true" → refused: nothing is sent (a forgotten var can't reach real staff)

import { senderFromEnv, type Sender } from './email-send.ts'

export type Delivery =
  | { kind: 'test'; to: string[]; subject: string; from: Sender }
  | { kind: 'live'; subject: string; from: Sender }
  | { kind: 'refused'; subject: string; reason: string }

type Env = Record<string, string | undefined>

export function resolveDelivery(env: Env, subject: string): Delivery {
  const testRecipient = env.LEAD_TEST_RECIPIENT?.trim()
  if (testRecipient) {
    // Brevo has no shared test sender: without LEAD_FROM_EMAIL the send is skipped (lib/email-send.ts)
    return { kind: 'test', to: [testRecipient], subject: `[TEST] ${subject}`, from: senderFromEnv(env) }
  }
  if (env.LEAD_SEND_LIVE !== 'true') return { kind: 'refused', subject, reason: 'LEAD_TEST_RECIPIENT unset and LEAD_SEND_LIVE is not "true"' }
  const from = senderFromEnv(env)
  if (!from.email) return { kind: 'refused', subject, reason: 'LEAD_FROM_EMAIL is not set' }
  return { kind: 'live', subject, from }
}

/** Short description stored on the lead: "test", "live" or "refused (<reason>)" */
export const deliveryLabel = (delivery: Delivery) => (delivery.kind === 'refused' ? `refused (${delivery.reason})` : delivery.kind)
