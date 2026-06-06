import { afterEach, describe, expect, it } from 'vitest'
import { builtinProblems, builtinMeta } from './index'
import { problemSchema } from './schema'
import { loadProblem } from './loader'
import { useUserProblemsStore } from '../store/useUserProblemsStore'

const LANGS = ['python', 'javascript', 'typescript'] as const

afterEach(() => {
  useUserProblemsStore.setState({ problems: {} })
})

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

describe('importing user problems', () => {
  it('round-trips an exported problem JSON', async () => {
    const source = builtinProblems['two-sum']
    const exported = JSON.parse(JSON.stringify({ ...source, slug: 'two-sum-copy' }))
    const result = useUserProblemsStore.getState().addProblem(exported)
    expect(result).toEqual({ ok: true, slug: 'two-sum-copy' })
    await expect(loadProblem('two-sum-copy')).resolves.toMatchObject({ slug: 'two-sum-copy' })
  })

  it('rejects a malformed problem', () => {
    const result = useUserProblemsStore.getState().addProblem({ slug: 'broken', title: 'Broken' })
    expect(result.ok).toBe(false)
  })

  it('rejects a slug that collides with a built-in', () => {
    const clone = JSON.parse(JSON.stringify(builtinProblems['two-sum']))
    const result = useUserProblemsStore.getState().addProblem(clone)
    expect(result.ok).toBe(false)
  })
})
