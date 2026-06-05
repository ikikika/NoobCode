import { problemRegistry, problemsMeta, allSlugs } from '../src/content/index'
import { problemSchema } from '../src/content/schema'
import { deepEqual } from '../src/lib/deepEqual'

async function main() {
  const errors: string[] = []
  const metaBySlug = new Map(problemsMeta.map((m) => [m.slug, m]))

  for (const slug of allSlugs) {
    try {
      const mod = await problemRegistry[slug]()
      const result = problemSchema.safeParse(mod.default)
      if (!result.success) {
        errors.push(`[${slug}] schema validation failed:\n${result.error.message}`)
        continue
      }

      const problem = result.data
      if (problem.slug !== slug) {
        errors.push(`[${slug}] problem.slug "${problem.slug}" does not match folder/registry key`)
      }

      const meta = metaBySlug.get(slug)
      if (!meta) {
        errors.push(`[${slug}] missing entry in problemsMeta`)
      } else {
        const metaPatterns = [...meta.patterns].sort()
        const problemPatterns = [...problem.patterns].sort()
        if (!deepEqual(metaPatterns, problemPatterns)) {
          errors.push(
            `[${slug}] meta.patterns ${JSON.stringify(metaPatterns)} != problem.patterns ${JSON.stringify(problemPatterns)}`,
          )
        }
      }
    } catch (err) {
      errors.push(`[${slug}] threw while loading: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (errors.length > 0) {
    console.error('Content validation failed:\n')
    for (const e of errors) console.error('  • ' + e)
    process.exit(1)
  }

  console.log(`Content validation passed for ${allSlugs.length} problem(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
