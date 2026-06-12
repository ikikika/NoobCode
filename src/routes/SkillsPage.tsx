import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATTERNS, PATTERN_LABELS, type PatternId } from '../content/patterns'
import { builtinMeta } from '../content'
import { useProgressStore } from '../store/useProgressStore'
import { deriveMastery, MASTERY_ORDER, type MasteryLevel } from '../features/skills/mastery'
import type { AttemptRecord } from '../features/analysis/types'
import { MethodReference } from '../features/skills/MethodReference'
import { useMediaQuery } from '../lib/useMediaQuery'
import { Tabs } from '../components/Tabs'
import { Bar, Kicker, MasteryChip, MasteryDot, Ring } from '../components/ui'

type SkillsTab = 'patterns' | 'methods'

interface RelatedProblem {
  slug: string
  title: string
  solved: boolean
}

interface PatternStat {
  pattern: PatternId
  label: string
  mastery: MasteryLevel
  solved: number
  total: number
  attempted: boolean
  related: RelatedProblem[]
}

const LEGEND: [MasteryLevel, string][] = [
  ['mastered', 'Mastered'],
  ['learning', 'Learning'],
  ['weak', 'Weak'],
  ['unseen', 'Unseen'],
]

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      {LEGEND.map(([k, l]) => (
        <span
          key={k}
          style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--color-fg-muted)' }}
        >
          <MasteryDot level={k} />
          {l}
        </span>
      ))}
    </div>
  )
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="nc-serif" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <Kicker style={{ marginTop: 7, display: 'block' }}>{label}</Kicker>
    </div>
  )
}

function patternHref(s: PatternStat): string {
  const target = s.related.find((p) => !p.solved) ?? s.related[0]
  return target ? `/problems/${target.slug}` : '/problems'
}

export function SkillsPage() {
  const solved = useProgressStore((s) => s.solved)
  const attempts = useProgressStore((s) => s.attempts)
  // Fixed at mount: used as a stable useMemo dependency for mastery decay.
  const [now] = useState(() => Date.now())

  const [tab, setTab] = useState<SkillsTab>('patterns')

  const slugPatterns = useMemo(() => {
    const map = new Map<string, PatternId[]>()
    for (const p of builtinMeta) map.set(p.slug, p.patterns)
    return map
  }, [])

  const stats = useMemo<PatternStat[]>(() => {
    return PATTERNS.map((pattern) => {
      const related = builtinMeta.filter((p) => p.patterns.includes(pattern))
      const patternAttempts: AttemptRecord[] = attempts.filter((a) =>
        slugPatterns.get(a.slug)?.includes(pattern),
      )
      return {
        pattern,
        label: PATTERN_LABELS[pattern],
        mastery: deriveMastery(patternAttempts, now),
        solved: related.filter((p) => solved[p.slug]).length,
        total: related.length,
        attempted: patternAttempts.length > 0,
        related: related.map((p) => ({ slug: p.slug, title: p.title, solved: !!solved[p.slug] })),
      }
    })
  }, [attempts, solved, slugPatterns, now])

  const solvedCount = builtinMeta.filter((p) => solved[p.slug]).length
  const total = builtinMeta.length
  const totalRuns = attempts.length
  const coveredStats = stats.filter((s) => s.total > 0)
  const masteredCount = coveredStats.filter((s) => s.mastery === 'mastered').length
  const exploredCount = coveredStats.filter((s) => s.attempted).length
  const weak = useMemo(
    () =>
      stats
        .filter((s) => s.attempted && s.mastery === 'weak')
        .sort((a, b) => MASTERY_ORDER[a.mastery] - MASTERY_ORDER[b.mastery]),
    [stats],
  )
  const pct = total === 0 ? 0 : Math.round((solvedCount / total) * 100)
  // Below the 768px panel breakpoint, stack the side-by-side summary cards and
  // let the wide mastery table scroll horizontally instead of overflowing.
  const isNarrow = useMediaQuery('(max-width: 767px)')

  const MASTERY_GRID_COLS = '230px 90px 1fr 130px'

  return (
    <div style={{ padding: isNarrow ? '24px 18px 40px' : '36px 48px 56px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <Kicker>Your skills</Kicker>
          <h1 className="nc-serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0' }}>
            Skills overview
          </h1>
        </div>
        {tab === 'patterns' && <Legend />}
      </div>

      <div style={{ marginBottom: 24 }}>
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
          {/* overall + where to focus */}
          <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1.15fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="nc-card" style={{ padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 30 }}>
              <Ring pct={pct} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', flex: 1 }}>
                <MiniStat value={`${solvedCount}/${total}`} label="Solved" />
                <MiniStat value={`${masteredCount}/${coveredStats.length}`} label="Mastered" />
                <MiniStat value={`${exploredCount}/${coveredStats.length}`} label="Explored" />
                <MiniStat value={totalRuns} label="Total runs" />
              </div>
            </div>
            <div className="nc-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span className="nc-serif" style={{ fontSize: 18, fontWeight: 500 }}>
                  Where to focus
                </span>
                <span className="nc-chip weak">{weak.length} weak</span>
              </div>
              {weak.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-fg-subtle)', margin: 0 }}>
                  Nothing weak right now — keep practicing to surface gaps.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {weak.map((s) => (
                    <Link
                      key={s.pattern}
                      to={patternHref(s)}
                      className="nc-reset"
                      style={{ display: 'grid', gridTemplateColumns: '150px 1fr 44px', gap: 14, alignItems: 'center' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
                        <MasteryDot level={s.mastery} />
                        {s.label}
                      </span>
                      <Bar value={s.solved} max={s.total} thin />
                      <span className="nc-mono" style={{ fontSize: 11.5, color: 'var(--color-fg-subtle)', textAlign: 'right' }}>
                        {s.solved}/{s.total}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* mastery matrix — wide fixed columns; scroll within the card on
              narrow screens rather than overflowing the viewport */}
          <div className="nc-card" style={{ padding: '6px 26px 12px', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: MASTERY_GRID_COLS, gap: 20, alignItems: 'center', padding: '14px 0 10px', minWidth: 560 }}>
              {['Pattern', 'Solved', 'Problems', 'Mastery'].map((h) => (
                <Kicker key={h}>{h}</Kicker>
              ))}
            </div>
            <div className="nc-divide">
              {coveredStats.map((s) => (
                <Link key={s.pattern} className="nc-reset" to={patternHref(s)}>
                  <div
                    className="nc-row-hover"
                    style={{ display: 'grid', gridTemplateColumns: MASTERY_GRID_COLS, gap: 20, alignItems: 'center', padding: '12px', margin: '0 -12px', minWidth: 560 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14.5, fontWeight: 500 }}>
                      <MasteryDot level={s.mastery} />
                      <span className="t" style={{ transition: 'color .12s' }}>
                        {s.label}
                      </span>
                    </span>
                    <span className="nc-mono" style={{ fontSize: 12.5, color: 'var(--color-fg-muted)' }}>
                      {s.solved}/{s.total}
                    </span>
                    <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {s.related.map((p) => (
                        <span
                          key={p.slug}
                          title={p.title}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            background: p.solved ? 'var(--color-pass-surface)' : 'var(--color-surface-sunken)',
                            color: p.solved ? 'var(--color-pass)' : 'var(--color-fg-subtle)',
                          }}
                        >
                          {p.solved ? '✓' : '·'}
                        </span>
                      ))}
                    </span>
                    <span style={{ justifySelf: 'start' }}>
                      <MasteryChip level={s.mastery} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <MethodReference />
      )}
    </div>
  )
}
