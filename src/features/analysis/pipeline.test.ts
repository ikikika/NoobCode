import { describe, it, expect } from 'vitest'
import { analyzeCode } from './engine'
import { buildReview } from './classify'
import { builtinProblems } from '../../content'

// End-to-end coverage of the deterministic review pipeline (analyze → classify →
// buildReview) against real built-in problems, exercising both the JS and TS
// analyzers on the same logic.

const twoSum = builtinProblems['two-sum']

const bruteForceJs = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`

const hashJs = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const c = target - nums[i];
    if (seen.has(c)) return [seen.get(c), i];
    seen.set(nums[i], i);
  }
  return [];
}`

describe('review pipeline on two-sum', () => {
  it('flags the brute-force solution as non-optimal with a nested-loop note', async () => {
    const features = await analyzeCode('javascript', bruteForceJs, 'twoSum')
    expect(features.maxLoopDepth).toBe(2)
    const review = buildReview(features, twoSum)
    expect(review.isOptimal).toBe(false)
    expect(review.estimatedComplexity.time).toBe('O(n²)')
    expect(review.inefficiencies.join(' ')).toMatch(/nested/i)
    expect(review.suggestions.length).toBeGreaterThan(0)
  })

  it('accepts the hash-map solution as optimal', async () => {
    const features = await analyzeCode('javascript', hashJs, 'twoSum')
    expect(features.usesHashStructure).toBe(true)
    const review = buildReview(features, twoSum)
    expect(review.isOptimal).toBe(true)
    expect(review.approachUsed).toBe('hash-map')
    expect(review.estimatedComplexity).toEqual({ time: 'O(n)', space: 'O(n)' })
  })

  it('analyzes TypeScript by stripping types first', async () => {
    const tsHash = `function twoSum(nums: number[], target: number): number[] {
      const seen = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const c = target - nums[i];
        if (seen.has(c)) return [seen.get(c)!, i];
        seen.set(nums[i], i);
      }
      return [];
    }`
    const features = await analyzeCode('typescript', tsHash, 'twoSum')
    expect(features.usesHashStructure).toBe(true)
    expect(features.maxLoopDepth).toBe(1)
  })
})
