import type { AttemptRecord } from '../analysis/types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Local-time day number (days since epoch), so day boundaries match the user. */
function dayNumber(ts: number): number {
  const offsetMs = new Date(ts).getTimezoneOffset() * 60 * 1000
  return Math.floor((ts - offsetMs) / DAY_MS)
}

/**
 * Consecutive-day activity streak from attempt timestamps. Counts back from today
 * (or yesterday, if there's no activity yet today) while each prior day has at
 * least one attempt.
 */
export function computeStreak(attempts: AttemptRecord[], now: number = Date.now()): number {
  if (attempts.length === 0) return 0

  const days = new Set<number>()
  for (const a of attempts) days.add(dayNumber(a.timestamp))

  let cursor = dayNumber(now)
  if (!days.has(cursor)) {
    cursor -= 1 // today has no activity yet — a streak can still end yesterday
    if (!days.has(cursor)) return 0
  }

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor -= 1
  }
  return streak
}
