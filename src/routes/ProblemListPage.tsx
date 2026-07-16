import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { builtinMeta } from '../content'
import { PATTERNS, PATTERN_LABELS, type PatternId } from '../content/patterns'
import { useProgressStore } from '../store/useProgressStore'
import { DifficultyBadge } from '../components/DifficultyBadge'
import { Check } from '../components/ui'

export function ProblemListPage() {
  const solved = useProgressStore((s) => s.solved)

  
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

  return (
    <div style={{ padding: '44px 64px 64px', maxWidth: 1040, margin: '0 auto' }}>

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
