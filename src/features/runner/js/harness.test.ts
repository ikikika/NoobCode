import { describe, expect, it } from 'vitest'
import { runJsTests } from './harness'
import type { TestCase } from '../../../content/schema'

const tests = (cases: TestCase[]) => cases

describe('runJsTests', () => {
  it('passes when the function returns the expected value', () => {
    const code = `function add(a, b) { return a + b; }`
    const result = runJsTests(
      code,
      'add',
      tests([{ name: 'sum', args: [2, 3], expected: 5, hidden: false }]),
    )
    expect(result.passed).toBe(true)
    expect(result.cases[0].actual).toBe(5)
  })

  it('deep-compares array results', () => {
    const code = `function twoSum(nums, target) {
      const seen = new Map();
      for (let i = 0; i < nums.length; i++) {
        const c = target - nums[i];
        if (seen.has(c)) return [seen.get(c), i];
        seen.set(nums[i], i);
      }
      return [];
    }`
    const result = runJsTests(
      code,
      'twoSum',
      tests([{ name: 'ex', args: [[2, 7, 11, 15], 9], expected: [0, 1], hidden: false }]),
    )
    expect(result.passed).toBe(true)
  })

  it('marks a wrong answer as failed and records the actual value', () => {
    const code = `function add(a, b) { return a - b; }`
    const result = runJsTests(
      code,
      'add',
      tests([{ name: 'sum', args: [2, 3], expected: 5, hidden: false }]),
    )
    expect(result.passed).toBe(false)
    expect(result.cases[0].actual).toBe(-1)
  })

  it('captures console output per case', () => {
    const code = `function f(x) { console.log("hi", x); return x; }`
    const result = runJsTests(
      code,
      'f',
      tests([{ name: 'log', args: [1], expected: 1, hidden: false }]),
    )
    expect(result.cases[0].stdout).toContain('hi 1')
  })

  it('reports a thrown error on the case rather than crashing', () => {
    const code = `function f() { throw new Error("boom"); }`
    const result = runJsTests(
      code,
      'f',
      tests([{ name: 'err', args: [], expected: null, hidden: false }]),
    )
    expect(result.passed).toBe(false)
    expect(result.cases[0].error).toContain('boom')
  })

  it('returns a top-level error when the function is missing', () => {
    const result = runJsTests(
      'const x = 1;',
      'missing',
      tests([{ name: 'x', args: [], expected: null, hidden: false }]),
    )
    expect(result.cases).toHaveLength(0)
    expect(result.error).toContain('missing')
  })
})
