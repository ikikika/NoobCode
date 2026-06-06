import { describe, expect, it } from 'vitest'
import { builtinProblems, builtinMeta } from './index'
import { problemSchema } from './schema'

const LANGS = ['python', 'javascript', 'typescript'] as const

describe('built-in content', () => {
  it('discovers and validates at least the three built-in problems', () => {
    expect(builtinMeta.length).toBeGreaterThanOrEqual(3)
    for (const problem of Object.values(builtinProblems)) {
      expect(problemSchema.safeParse(problem).success).toBe(true)
    }
  })

  it('provides code in every language for every problem', () => {
    for (const problem of Object.values(builtinProblems)) {
      for (const lang of LANGS) {
        expect(problem.functionName[lang], `${problem.slug} functionName.${lang}`).toBeTruthy()
        expect(problem.starterCode[lang], `${problem.slug} starterCode.${lang}`).toBeTruthy()
        for (const sol of problem.solutions) {
          for (const step of sol.steps) {
            expect(step.code[lang], `${problem.slug} step code.${lang}`).toBeTruthy()
          }
        }
      }
    }
  })
})
