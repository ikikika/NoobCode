import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '../analysis/types'
import { METHOD_REFERENCE, buildCorpus, isMethodUsed } from './methodCatalog'

const dictGroup = METHOD_REFERENCE.python.find((g) => g.id === 'dict')!
const items = dictGroup.methods.find((m) => m.name === '.items()')!
const values = dictGroup.methods.find((m) => m.name === '.values()')!

describe('METHOD_REFERENCE', () => {
  it('covers all three languages with non-empty groups', () => {
    for (const lang of ['python', 'javascript', 'typescript'] as const) {
      expect(METHOD_REFERENCE[lang].length).toBeGreaterThan(0)
      for (const group of METHOD_REFERENCE[lang]) {
        expect(group.methods.length).toBeGreaterThan(0)
      }
    }
  })

  it('reuses the JavaScript groups for TypeScript', () => {
    expect(METHOD_REFERENCE.typescript).toBe(METHOD_REFERENCE.javascript)
  })
})

describe('buildCorpus', () => {
  const attempts: AttemptRecord[] = [
    { slug: 'a', timestamp: 1, passed: true, language: 'python', code: 'for k, v in d.items():\n    print(k)' },
    { slug: 'b', timestamp: 2, passed: false, language: 'javascript', code: 'arr.map(x => x)' },
    { slug: 'c', timestamp: 3, passed: true, language: 'python' }, // no code
  ]

  it('joins only the matching language submissions that have code', () => {
    const corpus = buildCorpus(attempts, 'python')
    expect(corpus).toContain('.items(')
    expect(corpus).not.toContain('arr.map')
  })

  it('returns empty string when nothing matches', () => {
    expect(buildCorpus(attempts, 'typescript')).toBe('')
  })
})

describe('isMethodUsed', () => {
  const corpus = 'result = list(d.items())'

  it('detects a used method by its token', () => {
    expect(isMethodUsed(corpus, items)).toBe(true)
  })

  it('reports unused methods as not used', () => {
    expect(isMethodUsed(corpus, values)).toBe(false)
  })
})
