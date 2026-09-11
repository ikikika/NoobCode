import { describe, expect, it } from 'vitest'
import type { Solution } from '../../content/schema'
import { firstSolutionIndexForLanguage } from './SolutionPicker'

function solution(steps: Solution['steps']): Solution {
  return {
    approachName: 'Test',
    summary: '',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    steps,
  }
}

describe('firstSolutionIndexForLanguage', () => {
  it('returns the first solution that has steps for the language', () => {
    const solutions = [
      solution({ typescript: [{ explanation: '', code: 'a' }] }),
      solution({
        python: [{ explanation: '', code: 'b' }],
        typescript: [{ explanation: '', code: 'c' }],
      }),
    ]
    expect(firstSolutionIndexForLanguage(solutions, 'python')).toBe(1)
    expect(firstSolutionIndexForLanguage(solutions, 'typescript')).toBe(0)
  })

  it('returns -1 when no solution has steps for the language', () => {
    const solutions = [solution({ typescript: [{ explanation: '', code: 'a' }] })]
    expect(firstSolutionIndexForLanguage(solutions, 'javascript')).toBe(-1)
  })
})
