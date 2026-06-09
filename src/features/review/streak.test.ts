import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '../analysis/types'
import { computeStreak } from './streak'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-06-09T12:00:00').getTime()

function attempt(daysAgo: number): AttemptRecord {
  return { slug: 's', timestamp: NOW - daysAgo * DAY, passed: true }
}

describe('computeStreak', () => {
  it('returns 0 with no attempts', () => {
    expect(computeStreak([], NOW)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(computeStreak([attempt(0), attempt(1), attempt(2)], NOW)).toBe(3)
  })

  it('still counts when today is empty but yesterday is active', () => {
    expect(computeStreak([attempt(1), attempt(2)], NOW)).toBe(2)
  })

  it('stops at a gap', () => {
    expect(computeStreak([attempt(0), attempt(1), attempt(3)], NOW)).toBe(2)
  })

  it('counts a day only once', () => {
    expect(computeStreak([attempt(0), attempt(0), attempt(1)], NOW)).toBe(2)
  })

  it('returns 0 when the most recent activity is too old', () => {
    expect(computeStreak([attempt(3), attempt(4)], NOW)).toBe(0)
  })
})
