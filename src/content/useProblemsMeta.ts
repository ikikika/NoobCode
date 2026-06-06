import { useMemo } from 'react'
import { builtinMeta } from './index'
import { useUserProblemsStore } from '../store/useUserProblemsStore'
import type { ProblemMeta } from './schema'

export interface ProblemListItem extends ProblemMeta {
  imported: boolean
}

// Built-in problems plus any the user has imported, for the list and skills
// pages. Imported problems are flagged so the UI can badge / allow removing them.
export function useProblemsMeta(): ProblemListItem[] {
  const userProblems = useUserProblemsStore((s) => s.problems)

  return useMemo(() => {
    const builtin: ProblemListItem[] = builtinMeta.map((m) => ({ ...m, imported: false }))
    const imported: ProblemListItem[] = Object.values(userProblems)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        patterns: p.patterns,
        imported: true,
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
    return [...builtin, ...imported]
  }, [userProblems])
}
