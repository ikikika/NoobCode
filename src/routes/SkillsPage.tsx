import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PATTERNS, PATTERN_LABELS, type PatternId } from '../content/patterns'
import { problemsMeta } from '../content'
import { useProgressStore } from '../store/useProgressStore'
import { dueLabel, isDue } from '../features/review/schedule'
import {
  deriveMastery,
  MASTERY_LABELS,
  MASTERY_ORDER,
  type MasteryLevel,
} from '../features/skills/mastery'
import type { AttemptRecord } from '../features/analysis/types'

const MASTERY_STYLES: Record<MasteryLevel, string> = {
  unseen: 'bg-surface-sunken text-fg-subtle',
  weak: 'bg-fail-surface text-fail',
  learning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  mastered: 'bg-pass-surface text-pass',
}

interface PatternStat {
  pattern: PatternId
  mastery: MasteryLevel
  solved: number
  total: number
  attempted: boolean
  related: { slug: string; title: string }[]
}

function PatternCard({ stat }: { stat: PatternStat }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-fg">{PATTERN_LABELS[stat.pattern]}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MASTERY_STYLES[stat.mastery]}`}>
          {MASTERY_LABELS[stat.mastery]}
        </span>
      </div>
      <div className="text-xs text-fg-subtle">
        {stat.solved}/{stat.total} solved
      </div>
      <div className="flex flex-wrap gap-1.5">
        {stat.related.map((p) => (
          <Link
            key={p.slug}
            to={`/problems/${p.slug}`}
            className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-fg-muted hover:text-accent"
          >
            {p.title}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SkillsPage() {
  const solved = useProgressStore((s) => s.solved)
  const attempts = useProgressStore((s) => s.attempts)
  const schedule = useProgressStore((s) => s.schedule)
  const now = Date.now()

  const slugPatterns = useMemo(() => {
    const map = new Map<string, PatternId[]>()
    for (const p of problemsMeta) map.set(p.slug, p.patterns)
    return map
  }, [])

  const stats = useMemo<PatternStat[]>(() => {
    return PATTERNS.map((pattern) => {
      const related = problemsMeta.filter((p) => p.patterns.includes(pattern))
      const patternAttempts: AttemptRecord[] = attempts.filter((a) =>
        slugPatterns.get(a.slug)?.includes(pattern),
      )
      return {
        pattern,
        mastery: deriveMastery(patternAttempts, now),
        solved: related.filter((p) => solved[p.slug]).length,
        total: related.length,
        attempted: patternAttempts.length > 0,
        related: related.map((p) => ({ slug: p.slug, title: p.title })),
      }
    })
  }, [attempts, solved, slugPatterns, now])

  const solvedCount = Object.values(solved).filter(Boolean).length
  const totalRuns = attempts.length
  const patternsExplored = stats.filter((s) => s.attempted).length

  const dueProblems = problemsMeta.filter((p) => isDue(schedule[p.slug], now))

  const focusAreas = useMemo(
    () =>
      stats
        .filter((s) => s.attempted)
        .sort((a, b) => MASTERY_ORDER[a.mastery] - MASTERY_ORDER[b.mastery])
        .slice(0, 3),
    [stats],
  )

  return (
    <div className="mx-auto h-full max-w-5xl overflow-auto px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-fg">Skills</h1>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Problems solved" value={`${solvedCount}/${problemsMeta.length}`} />
        <Stat label="Total runs" value={String(totalRuns)} />
        <Stat label="Patterns explored" value={`${patternsExplored}/${PATTERNS.length}`} />
      </div>

      {dueProblems.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-fg">Due for review</h2>
          <ul className="flex flex-col gap-2">
            {dueProblems.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/problems/${p.slug}`}
                  className="flex items-center justify-between rounded-md border border-line bg-surface-raised px-3 py-2 text-sm hover:bg-surface-sunken"
                >
                  <span className="font-medium text-fg">{p.title}</span>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    {dueLabel(schedule[p.slug], now)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {focusAreas.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-fg">Focus areas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {focusAreas.map((stat) => (
              <PatternCard key={stat.pattern} stat={stat} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-fg">All patterns</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <PatternCard key={stat.pattern} stat={stat} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised p-3">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div className="text-xl font-bold text-fg">{value}</div>
    </div>
  )
}
