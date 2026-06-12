export const LEITNER_INTERVALS_DAYS = [0, 1, 3, 7, 16, 35] as const
// box 0 = due immediately (failed/new), box 5 = due in 35 days

const DAY_MS = 86_400_000

export interface ScheduleEntry {
  box: number // 0–5
  dueAt: number // timestamp ms
  lastReviewed: number
}

export function nextSchedule(
  prev: ScheduleEntry | undefined,
  passed: boolean,
  now: number,
): ScheduleEntry {
  let box: number
  if (passed) {
    box = Math.min((prev?.box ?? 0) + 1, 5)
  } else {
    box = 0
  }
  const dueAt = now + LEITNER_INTERVALS_DAYS[box] * DAY_MS
  return { box, dueAt, lastReviewed: now }
}

export function isDue(entry: ScheduleEntry | undefined, now: number): boolean {
  if (!entry) return false
  return entry.dueAt <= now
}
