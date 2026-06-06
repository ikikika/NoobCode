import { builtinProblems } from './index'
import type { Problem } from './schema'

// Resolve a built-in problem by slug. Async signature is kept so callers
// (ProblemDetailPage) are unchanged.
export async function loadProblem(slug: string): Promise<Problem> {
  const builtin = builtinProblems[slug]
  if (builtin) return builtin
  throw new Error(`Unknown problem slug: "${slug}"`)
}
