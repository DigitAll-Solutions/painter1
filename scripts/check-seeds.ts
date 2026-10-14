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

/** Every script that writes to Sanity (onboarding and recovery), with each of its modes */
export const RUNS: string[][] = [
  ['seed-services.ts'],
  ['seed-leads.ts'],
  ['seed-privacy.ts'],
  // One-off (post-merge, Oct 14 cleanup): reports its pending removals until it has run
  ['unset-legacy-fields.ts'],
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
  console.log(`${Number(changes) ? '✗' : '✓'} ${label.padEnd(48)} changes=${changes} kept=${kept}`)
}
console.log(failed ? `\n${failed} run(s) would change data or failed.` : `\nAll ${RUNS.length} runs: 0 changes on the current dataset.`)
process.exit(failed ? 1 : 0)
