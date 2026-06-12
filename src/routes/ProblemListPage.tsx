import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { builtinMeta } from '../content'
import { PATTERNS, PATTERN_LABELS, type PatternId } from '../content/patterns'
import { useProgressStore } from '../store/useProgressStore'
import { isDue } from '../features/review/schedule'
import { computeStreak } from '../features/review/streak'
import { DifficultyBadge } from '../components/DifficultyBadge'
import { Check, Kicker } from '../components/ui'

export function ProblemListPage() {
  const solved = useProgressStore((s) => s.solved)
  const attempts = useProgressStore((s) => s.attempts)
  const schedule = useProgressStore((s) => s.schedule)
  const lastRun = useProgressStore((s) => s.lastRun)
  const [now] = useState(() => Date.now())

  const solvedCount = builtinMeta.filter((p) => solved[p.slug]).length
  const total = builtinMeta.length
  const streak = useMemo(() => computeStreak(attempts, now), [attempts, now])
  const dueCount = builtinMeta.filter((p) => isDue(schedule[p.slug], now)).length

  // Resume = most recent attempt that isn't solved yet; then most recent attempt;
  // then the first unsolved problem; then the first problem.
  const continueSlug = useMemo(() => {
    const byRecent = [...attempts].sort((a, b) => b.timestamp - a.timestamp)
    return (
      byRecent.find((a) => !solved[a.slug])?.slug ??
      byRecent[0]?.slug ??
      builtinMeta.find((p) => !solved[p.slug])?.slug ??
      builtinMeta[0]?.slug
    )
  }, [attempts, solved])
  const cont = builtinMeta.find((p) => p.slug === continueSlug)
  const contRun = continueSlug ? lastRun[continueSlug] : undefined

  // Group each problem under its primary (first) pattern, in canonical order.
  const groups = useMemo(() => {
    return PATTERNS.map((pattern: PatternId) => {
      const items = builtinMeta.filter((p) => p.patterns[0] === pattern)
      return {
        pattern,
        label: PATTERN_LABELS[pattern],
        items,
        solved: items.filter((p) => solved[p.slug]).length,
      }
    }).filter((g) => g.items.length > 0)
  }, [solved])

  const stats: [string, string][] = [
    ['Solved', `${solvedCount}/${total}`],
    ['Streak', `${streak}d`],
    ['Due', `${dueCount}`],
  ]

  return (
    <div style={{ padding: '44px 64px 64px', maxWidth: 1040, margin: '0 auto' }}>
      {/* status line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          paddingBottom: 22,
          borderBottom: '1px solid var(--color-line)',
          marginBottom: 40,
        }}
      >
        <div>
          <Kicker>Practice index</Kicker>
          <h1
            className="nc-serif"
            style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.025em', margin: '10px 0 0' }}
          >
            Problems
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {stats.map(([l, v]) => (
            <div key={l} style={{ textAlign: 'right' }}>
              <div
                className="nc-serif"
                style={{ fontSize: 24, fontWeight: 500, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
              >
                {v}
              </div>
              <Kicker style={{ marginTop: 5, display: 'block' }}>{l}</Kicker>
            </div>
          ))}
        </div>
      </div>

      {/* resume strip */}
      {cont && (
        <Link className="nc-reset" to={`/problems/${cont.slug}`} style={{ marginBottom: 44 }}>
          <div
            className="nc-resume"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              background: 'var(--color-accent-soft)',
              borderRadius: 12,
              transition: 'background .15s',
            }}
          >
            <Kicker style={{ color: 'var(--color-accent)' }}>Resume</Kicker>
            <span className="nc-serif" style={{ fontSize: 19, fontWeight: 500 }}>
              {cont.title}
            </span>
            {contRun && (
              <span style={{ fontSize: 12.5, color: 'var(--color-fg-muted)' }}>
                {contRun.passed} / {contRun.total} tests
              </span>
            )}
            <span style={{ marginLeft: 'auto', color: 'var(--color-accent)', fontWeight: 600, fontSize: 14 }}>
              Continue →
            </span>
          </div>
        </Link>
      )}

      {/* gutter index, grouped by pattern */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {groups.map((g, i) => (
          <div
            key={g.pattern}
            className="nc-grouprow"
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              gap: 32,
              padding: '20px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--color-line-soft)',
            }}
          >
            <div style={{ paddingTop: 2 }}>
              <div className="nc-serif" style={{ fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em' }}>
                {g.label}
              </div>
              <div className="nc-mono" style={{ fontSize: 11.5, color: 'var(--color-fg-subtle)', marginTop: 6 }}>
                {g.solved} of {g.items.length} solved
              </div>
            </div>
            <div>
              {g.items.map((p) => (
                <Link key={p.slug} className="nc-reset" to={`/problems/${p.slug}`}>
                  <div
                    className="nc-row-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 13,
                      padding: '9px 12px',
                      margin: '0 -12px',
                    }}
                  >
                    <Check on={!!solved[p.slug]} />
                    <span className="t" style={{ fontSize: 15, fontWeight: 500, transition: 'color .12s' }}>
                      {p.title}
                    </span>
                    <span style={{ marginLeft: 'auto' }}>
                      <DifficultyBadge difficulty={p.difficulty} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
