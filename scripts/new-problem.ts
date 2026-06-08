/* Scaffold a new built-in problem as a JSON file.
 *
 *   npm run new:problem -- <slug> ["Title"]
 *
 * Writes src/content/problems/<slug>.json. No registration step is needed —
 * src/content/index.ts auto-discovers every *.json via import.meta.glob.
 *
 * The skeleton itself is built by the shared, isomorphic helpers in
 * src/content/newProblem.ts (also used by the in-app "New problem" form and the
 * Vite dev-server plugin), so all three paths emit identical files.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildProblemSkeleton,
  isValidSlug,
  serializeProblem,
} from '../src/content/newProblem'

const slug = process.argv[2]
if (!slug || !isValidSlug(slug)) {
  console.error('Usage: npm run new:problem -- <slug> ["Title"]')
  console.error('  <slug> must be lowercase, digits, and hyphens only.')
  process.exit(1)
}

const title = process.argv[3]

const file = resolve('src/content/problems', `${slug}.json`)
if (existsSync(file)) {
  console.error(`Refusing to overwrite existing problem: ${file}`)
  process.exit(1)
}

writeFileSync(file, serializeProblem(buildProblemSkeleton({ slug, title })))

console.log(`Created ${file}`)
console.log('It is auto-registered via import.meta.glob. Fill in the TODOs, then run:')
console.log('  npm run validate:content')
