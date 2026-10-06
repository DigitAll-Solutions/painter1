// Builds the lead notification email from a location's Fluent Forms template, so the text that
// reaches staff and the Client Tether parser is identical to what Fluent Forms produced.
// No framework imports: unit-tested with `node --test` and used by scripts.

export type LeadEmailData = {
  /** Field values by Fluent Forms input name, e.g. { email, names: { first_name } } */
  inputs: Record<string, unknown>
  /** Submission values, e.g. { source_url, id, created_at } */
  submission: Record<string, unknown>
}

// Fluent Forms smartcodes used in notification templates: {inputs.<path>} and {submission.<key>}
const PLACEHOLDER = /\{(inputs|submission)\.([A-Za-z0-9_.-]+)\}/g

function resolve(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), source)
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ')
  if (typeof value === 'object') return ''
  return String(value)
}

/**
 * Replaces every {inputs.*} / {submission.*} placeholder in a single pass, so text inside the
 * submitted values is never treated as a placeholder. Missing values and unknown placeholders
 * become an empty string, like Fluent Forms. Everything else (newlines, spacing, the trailing
 * space after the PARSER line) is copied untouched.
 */
export function buildLeadEmail(template: string, data: LeadEmailData): string {
  return template.replace(PLACEHOLDER, (_, namespace: 'inputs' | 'submission', path: string) => toText(resolve(data[namespace], path)))
}
