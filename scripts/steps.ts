/**
 * Pack / unpack / check solution-step sidecars.
 *
 *   npm run steps:unpack -- <slug> [--force]
 *   npm run steps:pack -- [<slug> ...]
 *   npm run steps:check -- [<slug> ...]
 *
 * With no slugs, pack/check operate on every problem that already has a
 * sidecar directory. See docs/PROBLEM_JSON.md § Solution step sidecars.
 */
import {
  listProblemSlugsWithSidecars,
  packSlug,
  sidecarsMatchJson,
  unpackSlug,
} from './lib/solutionSidecars'

function usage(): never {
  console.error(`Usage:
  npm run steps:unpack -- <slug> [--force]
  npm run steps:pack -- [<slug> ...]
  npm run steps:check -- [<slug> ...]`)
  process.exit(1)
}

const [, , command, ...rest] = process.argv
if (!command || !['pack', 'unpack', 'check'].includes(command)) usage()

const force = rest.includes('--force')
const slugs = rest.filter((a) => a !== '--force')

if (command === 'unpack') {
  if (slugs.length !== 1) usage()
  const slug = slugs[0]!
  const result = unpackSlug(slug, { force })
  console.log(`Unpacked ${result.solutionsWritten} solution(s) → ${result.root}`)
  process.exit(0)
}

const targets = slugs.length > 0 ? slugs : listProblemSlugsWithSidecars()
if (targets.length === 0) {
  console.error('No sidecar problems found. Unpack one first: npm run steps:unpack -- <slug>')
  process.exit(1)
}

if (command === 'pack') {
  for (const slug of targets) {
    const result = packSlug(slug)
    console.log(`Packed ${slug}: ${result.solutionsUpdated} solution(s) → ${result.path}`)
  }
  process.exit(0)
}

// check
let failed = 0
for (const slug of targets) {
  const { ok, detail } = sidecarsMatchJson(slug)
  if (ok) {
    console.log(`✓ ${slug}: ${detail}`)
  } else {
    failed++
    console.error(`✗ ${slug}: ${detail}`)
  }
}
if (failed > 0) {
  console.error(`\n${failed} problem(s) out of sync. Run: npm run steps:pack`)
  process.exit(1)
}
console.log(`\nAll ${targets.length} sidecar problem(s) in sync.`)
