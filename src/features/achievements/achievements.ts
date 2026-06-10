import type { ProblemMeta } from '../../content/schema'
import type { PatternId } from '../../content/patterns'
import type { AttemptRecord, MethodReview } from '../analysis/types'
import { deriveMastery } from '../skills/mastery'

// Achievements are derived purely from progress data (mirrors deriveMastery).
// Tier "points" double as the coin payout when an achievement is first earned.

export type Tier = 'bronze' | 'silver' | 'gold'
export type AchievementSet = 'Streaks' | 'Mastery' | 'Volume' | 'Craft'
export type AchievementState = 'earned' | 'progress' | 'locked'

export const TIER: Record<Tier, { label: string; pts: number; fill: string; deep: string; ink: string }> = {
  bronze: { label: 'Bronze', pts: 10, fill: '#bd7a34', deep: '#9a601f', ink: '#8a5616' },
  silver: { label: 'Silver', pts: 25, fill: '#9a9282', deep: '#7c7464', ink: '#6f6757' },
  gold: { label: 'Gold', pts: 50, fill: '#c79a3d', deep: '#a87f2c', ink: '#8a6420' },
}

export interface AchievementDef {
  id: string
  name: string
  glyph: string
  tier: Tier
  set: AchievementSet
  desc: string
}

export interface DerivedAchievement extends AchievementDef {
  state: AchievementState
  /** For progress achievements: current value and target. */
  cur: number
  max: number
  earnedAt?: number
}

export interface AchievementInput {
  solved: Record<string, boolean>
  attempts: AttemptRecord[]
  reviews: Record<string, MethodReview>
  problems: ProblemMeta[]
  earnedAt: Record<string, number>
  now: number
}

const DAY = 86_400_000

// ── Pure helpers (exported for testing) ──────────────────────────────────────

/** Longest/current run of consecutive local-calendar days with ≥1 attempt. */
export function computeStreak(attempts: AttemptRecord[], now: number): { current: number; longest: number } {
  if (attempts.length === 0) return { current: 0, longest: 0 }
  const dayNum = (ts: number) => {
    const d = new Date(ts)
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY)
  }
  const days = [...new Set(attempts.map((a) => dayNum(a.timestamp)))].sort((a, b) => a - b)
  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1
    if (run > longest) longest = run
  }
  // Current streak counts back from today (or yesterday).
  const today = dayNum(now)
  const last = days[days.length - 1]
  let current = 0
  if (last === today || last === today - 1) {
    current = 1
    for (let i = days.length - 1; i > 0; i--) {
      if (days[i] === days[i - 1] + 1) current++
      else break
    }
  }
  return { current, longest }
}

function solvedCount(solved: Record<string, boolean>): number {
  return Object.values(solved).filter(Boolean).length
}

/** Distinct patterns the user has attempted at least one problem in. */
export function patternsAttempted(attempts: AttemptRecord[], slugToPatterns: Map<string, PatternId[]>): Set<PatternId> {
  const set = new Set<PatternId>()
  for (const a of attempts) for (const p of slugToPatterns.get(a.slug) ?? []) set.add(p)
  return set
}

/** True when some problem was passed in all three languages. */
export function hasPolyglot(attempts: AttemptRecord[]): boolean {
  const langs = new Map<string, Set<string>>()
  for (const a of attempts) {
    if (a.passed && a.language) {
      if (!langs.has(a.slug)) langs.set(a.slug, new Set())
      langs.get(a.slug)!.add(a.language)
    }
  }
  for (const set of langs.values()) if (set.size >= 3) return true
  return false
}

/** True when the earliest attempt for some problem passed (flawless first run). */
export function hasFlawless(attempts: AttemptRecord[]): boolean {
  const first = new Map<string, AttemptRecord>()
  for (const a of attempts) {
    const prev = first.get(a.slug)
    if (!prev || a.timestamp < prev.timestamp) first.set(a.slug, a)
  }
  for (const a of first.values()) if (a.passed) return true
  return false
}

function hasMidnightSolve(attempts: AttemptRecord[]): boolean {
  return attempts.some((a) => a.passed && new Date(a.timestamp).getHours() < 6)
}

