/**
 * Write guard for every seed and migration script: a re-run never overwrites or removes content that
 * is already in Sanity (edited in Studio or written by a later step).
 *
 *   fill      the field is empty                                         → written
 *   same      the field already holds this value                         → skipped
 *   migrate   the script names the exact old value it replaces (expect),
 *             and the field still holds it                                → written
 *   kept      anything else: content that differs, or adding to / removing
 *             from a list that already has content                       → NOT written
 *
 * --force writes the "kept" ones too, after printing each one and asking for confirmation (type
 * OVERWRITE). Every run ends with one line, `SAFE-WRITE <name>: changes=N kept=M`, which
 * scripts/check-seeds.ts reads to prove a re-run on current data changes nothing.
 * Tested in safe-write.test.ts.
 */
import { createInterface } from 'node:readline/promises'

export const FORCE = process.argv.includes('--force')

/** The exact old value, or a test for it */
export type Expect = { value: unknown } | { test: (current: unknown) => boolean; label: string }
type Kind = 'fill' | 'same' | 'migrate' | 'kept'
export type Planned = { id: string; path: string; kind: Kind; current: unknown; next: unknown; remove?: boolean }

const SEGMENT = /([^.[\]]+)|\[_key=="([^"]+)"\]|\[(\d+)\]/g

/** Value at a Sanity patch path: `a.b`, `list[_key=="x"].c`, `list[2]` */
export function getPath(doc: unknown, path: string): unknown {
  let value = doc
  for (const [, field, key, index] of path.matchAll(SEGMENT)) {
    if (value == null) return undefined
    if (field !== undefined) value = (value as Record<string, unknown>)[field]
    else if (key !== undefined) value = Array.isArray(value) ? value.find((item) => item?._key === key) : undefined
    else value = Array.isArray(value) ? value[Number(index)] : undefined
  }
  return value
}

/** Nothing an editor would miss: missing, blank text, an empty list, rich text with no words, an image without a file */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return !value.trim()
  if (Array.isArray(value)) return value.every(isEmpty)
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (v._type === 'block') return ((v.children as { text?: string }[] | undefined) ?? []).every((c) => !c.text?.trim())
    if (v._type === 'image' || 'asset' in v) return !(v.asset as { _ref?: string } | undefined)?._ref
    return Object.entries(v).every(([k, x]) => k.startsWith('_') || isEmpty(x))
  }
  return false
}

const sorted = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((k) => [k, sorted((value as Record<string, unknown>)[k])])) : value
export const same = (a: unknown, b: unknown) => JSON.stringify(sorted(a ?? null)) === JSON.stringify(sorted(b ?? null))

const matches = (expect: Expect | undefined, current: unknown) => (!expect ? false : 'value' in expect ? same(expect.value, current) : expect.test(current))

const show = (value: unknown) => {
  if (value === undefined) return '(empty)'
  const text = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value)
  return text.length > 160 ? `${text.slice(0, 157)}…` : text
}

export class SafeWrite {
  readonly planned: Planned[] = []
  readonly name: string
  // No parameter properties: node runs these scripts with type stripping only
  constructor(name: string) {
    this.name = name
  }

  /**
   * Splits a patch into what may be written. Returns the set/unset to send: fills, migrations and,
   * with --force, the kept ones; never a field that's already the same.
   */
  plan(id: string, doc: unknown, ops: { set?: Record<string, unknown>; unset?: string[]; expect?: Record<string, Expect> }) {
    const set: Record<string, unknown> = {}
    const unset: string[] = []
    for (const [path, next] of Object.entries(ops.set ?? {})) {
      const current = getPath(doc, path)
      const kind: Kind = same(current, next) ? 'same' : isEmpty(current) ? 'fill' : matches(ops.expect?.[path], current) ? 'migrate' : 'kept'
      this.planned.push({ id, path, kind, current, next })
      if (kind === 'fill' || kind === 'migrate' || (kind === 'kept' && FORCE)) set[path] = next
    }
    for (const path of ops.unset ?? []) {
      const current = getPath(doc, path)
      // Nothing there (GROQ returns null for a missing field): nothing to remove
      if (isEmpty(current)) continue
      const kind: Kind = matches(ops.expect?.[path], current) ? 'migrate' : 'kept'
      this.planned.push({ id, path, kind, current, next: undefined, remove: true })
      if (kind !== 'kept' || FORCE) unset.push(path)
    }
    return { set, unset, any: Object.keys(set).length > 0 || unset.length > 0 }
  }

  /** A new document: written only when no document has this id */
  create(id: string, exists: boolean) {
    this.planned.push({ id, path: '(document)', kind: exists ? 'same' : 'fill', current: exists ? '(exists)' : undefined, next: '(new document)' })
    return !exists
  }

  get changes() {
    return this.planned.filter((p) => p.kind === 'fill' || p.kind === 'migrate' || (p.kind === 'kept' && FORCE))
  }
  get kept() {
    return this.planned.filter((p) => p.kind === 'kept')
  }

  /** Prints what's kept (or forced), then the summary line */
  report() {
    if (this.kept.length) {
      console.log(`\n${FORCE ? 'TO OVERWRITE (--force; asks before writing)' : 'KEPT (already has content; pass --force to overwrite)'}: ${this.kept.length}`)
      for (const p of this.kept) console.log(`  ${p.id} ${p.path}\n    now:  ${show(p.current)}\n    ${p.remove ? 'would be removed' : `seed: ${show(p.next)}`}`)
    }
    console.log(`\nSAFE-WRITE ${this.name}: changes=${this.changes.length} kept=${FORCE ? 0 : this.kept.length}${FORCE && this.kept.length ? ` forced=${this.kept.length}` : ''}`)
  }

  /** Before committing with --force: every overwrite was printed above; the person types OVERWRITE */
  async confirm(dryRun: boolean) {
    if (!FORCE || !this.kept.length || dryRun) return true
    if (!process.stdin.isTTY) throw new Error('--force asks for confirmation: run it in a terminal')
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(`\nOverwrite or remove the ${this.kept.length} field(s) above? Type OVERWRITE to continue: `)
    rl.close()
    if (answer.trim() !== 'OVERWRITE') throw new Error('Not confirmed: nothing written')
    return true
  }
}

/** A retired step: says why and writes nothing (the summary line still reports 0 changes) */
export function retired(name: string, why: string) {
  console.log(`RETIRED: ${why}\nNothing written.`)
  console.log(`\nSAFE-WRITE ${name}: changes=0 kept=0 (retired)`)
}
