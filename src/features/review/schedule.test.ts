import { describe, expect, it } from 'vitest'
import { isDue, nextSchedule, LEITNER_INTERVALS_DAYS } from './schedule'

const DAY = 86_400_000
const NOW = 1_000_000_000_000

describe('nextSchedule', () => {
  it('schedules a brand-new problem into box 1 on first pass', () => {
    const entry = nextSchedule(undefined, true, NOW)
    expect(entry.box).toBe(1)
    expect(entry.dueAt).toBe(NOW + LEITNER_INTERVALS_DAYS[1] * DAY)
    expect(entry.lastReviewed).toBe(NOW)
  })

  it('advances the box on a pass', () => {
    const prev = { box: 2, dueAt: NOW, lastReviewed: NOW }
    expect(nextSchedule(prev, true, NOW).box).toBe(3)
  })

  it('resets to box 0 on a fail', () => {
    const prev = { box: 4, dueAt: NOW, lastReviewed: NOW }
    const entry = nextSchedule(prev, false, NOW)
    expect(entry.box).toBe(0)
    expect(entry.dueAt).toBe(NOW)
  })

  it('caps the box at 5', () => {
    const prev = { box: 5, dueAt: NOW, lastReviewed: NOW }
    expect(nextSchedule(prev, true, NOW).box).toBe(5)
  })
})

describe('isDue', () => {
  it('is false for undefined, true for past, false for future', () => {
    expect(isDue(undefined, NOW)).toBe(false)
    expect(isDue({ box: 1, dueAt: NOW - DAY, lastReviewed: NOW }, NOW)).toBe(true)
    expect(isDue({ box: 1, dueAt: NOW + DAY, lastReviewed: NOW }, NOW)).toBe(false)
  })
})