/** A passing attempt that follows a ≥7-day gap from the previous attempt. */
export function hasComeback(attempts: AttemptRecord[]): boolean {
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].passed && sorted[i].timestamp - sorted[i - 1].timestamp >= 7 * DAY) return true
  }
  return false
}

function fastestSolveMs(attempts: AttemptRecord[]): number {
  let best = Infinity
  for (const a of attempts) {
    if (a.passed && typeof a.solveMs === 'number' && a.solveMs < best) best = a.solveMs
  }
  return best
}

function patternMastered(
  pattern: PatternId,
  attempts: AttemptRecord[],
  slugToPatterns: Map<string, PatternId[]>,
  now: number,
): boolean {
  const rel = attempts.filter((a) => slugToPatterns.get(a.slug)?.includes(pattern))
  return deriveMastery(rel, now) === 'mastered'
}

/** True when every problem tagged with some pattern is solved. */
function anyPatternCleared(
  solved: Record<string, boolean>,
  problems: ProblemMeta[],
  patterns: Set<PatternId>,
): boolean {
  for (const p of patterns) {
    const rel = problems.filter((pr) => pr.patterns.includes(p))
    if (rel.length > 0 && rel.every((pr) => solved[pr.slug])) return true
  }
  return false
}

// ── Definitions ──────────────────────────────────────────────────────────────
// `evaluate` returns earned (boolean) or { cur, max } progress toward a target.
type Eval = boolean | { cur: number; max: number }

interface InternalDef extends AchievementDef {
  evaluate: (ctx: Ctx) => Eval
}

interface Ctx {
  solvedTotal: number
  problemTotal: number
  attempts: AttemptRecord[]
  reviews: Record<string, MethodReview>
  streak: { current: number; longest: number }
  attemptedPatterns: Set<PatternId>
  allPatterns: Set<PatternId>
  solved: Record<string, boolean>
  problems: ProblemMeta[]
  slugToPatterns: Map<string, PatternId[]>
  now: number
}

const target = (cur: number, max: number): Eval => (cur >= max ? true : { cur: Math.min(cur, max), max })

