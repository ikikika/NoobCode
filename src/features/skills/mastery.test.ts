import { describe, expect, it } from 'vitest'
import { deriveMastery } from './mastery'
import type { AttemptRecord } from '../analysis/types'

const NOW = 1_000_000_000_000
const DAY = 86_400_000

function attempt(passed: boolean, ageDays = 0): AttemptRecord {
  return { slug: 'x', passed, timestamp: NOW - ageDays * DAY }
}

describe('deriveMastery', () => {
  it('returns unseen with no attempts', () => {
    expect(deriveMastery([], NOW)).toBe('unseen')
  })

  it('returns weak when every attempt failed', () => {
    expect(deriveMastery([attempt(false), attempt(false)], NOW)).toBe('weak')
  })

  it('returns weak when mostly failing', () => {
    expect(
      deriveMastery([attempt(true), attempt(false), attempt(false), attempt(false)], NOW),
    ).toBe('weak')
  })

  it('returns learning for a mixed (>=0.4) pass rate', () => {
    expect(deriveMastery([attempt(true), attempt(false)], NOW)).toBe('learning')
  })

  it('returns mastered for a high pass rate with >=2 passes', () => {
    expect(deriveMastery([attempt(true), attempt(true), attempt(true)], NOW)).toBe('mastered')
  })

  it('weights recent attempts more heavily (old passes, fresh fail -> weak)', () => {
    const attempts = [attempt(true, 60), attempt(true, 60), attempt(false, 0)]
    expect(deriveMastery(attempts, NOW)).toBe('weak')
  })
})
