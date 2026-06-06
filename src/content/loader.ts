import { builtinProblems } from './index'
import { useUserProblemsStore } from '../store/useUserProblemsStore'
import type { Problem } from './schema'

// Resolve a problem by slug from the built-in set first, then user-imported
// problems. Async signature is kept so callers (ProblemDetailPage) are unchanged.
export async function loadProblem(slug: string): Promise<Problem> {
  const builtin = builtinProblems[slug]
  if (builtin) return builtin

  const userProblem = useUserProblemsStore.getState().problems[slug]
  if (userProblem) return userProblem

  throw new Error(`Unknown problem slug: "${slug}"`)
}
