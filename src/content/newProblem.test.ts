import { describe, expect, it } from 'vitest'
import { problemSchema } from './schema'
import {
  buildProblemSkeleton,
  deriveFunctionNames,
  isValidSlug,
  problemFilePath,
  serializeProblem,
  titleFromSlug,
} from './newProblem'

describe('isValidSlug', () => {
  it('accepts lowercase, digits, and hyphens', () => {
    expect(isValidSlug('two-sum')).toBe(true)
    expect(isValidSlug('add-2-numbers')).toBe(true)
  })

  it('rejects uppercase, spaces, and empty', () => {
    expect(isValidSlug('Two-Sum')).toBe(false)
    expect(isValidSlug('two sum')).toBe(false)
    expect(isValidSlug('two_sum')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })
})

describe('deriveFunctionNames', () => {
  it('uses snake_case for python and camelCase for js/ts', () => {
    expect(deriveFunctionNames('two-sum')).toEqual({
      python: 'two_sum',
      javascript: 'twoSum',
      typescript: 'twoSum',
    })
  })

  it('handles single-word slugs', () => {
    expect(deriveFunctionNames('reverse')).toEqual({
      python: 'reverse',
      javascript: 'reverse',
      typescript: 'reverse',
    })
  })
})

describe('titleFromSlug', () => {
  it('capitalizes hyphen-separated words', () => {
    expect(titleFromSlug('valid-parentheses')).toBe('Valid Parentheses')
  })
})

describe('problemFilePath', () => {
  it('points into the problems directory', () => {
    expect(problemFilePath('two-sum')).toBe('src/content/problems/two-sum.json')
  })
})

describe('buildProblemSkeleton', () => {
  it('produces a problem that passes the schema', () => {
    const skeleton = buildProblemSkeleton({ slug: 'my-problem' })
    expect(problemSchema.safeParse(skeleton).success).toBe(true)
  })

  it('derives the title from the slug when omitted', () => {
    expect(buildProblemSkeleton({ slug: 'two-sum' }).title).toBe('Two Sum')
  })

  it('honors an explicit title and difficulty', () => {
    const skeleton = buildProblemSkeleton({ slug: 'x', title: 'Custom', difficulty: 'hard' })
    expect(skeleton.title).toBe('Custom')
    expect(skeleton.difficulty).toBe('hard')
  })

  it('serializes to pretty JSON with a trailing newline', () => {
    const json = serializeProblem(buildProblemSkeleton({ slug: 'x' }))
    expect(json.endsWith('}\n')).toBe(true)
    expect(JSON.parse(json).slug).toBe('x')
  })
})
