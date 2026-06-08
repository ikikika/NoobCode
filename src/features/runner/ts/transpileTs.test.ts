import { describe, expect, it } from 'vitest'
import { transpileTs } from './transpileTs'
import { runJsTests } from '../js/harness'
import type { TestCase } from '../../../content/schema'

describe('transpileTs', () => {
  it('strips type annotations', () => {
    const out = transpileTs('function f(a: number, b: number): number { return a + b; }')
    expect(out).not.toContain(': number')
    expect(out).toContain('function f(a, b)')
  })

  it('produces JS that runs through the shared harness', () => {
    const ts = `function twoSum(nums: number[], target: number): number[] {
      const seen = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const c = target - nums[i];
        if (seen.has(c)) return [seen.get(c)!, i];
        seen.set(nums[i], i);
      }
      return [];
    }`
    const tests: TestCase[] = [
      { name: 'ex', args: [[2, 7, 11, 15], 9], expected: [0, 1], hidden: false },
    ]
    const result = runJsTests(transpileTs(ts), 'twoSum', tests)
    expect(result.passed).toBe(true)
  })
})
