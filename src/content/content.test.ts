import { describe, expect, it } from 'vitest'
import { problemRegistry, problemsMeta, allSlugs } from './index'
import { problemSchema } from './schema'

describe('content', () => {
  it('loads and validates every problem in the registry', async () => {
    for (const slug of allSlugs) {
      const mod = await problemRegistry[slug]()
      const result = problemSchema.safeParse(mod.default)
      expect(result.success, `${slug} failed: ${result.success ? '' : result.error.message}`).toBe(
        true,
      )
      if (result.success) {
        expect(result.data.slug).toBe(slug)
      }
    }
  })

  it('keeps meta patterns in sync with the full problem', async () => {
    for (const meta of problemsMeta) {
      const mod = await problemRegistry[meta.slug]()
      const problem = problemSchema.parse(mod.default)
      expect([...meta.patterns].sort()).toEqual([...problem.patterns].sort())
    }
  })

  it('rejects a malformed problem missing a required field', () => {
    const malformed = {
      slug: 'broken',
      title: 'Broken',
      difficulty: 'easy',
      // missing tags, patterns, description, etc.
    }
    expect(problemSchema.safeParse(malformed).success).toBe(false)
  })
})
