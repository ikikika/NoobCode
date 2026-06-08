import type { AttemptRecord } from '../analysis/types'

export type MasteryLevel = 'unseen' | 'weak' | 'learning' | 'mastered'

export const MASTERY_ORDER: Record<MasteryLevel, number> = {
  unseen: 0,
  weak: 1,
  learning: 2,
  mastered: 3,
}

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  unseen: 'Unseen',
  weak: 'Weak',
  learning: 'Learning',
  mastered: 'Mastered',
}

const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000 // 7-day recency decay

export function deriveMastery(attempts: AttemptRecord[], now: number = Date.now()): MasteryLevel {
  if (attempts.length === 0) return 'unseen'

  let weightedPasses = 0
  let weightedTotal = 0
  let totalPasses = 0

  for (const attempt of attempts) {
    const weight = Math.pow(0.5, (now - attempt.timestamp) / HALF_LIFE_MS)
    weightedTotal += weight
    if (attempt.passed) {
      weightedPasses += weight
      totalPasses += 1
    }
  }

  const rate = weightedTotal === 0 ? 0 : weightedPasses / weightedTotal

  if (rate >= 0.8 && totalPasses >= 2) return 'mastered'
  if (rate >= 0.4) return 'learning'
  return 'weak'
}
