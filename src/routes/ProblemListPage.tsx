import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { builtinMeta } from '../content'
import { PATTERNS, PATTERN_LABELS, type PatternId } from '../content/patterns'
import type { Difficulty, ProblemMeta } from '../content/schema'
import { useProgressStore } from '../store/useProgressStore'
import { DifficultyBadge } from '../components/DifficultyBadge'
import { Check } from '../components/ui'
import { useMediaQuery } from '../lib/useMediaQuery'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

type SortKey = 'order' | 'date'
type SortDir = 'asc' | 'desc'

const DATE_COL_WIDTH = 120
const DIFF_COL_WIDTH = 88

function isPatternId(value: string | null): value is PatternId {
  return value !== null && (PATTERNS as readonly string[]).includes(value)
}

function isDifficulty(value: string | null): value is Difficulty {
  return value !== null && (DIFFICULTIES as readonly string[]).includes(value)
}

function isSortKey(value: string | null): value is SortKey {
  return value === 'order' || value === 'date'
}

function isSortDir(value: string | null): value is SortDir {
  return value === 'asc' || value === 'desc'
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function ProblemListPage() {
  const solved = useProgressStore((s) => s.solved)
  const [searchParams, setSearchParams] = useSearchParams()
  const isNarrow = useMediaQuery('(max-width: 767px)')

  const patternParam = searchParams.get('pattern')
  const difficultyParam = searchParams.get('difficulty')
  const sortParam = searchParams.get('sort')
  const dirParam = searchParams.get('dir')

  const selectedPattern: PatternId | null = isPatternId(patternParam) ? patternParam : null
  const selectedDifficulty: Difficulty | null = isDifficulty(difficultyParam)
    ? difficultyParam
    : null
  const sortKey: SortKey = isSortKey(sortParam) ? sortParam : 'date'
  const sortDir: SortDir = isSortDir(dirParam) ? dirParam : 'desc'
  const newestFirst = sortKey === 'date' && sortDir === 'desc'
  const oldestFirst = sortKey === 'date' && sortDir === 'asc'

  const availablePatterns = useMemo(() => {
    const used = new Set(builtinMeta.flatMap((p) => p.patterns))
    return PATTERNS.filter((pattern) => used.has(pattern))
  }, [])

  const availableDifficulties = useMemo(() => {
    const used = new Set(builtinMeta.map((p) => p.difficulty))
    return DIFFICULTIES.filter((d) => used.has(d))
  }, [])

  const byDifficulty = useMemo(() => {
    if (!selectedDifficulty) return builtinMeta
    return builtinMeta.filter((p) => p.difficulty === selectedDifficulty)
  }, [selectedDifficulty])

  const byPattern = useMemo(() => {
    if (!selectedPattern) return builtinMeta
    return builtinMeta.filter((p) => p.patterns.includes(selectedPattern))
  }, [selectedPattern])

  const patternCounts = useMemo(() => {
    const counts = new Map<PatternId, number>()
    for (const pattern of availablePatterns) {
      counts.set(
        pattern,
        byDifficulty.filter((p) => p.patterns.includes(pattern)).length,
      )
    }
    return counts
  }, [availablePatterns, byDifficulty])

  const difficultyCounts = useMemo(() => {
    const counts = new Map<Difficulty, number>()
    for (const difficulty of availableDifficulties) {
      counts.set(
        difficulty,
        byPattern.filter((p) => p.difficulty === difficulty).length,
      )
    }
    return counts
  }, [availableDifficulties, byPattern])

  const items = useMemo(() => {
    const filtered = builtinMeta.filter((p) => {
      if (selectedPattern && !p.patterns.includes(selectedPattern)) return false
      if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false
      return true
    })

    const sorted = [...filtered]
    if (sortKey === 'date') {
      sorted.sort((a, b) => {
        const cmp = a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
        return sortDir === 'asc' ? cmp : -cmp
      })
    } else {
      sorted.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    }
    return sorted
  }, [selectedPattern, selectedDifficulty, sortKey, sortDir])

  const solvedCount = items.filter((p) => solved[p.slug]).length

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    setSearchParams(params, { replace: true })
  }

  function updateFilters(next: { pattern?: PatternId | null; difficulty?: Difficulty | null }) {
    updateParams({
      pattern: next.pattern !== undefined ? next.pattern : selectedPattern,
      difficulty: next.difficulty !== undefined ? next.difficulty : selectedDifficulty,
    })
  }

  function sortNewest() {
    updateParams({ sort: null, dir: null })
  }

  function sortOldest() {
    updateParams({ sort: 'date', dir: 'asc' })
  }

  const filterSummary = [
    selectedPattern ? PATTERN_LABELS[selectedPattern] : null,
    selectedDifficulty ? DIFFICULTY_LABELS[selectedDifficulty] : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      style={{
        padding: isNarrow ? '28px 20px 48px' : '44px 64px 64px',
        maxWidth: 1040,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <FilterRow label="Pattern">
          <FilterChip
            label="All"
            count={byDifficulty.length}
            active={selectedPattern === null}
            onClick={() => updateFilters({ pattern: null })}
          />
          {availablePatterns.map((pattern) => (
            <FilterChip
              key={pattern}
              label={PATTERN_LABELS[pattern]}
              count={patternCounts.get(pattern) ?? 0}
              active={selectedPattern === pattern}
              onClick={() => updateFilters({ pattern })}
            />
          ))}
        </FilterRow>

        <FilterRow label="Difficulty">
          <FilterChip
            label="All"
            count={byPattern.length}
            active={selectedDifficulty === null}
            onClick={() => updateFilters({ difficulty: null })}
          />
          {availableDifficulties.map((difficulty) => (
            <FilterChip
              key={difficulty}
              label={DIFFICULTY_LABELS[difficulty]}
              count={difficultyCounts.get(difficulty) ?? 0}
              active={selectedDifficulty === difficulty}
              onClick={() => updateFilters({ difficulty })}
            />
          ))}
        </FilterRow>

        <FilterRow label="Date">
          <FilterChip label="Newest" active={newestFirst} onClick={sortNewest} />
          <FilterChip label="Oldest" active={oldestFirst} onClick={sortOldest} />
        </FilterRow>
      </div>

      <div
        className="nc-mono"
        style={{ fontSize: 11.5, color: 'var(--color-fg-subtle)', marginBottom: 12 }}
      >
        {solvedCount} of {items.length} solved
        {filterSummary ? ` · ${filterSummary}` : ''}
      </div>

      {!isNarrow && (
        <div
          className="nc-mono"
          style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${DATE_COL_WIDTH}px ${DIFF_COL_WIDTH}px`,
            gap: 13,
            alignItems: 'center',
            padding: '0 12px 8px',
            margin: '0 -12px',
            fontSize: 11,
            color: 'var(--color-fg-subtle)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderBottom: '1px solid var(--color-line-soft)',
          }}
        >
          <span style={{ paddingLeft: 28 }}>Problem</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Level</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isNarrow ? 10 : 0,
        }}
      >
        {items.map((p) =>
          isNarrow ? (
            <ProblemCard key={p.slug} problem={p} solved={!!solved[p.slug]} />
          ) : (
            <ProblemRow key={p.slug} problem={p} solved={!!solved[p.slug]} />
          ),
        )}
        {items.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--color-fg-muted)', padding: '12px 0' }}>
            No problems match these filters.
          </p>
        )}
      </div>
    </div>
  )
}

function ProblemRow({ problem, solved }: { problem: ProblemMeta; solved: boolean }) {
  return (
    <Link className="nc-reset" to={`/problems/${problem.slug}`}>
      <div
        className="nc-row-hover"
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0, 1fr) ${DATE_COL_WIDTH}px ${DIFF_COL_WIDTH}px`,
          alignItems: 'center',
          gap: 13,
          padding: '9px 12px',
          margin: '0 -12px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
          <Check on={solved} />
          <span
            className="t"
            style={{
              fontSize: 15,
              fontWeight: 500,
              transition: 'color .12s',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {problem.title}
          </span>
        </span>
        <span
          className="nc-mono"
          style={{ fontSize: 12, color: 'var(--color-fg-subtle)', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatDate(problem.date)}
        </span>
        <span style={{ justifySelf: 'end' }}>
          <DifficultyBadge difficulty={problem.difficulty} />
        </span>
      </div>
    </Link>
  )
}

function ProblemCard({ problem, solved }: { problem: ProblemMeta; solved: boolean }) {
  return (
    <Link className="nc-reset" to={`/problems/${problem.slug}`}>
      <div
        className="nc-row-hover"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          padding: '14px 14px',
          border: '1px solid var(--color-line)',
          borderRadius: 10,
          background: 'var(--color-surface-raised)',
        }}
      >
        <span style={{ paddingTop: 2 }}>
          <Check on={solved} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="t"
            style={{
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.35,
              transition: 'color .12s',
              whiteSpace: 'normal',
            }}
          >
            {problem.title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginTop: 10,
            }}
          >
            <span
              className="nc-mono"
              style={{
                fontSize: 12,
                color: 'var(--color-fg-subtle)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatDate(problem.date)}
            </span>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div
        className="nc-mono"
        style={{
          fontSize: 11,
          color: 'var(--color-fg-subtle)',
          marginBottom: 8,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
        role="group"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        {children}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-line)'}`,
        background: active ? 'var(--color-accent-soft)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-fg-muted)',
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: 12.5,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition: 'background .12s, border-color .12s, color .12s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label}
      {count !== undefined && (
        <span
          className="nc-mono"
          style={{
            fontSize: 11,
            opacity: 0.75,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
