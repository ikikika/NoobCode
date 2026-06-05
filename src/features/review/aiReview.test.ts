import { afterEach, describe, expect, it, vi } from 'vitest'
import { enhanceReview } from './aiReview'
import type { MethodReview } from '../analysis/types'

const baseReview: MethodReview = {
  approachUsed: 'hash-map',
  estimatedComplexity: { time: 'O(n)', space: 'O(n)' },
  isOptimal: true,
  inefficiencies: [],
  suggestions: ['Looks good'],
  source: 'heuristic',
}

const context = {
  problemTitle: 'Two Sum',
  language: 'python' as const,
  userCode: 'def two_sum(nums, target): ...',
  passed: true,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('enhanceReview', () => {
  it('returns the heuristic unchanged and never fetches without an API key', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await enhanceReview(baseReview, context, { apiKey: '', model: 'claude-haiku-4-5' })
    expect(result).toEqual(baseReview)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('adds prose and flips source to ai on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ content: [{ type: 'text', text: 'Great work!' }] }), {
        status: 200,
      }),
    )
    const result = await enhanceReview(baseReview, context, {
      apiKey: 'sk-ant-test',
      model: 'claude-haiku-4-5',
    })
    expect(result.prose).toBe('Great work!')
    expect(result.source).toBe('ai')
    expect(result.isOptimal).toBe(baseReview.isOptimal)
  })

  it('returns the heuristic unchanged on a non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 429 }))
    const result = await enhanceReview(baseReview, context, {
      apiKey: 'sk-ant-test',
      model: 'claude-haiku-4-5',
    })
    expect(result).toEqual(baseReview)
  })

  it('returns the heuristic unchanged on a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    const result = await enhanceReview(baseReview, context, {
      apiKey: 'sk-ant-test',
      model: 'claude-haiku-4-5',
    })
    expect(result).toEqual(baseReview)
  })

  it('returns the heuristic unchanged when the content array is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), { status: 200 }),
    )
    const result = await enhanceReview(baseReview, context, {
      apiKey: 'sk-ant-test',
      model: 'claude-haiku-4-5',
    })
    expect(result).toEqual(baseReview)
  })
})
