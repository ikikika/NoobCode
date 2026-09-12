import { describe, expect, it } from 'vitest'
import { builtinProblems, builtinMeta } from './index'
import { problemSchema } from './schema'

const LANGS = ['python', 'javascript', 'typescript'] as const

describe('built-in content', () => {
  it('discovers and validates built-in problems', () => {
    expect(builtinMeta.length).toBeGreaterThanOrEqual(1)
    for (const problem of Object.values(builtinProblems)) {
      expect(problemSchema.safeParse(problem).success).toBe(true)
    }
  })

  it('lists problems in ascending order', () => {
    for (let i = 1; i < builtinMeta.length; i++) {
      expect(builtinMeta[i]!.order).toBeGreaterThanOrEqual(builtinMeta[i - 1]!.order)
    }
  })

  it('provides starter code in every language and at least one walkthrough language', () => {
    for (const problem of Object.values(builtinProblems)) {
      for (const lang of LANGS) {
        expect(problem.functionName[lang], `${problem.slug} functionName.${lang}`).toBeTruthy()
        expect(problem.starterCode[lang], `${problem.slug} starterCode.${lang}`).toBeTruthy()
      }
      for (const sol of problem.solutions) {
        const langsWithSteps = LANGS.filter((lang) => (sol.steps[lang]?.length ?? 0) > 0)
        expect(
          langsWithSteps.length,
          `${problem.slug} solution "${sol.approachName}" needs steps in ≥1 language`,
        ).toBeGreaterThan(0)
        for (const lang of langsWithSteps) {
          for (const step of sol.steps[lang]!) {
            expect(step.code, `${problem.slug} step code.${lang}`).toBeTruthy()
          }
        }
      }
    }
  })
})
