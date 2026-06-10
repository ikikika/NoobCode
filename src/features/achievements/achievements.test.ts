import { describe, it, expect } from 'vitest'
import {
  computeStreak,
  deriveAchievements,
  achievementCoins,
  hasPolyglot,
  hasFlawless,
  hasComeback,
  ACHIEVEMENTS,
  type AchievementInput,
} from './achievements'
import type { AttemptRecord, MethodReview } from '../analysis/types'
import type { ProblemMeta } from '../../content/schema'

const NOW = new Date('2026-06-10T12:00:00').getTime()
const DAY = 86_400_000

function attempt(over: Partial<AttemptRecord> = {}): AttemptRecord {
  return { slug: 'a', timestamp: NOW, passed: true, ...over }
}

const problems: ProblemMeta[] = [
  { slug: 'a', title: 'A', difficulty: 'easy', tags: [], patterns: ['hash-map'] },
  { slug: 'b', title: 'B', difficulty: 'medium', tags: [], patterns: ['two-pointers'] },
]

function review(isOptimal: boolean): MethodReview {
  return {
    approachUsed: 'hash-map',
    estimatedComplexity: { time: 'O(n)', space: 'O(n)' },
    isOptimal,
    inefficiencies: [],
    suggestions: [],
    source: 'heuristic',
  }
}

function input(over: Partial<AchievementInput> = {}): AchievementInput {
  return {
    solved: {},
    attempts: [],
    reviews: {},
    problems,
    earnedAt: {},
    now: NOW,
    ...over,
  }
}

describe('computeStreak', () => {
  it('returns zero for no attempts', () => {
    expect(computeStreak([], NOW)).toEqual({ current: 0, longest: 0 })
  })

  it('counts consecutive days, current ending today', () => {
    const attempts = [
      attempt({ timestamp: NOW - 2 * DAY }),
      attempt({ timestamp: NOW - DAY }),
      attempt({ timestamp: NOW }),
    ]
    expect(computeStreak(attempts, NOW)).toEqual({ current: 3, longest: 3 })
  })

  it('breaks the current streak after a gap but keeps the longest', () => {
    const attempts = [
      attempt({ timestamp: NOW - 9 * DAY }),
      attempt({ timestamp: NOW - 8 * DAY }),
      attempt({ timestamp: NOW - 7 * DAY }),
      attempt({ timestamp: NOW }),
    ]
    const s = computeStreak(attempts, NOW)
    expect(s.longest).toBe(3)
    expect(s.current).toBe(1)
  })
})

describe('helpers', () => {
  it('detects polyglot (all three languages passed on one slug)', () => {
    expect(
      hasPolyglot([
        attempt({ language: 'python' }),
        attempt({ language: 'javascript' }),
        attempt({ language: 'typescript' }),
      ]),
    ).toBe(true)
    expect(hasPolyglot([attempt({ language: 'python' })])).toBe(false)
  })

  it('detects a flawless first run', () => {
    expect(hasFlawless([attempt({ passed: true })])).toBe(true)
    expect(
      hasFlawless([
        attempt({ timestamp: NOW - DAY, passed: false }),
        attempt({ timestamp: NOW, passed: true }),
      ]),
    ).toBe(false)
  })

  it('detects a comeback after a 7-day gap', () => {
    expect(
      hasComeback([attempt({ timestamp: NOW - 8 * DAY }), attempt({ timestamp: NOW, passed: true })]),
    ).toBe(true)
    expect(hasComeback([attempt({ timestamp: NOW })])).toBe(false)
  })
})

describe('deriveAchievements', () => {
  it('locks everything with no progress', () => {
    const all = deriveAchievements(input())
    expect(all).toHaveLength(ACHIEVEMENTS.length)
    expect(all.find((a) => a.id === 'first')?.state).toBe('locked')
  })

  it('earns First Blood and shows progress toward High Five on first solve', () => {
    const all = deriveAchievements(
      input({ solved: { a: true }, attempts: [attempt({ slug: 'a', passed: true })] }),
    )
    expect(all.find((a) => a.id === 'first')?.state).toBe('earned')
    const five = all.find((a) => a.id === 'five')
    expect(five?.state).toBe('progress')
    expect(five).toMatchObject({ cur: 1, max: 5 })
    // Marathon is a target achievement, so it shows progress (1/30) once active.
    expect(all.find((a) => a.id === 'mara')).toMatchObject({ state: 'progress', cur: 1, max: 30 })
    // A boolean achievement with no qualifying event stays locked.
    expect(all.find((a) => a.id === 'speed')?.state).toBe('locked')
  })

  it('earns Optimal when a stored review is optimal, and stamps earnedAt', () => {
    const all = deriveAchievements(
      input({
        solved: { a: true },
        attempts: [attempt({ slug: 'a' })],
        reviews: { a: review(true) },
        earnedAt: { opt: 123 },
      }),
    )
    const opt = all.find((a) => a.id === 'opt')
    expect(opt?.state).toBe('earned')
    expect(opt?.earnedAt).toBe(123)
  })

  it('earns Pattern Cleared when all problems of an attempted pattern are solved', () => {
    const all = deriveAchievements(
      input({ solved: { a: true }, attempts: [attempt({ slug: 'a' })] }),
    )
    expect(all.find((a) => a.id === 'cleared')?.state).toBe('earned')
  })
})

describe('achievementCoins', () => {
  it('maps ids to their tier point payout', () => {
    expect(achievementCoins(['first', 'hash', 'cent'])).toEqual([
      { id: 'first', coins: 10 },
      { id: 'hash', coins: 25 },
      { id: 'cent', coins: 50 },
    ])
  })
})