const DEFS: InternalDef[] = [
  { id: 'first', name: 'First Blood', glyph: '1ST', tier: 'bronze', set: 'Craft', desc: 'Solve your first problem.',
    evaluate: (c) => c.solvedTotal >= 1 },
  { id: 'warm', name: 'Getting Warm', glyph: '3D', tier: 'bronze', set: 'Streaks', desc: 'Reach a 3-day streak.',
    evaluate: (c) => target(c.streak.longest, 3) },
  { id: 'five', name: 'High Five', glyph: '5', tier: 'bronze', set: 'Volume', desc: 'Solve 5 problems.',
    evaluate: (c) => target(c.solvedTotal, 5) },
  { id: 'owl', name: 'Night Owl', glyph: 'AM', tier: 'bronze', set: 'Craft', desc: 'Solve a problem after midnight.',
    evaluate: (c) => hasMidnightSolve(c.attempts) },
  { id: 'flaw', name: 'Flawless', glyph: '★', tier: 'bronze', set: 'Craft', desc: 'Pass every test on the first run.',
    evaluate: (c) => hasFlawless(c.attempts) },
  { id: 'cleared', name: 'Pattern Cleared', glyph: '✓', tier: 'bronze', set: 'Volume', desc: 'Solve every problem in a pattern.',
    evaluate: (c) => anyPatternCleared(c.solved, c.problems, c.attemptedPatterns) },
  { id: 'hash', name: 'Hash Master', glyph: '#', tier: 'silver', set: 'Mastery', desc: 'Master the Hash Map pattern.',
    evaluate: (c) => patternMastered('hash-map', c.attempts, c.slugToPatterns, c.now) },
  { id: 'poly', name: 'Polyglot', glyph: '×3', tier: 'silver', set: 'Craft', desc: 'Solve one problem in all three languages.',
    evaluate: (c) => hasPolyglot(c.attempts) },
  { id: 'opt', name: 'Optimal', glyph: 'O*', tier: 'silver', set: 'Mastery', desc: 'Match the optimal time complexity.',
    evaluate: (c) => Object.values(c.reviews).some((r) => r.isOptimal) },
  { id: 'week', name: 'Week Strong', glyph: '7D', tier: 'silver', set: 'Streaks', desc: 'Hold a 7-day streak.',
    evaluate: (c) => target(c.streak.longest, 7) },
  { id: 'ten', name: 'Ten Down', glyph: '10', tier: 'silver', set: 'Volume', desc: 'Solve 10 problems.',
    evaluate: (c) => target(c.solvedTotal, 10) },
  { id: 'pioneer', name: 'Pattern Pioneer', glyph: '8P', tier: 'silver', set: 'Mastery', desc: 'Attempt problems across 8 patterns.',
    evaluate: (c) => target(c.attemptedPatterns.size, 8) },
  { id: 'cent', name: 'Centurion', glyph: '100', tier: 'gold', set: 'Volume', desc: 'Reach 100 total code runs.',
    evaluate: (c) => target(c.attempts.length, 100) },
  { id: 'tpp', name: 'Two-Pointer Pro', glyph: '⇄', tier: 'gold', set: 'Mastery', desc: 'Master the Two Pointers pattern.',
    evaluate: (c) => patternMastered('two-pointers', c.attempts, c.slugToPatterns, c.now) },
  { id: 'speed', name: 'Speed Demon', glyph: '»', tier: 'gold', set: 'Craft', desc: 'Solve a problem in under five minutes.',
    evaluate: (c) => fastestSolveMs(c.attempts) < 5 * 60 * 1000 },
  { id: 'back', name: 'Comeback', glyph: '↺', tier: 'gold', set: 'Streaks', desc: 'Return and solve after a 7-day gap.',
    evaluate: (c) => hasComeback(c.attempts) },
  { id: 'mara', name: 'Marathon', glyph: '30', tier: 'gold', set: 'Streaks', desc: 'Hold a 30-day streak.',
    evaluate: (c) => target(c.streak.longest, 30) },
  { id: 'comp', name: 'Completionist', glyph: '∞', tier: 'gold', set: 'Volume', desc: 'Solve every problem in the library.',
    evaluate: (c) => (c.problemTotal > 0 ? target(c.solvedTotal, c.problemTotal) : false) },
]

export const ACHIEVEMENTS: AchievementDef[] = DEFS.map((d) => ({
  id: d.id,
  name: d.name,
  glyph: d.glyph,
  tier: d.tier,
  set: d.set,
  desc: d.desc,
}))

export function deriveAchievements(input: AchievementInput): DerivedAchievement[] {
  const slugToPatterns = new Map<string, PatternId[]>(input.problems.map((p) => [p.slug, p.patterns]))
  const allPatterns = new Set<PatternId>(input.problems.flatMap((p) => p.patterns))
  const ctx: Ctx = {
    solvedTotal: solvedCount(input.solved),
    problemTotal: input.problems.length,
    attempts: input.attempts,
    reviews: input.reviews,
    streak: computeStreak(input.attempts, input.now),
    attemptedPatterns: patternsAttempted(input.attempts, slugToPatterns),
    allPatterns,
    solved: input.solved,
    problems: input.problems,
    slugToPatterns,
    now: input.now,
  }

  return DEFS.map((def) => {
    const result = def.evaluate(ctx)
    const earned = result === true
    const progress = result !== true && result !== false ? result : null
    const state: AchievementState = earned ? 'earned' : progress ? 'progress' : 'locked'
    return {
      id: def.id,
      name: def.name,
      glyph: def.glyph,
      tier: def.tier,
      set: def.set,
      desc: def.desc,
      state,
      cur: progress ? progress.cur : earned ? 1 : 0,
      max: progress ? progress.max : 1,
      earnedAt: earned ? input.earnedAt[def.id] : undefined,
    }
  })
}

/** Coin payout for a set of earned achievement ids (for syncAchievements). */
export function achievementCoins(ids: string[]): { id: string; coins: number }[] {
  const byId = new Map(DEFS.map((d) => [d.id, d]))
  return ids.map((id) => ({ id, coins: byId.get(id) ? TIER[byId.get(id)!.tier].pts : 0 }))
}
