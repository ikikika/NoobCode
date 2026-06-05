import { problemRegistry } from './index'
import { problemSchema, type Problem } from './schema'

const cache = new Map<string, Problem>()

export async function loadProblem(slug: string): Promise<Problem> {
  const cached = cache.get(slug)
  if (cached) return cached

  const importer = problemRegistry[slug]
  if (!importer) {
    throw new Error(`Unknown problem slug: "${slug}"`)
  }

  const mod = await importer()
  const result = problemSchema.safeParse(mod.default)
  if (!result.success) {
    throw new Error(
      `Problem "${slug}" failed schema validation:\n${result.error.message}`,
    )
  }

  cache.set(slug, result.data)
  return result.data
}
