import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { problemSchema, type Problem } from '../content/schema'
import { builtinProblems } from '../content'

type AddResult = { ok: true; slug: string } | { ok: false; error: string }

interface UserProblemsState {
  problems: Record<string, Problem>
  addProblem: (json: unknown) => AddResult
  removeProblem: (slug: string) => void
}

export const useUserProblemsStore = create<UserProblemsState>()(
  persist(
    (set) => ({
      problems: {},
      addProblem: (json) => {
        const result = problemSchema.safeParse(json)
        if (!result.success) {
          return {
            ok: false,
            error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'),
          }
        }
        const problem = result.data
        if (builtinProblems[problem.slug]) {
          return {
            ok: false,
            error: `Slug "${problem.slug}" collides with a built-in problem. Rename it.`,
          }
        }
        set((s) => ({ problems: { ...s.problems, [problem.slug]: problem } }))
        return { ok: true, slug: problem.slug }
      },
      removeProblem: (slug) =>
        set((s) => {
          const next = { ...s.problems }
          delete next[slug]
          return { problems: next }
        }),
    }),
    { name: 'noobcode-user-problems', version: 1 },
  ),
)
