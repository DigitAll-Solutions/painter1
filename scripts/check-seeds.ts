/**
 * Proves a re-run of every seed and migration script on the current dataset changes nothing: each script
 * and mode runs with --dry-run (reads only) and must end with `SAFE-WRITE <name>: changes=0`.
 * "kept" counts content a script would have overwritten before scripts/lib/safe-write.ts: it's listed,
 * not written. Exits 1 if any run would change something or fails.
 *
 *   node --env-file=.env.local scripts/check-seeds.ts
 *
 * Run it after adding or changing a script in scripts/, and before any bulk change (after
 * scripts/backup-sanity.ts).
 */
import { spawnSync } from 'node:child_process'

/** Every script that writes to Sanity, with each of its modes */
export const RUNS: string[][] = [
  ['seed-services.ts'],
  ['seed-about.ts'],
  ['seed-leads.ts'],
  ['seed-our-work.ts'],
  ['seed-privacy.ts'],
  ['seed-oct8.ts'],
  ['seed-oct8.ts', '--remove-legacy'],
  ['seed-oct9.ts'],
  ['seed-oct9.ts', '--cabinet-slug'],
  ['seed-oct9.ts', '--remove-shared-photos'],
  ['seed-oct9.ts', '--remove-subservices'],
  ['seed-oct14.ts'],
  ['seed-oct14.ts', '--labor-only'],
  ['seed-oct14.ts', '--cabinet-wording'],
  ['seed-oct14.ts', '--surface-copy'],
  ['seed-oct14.ts', '--surface-photos'],
  ['seed-surface-defaults.ts'],
  ['seed-surface-defaults.ts', '--remove-duplicates'],
  ['seed-surface-defaults.ts', '--cabinet-copy'],
  ['neutral-service-text.ts'],
  ['fix-network-claims.ts'],
  ['clear-owner-card-variant.ts'],
  ['migrate-studio.ts'],
]

let failed = 0
for (const [script, ...mode] of RUNS) {
  const label = [script, ...mode].join(' ')
  const run = spawnSync(process.execPath, [...process.execArgv, `scripts/${script}`, ...mode, '--dry-run'], { encoding: 'utf-8', env: process.env })
  const summary = run.stdout.match(/^SAFE-WRITE .*: changes=(\d+) kept=(\d+).*$/m)
  if (run.status !== 0 || !summary) {
    failed++
    const why = (run.stderr || run.stdout).split('\n').filter((l) => l.trim() && !/MODULE_TYPELESS|Reparsing|trace-warnings|eliminate this warning/.test(l)).slice(-3).join(' | ')
    console.log(`✗ ${label.padEnd(48)} failed: ${why}`)
    continue
  }
  const [line, changes, kept] = summary
  if (Number(changes)) failed++
  console.log(`${Number(changes) ? '✗' : '✓'} ${label.padEnd(48)} changes=${changes} kept=${kept}${line.includes('(retired)') ? ' (retired)' : ''}`)
}
console.log(failed ? `\n${failed} run(s) would change data or failed.` : `\nAll ${RUNS.length} runs: 0 changes on the current dataset.`)
process.exit(failed ? 1 : 0)
