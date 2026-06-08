import { readFileSync, readdirSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { problemSchema } from '../src/content/schema'

// CI gate: every built-in problem JSON must parse against the schema (which now
// requires code for every language), and its slug must match the filename.
function main() {
  const dir = resolve('src/content/problems')
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const errors: string[] = []

  if (files.length === 0) errors.push('No problem JSON files found in src/content/problems')

  for (const file of files) {
    const expectedSlug = basename(file, '.json')
    let data: unknown
    try {
      data = JSON.parse(readFileSync(resolve(dir, file), 'utf8'))
    } catch (err) {
      errors.push(`[${file}] invalid JSON: ${err instanceof Error ? err.message : String(err)}`)
      continue
    }

    const result = problemSchema.safeParse(data)
    if (!result.success) {
      errors.push(`[${file}] schema validation failed:\n${result.error.message}`)
      continue
    }
    if (result.data.slug !== expectedSlug) {
      errors.push(`[${file}] slug "${result.data.slug}" does not match filename "${expectedSlug}"`)
    }
  }

  if (errors.length > 0) {
    console.error('Content validation failed:\n')
    for (const e of errors) console.error('  • ' + e)
    process.exit(1)
  }

  console.log(`Content validation passed for ${files.length} problem(s).`)
}

main()
