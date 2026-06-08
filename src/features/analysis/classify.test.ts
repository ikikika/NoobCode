import { describe, expect, it } from 'vitest'
import { classify, estimateComplexity, buildReview } from './classify'
import type { CodeFeatures } from './types'
import type { Problem } from '../../content/schema'

function features(overrides: Partial<CodeFeatures> = {}): CodeFeatures {
  return {
    maxLoopDepth: 0,
    usesHashStructure: false,
    usesSorting: false,
    usesRecursion: false,
    twoPointerShape: false,
    earlyReturn: false,
    ...overrides,
  }
}

describe('classify', () => {
  it('prefers recursion, then two-pointers, then nested loops', () => {
    expect(classify(features({ usesRecursion: true, maxLoopDepth: 2 }))).toBe('recursion')
    expect(classify(features({ twoPointerShape: true, maxLoopDepth: 2 }))).toBe('two-pointers')
    expect(classify(features({ maxLoopDepth: 2 }))).toBe('brute-force')
  })

  it('classifies sorting, hashing, and single loops', () => {
    expect(classify(features({ usesSorting: true }))).toBe('sorting')
    expect(classify(features({ usesHashStructure: true }))).toBe('hash-map')
    expect(classify(features({ maxLoopDepth: 1 }))).toBe('brute-force')
    expect(classify(features())).toBe('unknown')
  })
})

describe('estimateComplexity', () => {
  it('maps loop depth and sorting to time complexity', () => {
    expect(estimateComplexity(features()).time).toBe('O(1)')
    expect(estimateComplexity(features({ maxLoopDepth: 1 })).time).toBe('O(n)')
    expect(estimateComplexity(features({ maxLoopDepth: 2 })).time).toBe('O(n²)')
    expect(estimateComplexity(features({ maxLoopDepth: 3 })).time).toBe('O(n³)')
    expect(estimateComplexity(features({ usesSorting: true })).time).toBe('O(n log n)')
  })

  it('maps hash usage to space complexity', () => {
    expect(estimateComplexity(features()).space).toBe('O(1)')
    expect(estimateComplexity(features({ usesHashStructure: true })).space).toBe('O(n)')
  })
})

// Minimal problem whose optimal solution is a single-pass hash approach.
const problem = {
  solutions: [
    {
      approachName: 'Hash Map',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      technique: {
        primaryPattern: 'hash-map',
        optimal: true,
        signature: {
          maxLoopDepth: 1,
          usesHashStructure: true,
          usesSorting: false,
          usesRecursion: false,
          twoPointer: false,
        },
      },
      steps: [{ explanation: 'x', code: { python: '', javascript: '' } }],
    },
  ],
} as unknown as Problem

describe('buildReview', () => {
  it('marks a matching solution optimal with no inefficiencies', () => {
    const review = buildReview(features({ maxLoopDepth: 1, usesHashStructure: true }), problem)
    expect(review.isOptimal).toBe(true)
    expect(review.inefficiencies).toHaveLength(0)
    expect(review.source).toBe('heuristic')
    expect(review.referenceApproach).toContain('Hash Map')
  })

  it('flags a nested-loop, hashless solution as needing work', () => {
    const review = buildReview(features({ maxLoopDepth: 2 }), problem)
    expect(review.isOptimal).toBe(false)
    expect(review.inefficiencies.length).toBeGreaterThan(0)
    expect(review.suggestions.length).toBeGreaterThan(0)
  })
})
