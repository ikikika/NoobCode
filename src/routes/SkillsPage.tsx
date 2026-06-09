import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATTERNS, PATTERN_LABELS, type PatternId } from '../content/patterns'
import { builtinMeta } from '../content'
import { useProgressStore } from '../store/useProgressStore'
import { dueLabel, isDue } from '../features/review/schedule'
import {
  deriveMastery,
  MASTERY_LABELS,
  MASTERY_ORDER,
  type MasteryLevel,
} from '../features/skills/mastery'
import type { AttemptRecord } from '../features/analysis/types'
import { MethodReference } from '../features/skills/MethodReference'
import { Tabs } from '../components/Tabs'

const MASTERY_STYLES: Record<MasteryLevel, string> = {
  unseen: 'bg-surface-sunken text-fg-subtle',
  weak: 'bg-fail-surface text-fail',
  learning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  mastered: 'bg-pass-surface text-pass',
}

const MASTERY_DOT: Record<MasteryLevel, string> = {
  unseen: 'bg-fg-subtle/40',
  weak: 'bg-fail',
  learning: 'bg-amber-500',
  mastered: 'bg-pass',
}

type SkillsTab = 'patterns' | 'methods'

interface RelatedProblem {
  slug: string
  title: string
  solved: boolean
}

interface PatternStat {
  pattern: PatternId
  mastery: MasteryLevel
  solved: number
  total: number
  attempted: boolean
  related: RelatedProblem[]
}

function ProgressBar({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div className={`h-full rounded-full ${tone} transition-[width]`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PatternRow({ stat }: { stat: PatternStat }) {
  const pct = stat.total === 0 ? 0 : Math.round((stat.solved / stat.total) * 100)
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-raised p-3 sm:flex-row sm:gap-4">
      <div className="sm:w-60 sm:shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-fg">
            <span className={`h-2 w-2 shrink-0 rounded-full ${MASTERY_DOT[stat.mastery]}`} />
            {PATTERN_LABELS[stat.pattern]}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${MASTERY_STYLES[stat.mastery]}`}
          >
            {MASTERY_LABELS[stat.mastery]}
          </span>
        </div>
        <div className="mt-1.5 mb-1 text-xs text-fg-subtle">
          {stat.solved}/{stat.total} solved · {pct}%
        </div>
        <ProgressBar value={stat.solved} max={stat.total} tone="bg-accent" />
      </div>
      <ol className="flex flex-col gap-0.5 sm:flex-1">
        {stat.related.map((p, i) => (
          <li key={p.slug}>
            <Link
              to={`/problems/${p.slug}`}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                p.solved
                  ? 'text-pass hover:bg-pass-surface'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-accent'
              }`}
            >
              <span className="w-5 shrink-0 text-right tabular-nums text-fg-subtle">{i + 1}.</span>
              <span className="flex-1">{p.title}</span>
              {p.solved && <span aria-hidden>✓</span>}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div className="text-xl font-bold text-fg">{value}</div>
    </div>
  )
}

export function SkillsPage() {
  const solved = useProgressStore((s) => s.solved)
  const attempts = useProgressStore((s) => s.attempts)
  const schedule = useProgressStore((s) => s.schedule)
  const problemsMeta = builtinMeta
  const now = Date.now()

  const [tab, setTab] = useState<SkillsTab>('patterns')

  const slugPatterns = useMemo(() => {
    const map = new Map<string, PatternId[]>()
    for (const p of problemsMeta) map.set(p.slug, p.patterns)
    return map
  }, [problemsMeta])

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
        related: related.map((p) => ({ slug: p.slug, title: p.title, solved: !!solved[p.slug] })),
      }
    })
  }, [attempts, solved, slugPatterns, problemsMeta, now])

  const solvedCount = Object.values(solved).filter(Boolean).length
  const totalRuns = attempts.length
  const coveredStats = stats.filter((s) => s.total > 0)
  const uncovered = stats.filter((s) => s.total === 0)
  const patternsExplored = coveredStats.filter((s) => s.attempted).length
  const masteredCount = coveredStats.filter((s) => s.mastery === 'mastered').length

  const dueProblems = problemsMeta.filter((p) => isDue(schedule[p.slug], now))

  const focusAreas = useMemo(
    () =>
      stats
        .filter((s) => s.attempted && s.mastery !== 'mastered')
        .sort((a, b) => MASTERY_ORDER[a.mastery] - MASTERY_ORDER[b.mastery])
        .slice(0, 3),
    [stats],
  )

  return (
    <div className="mx-auto h-full max-w-5xl overflow-auto px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold text-fg">Skills</h1>

      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'patterns', label: 'Question Patterns' },
            { id: 'methods', label: 'Language Methods' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as SkillsTab)}
        />
      </div>

      {tab === 'patterns' ? (
        <>
          <div className="mb-6 rounded-lg border border-line bg-surface-raised p-4">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-fg">Overall progress</span>
              <span className="text-xs text-fg-muted">
                {solvedCount} of {problemsMeta.length} problems solved
              </span>
            </div>
            <ProgressBar value={solvedCount} max={problemsMeta.length} tone="bg-accent" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Problems solved" value={`${solvedCount}/${problemsMeta.length}`} />
              <Stat label="Patterns mastered" value={`${masteredCount}/${coveredStats.length}`} />
              <Stat label="Patterns explored" value={`${patternsExplored}/${coveredStats.length}`} />
              <Stat label="Total runs" value={String(totalRuns)} />
            </div>
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
              <p className="mb-2 text-xs text-fg-subtle">
                The patterns you’ve attempted but haven’t mastered yet — worth another pass.
              </p>
              <div className="flex flex-col gap-2">
                {focusAreas.map((stat) => (
                  <PatternRow key={stat.pattern} stat={stat} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-fg">All patterns</h2>
              <span className="text-xs text-fg-subtle">({coveredStats.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {coveredStats.map((stat) => (
                <PatternRow key={stat.pattern} stat={stat} />
              ))}
            </div>
            {uncovered.length > 0 && (
              <p className="mt-3 text-xs text-fg-subtle">
                Not yet covered by any problem:{' '}
                {uncovered.map((s) => PATTERN_LABELS[s.pattern]).join(', ')}.
              </p>
            )}
          </section>
        </>
      ) : (
        <section>
          <p className="mb-3 text-xs text-fg-subtle">
            Common methods for a data structure in each language, with a check for the ones you’ve
            already used in a past submission.
          </p>
          <MethodReference />
        </section>
      )}
    </div>
  )
}
