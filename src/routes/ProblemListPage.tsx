import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { problemsMeta } from '../content'
import { useProgressStore } from '../store/useProgressStore'
import { isDue } from '../features/review/schedule'
import { DifficultyBadge } from '../components/DifficultyBadge'

export function ProblemListPage() {
  const solved = useProgressStore((s) => s.solved)
  const schedule = useProgressStore((s) => s.schedule)
  const now = Date.now()

  const dueCount = useMemo(
    () => problemsMeta.filter((p) => isDue(schedule[p.slug], now)).length,
    [schedule, now],
  )

  return (
    <div className="mx-auto h-full max-w-3xl overflow-auto px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-fg">Problems</h1>

      {dueCount > 0 && (
        <Link
          to="/skills"
          className="mb-4 block rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent"
        >
          {dueCount} problem{dueCount === 1 ? '' : 's'} due for review →
        </Link>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {problemsMeta.map((p) => {
          const due = isDue(schedule[p.slug], now)
          return (
            <li key={p.slug}>
              <Link
                to={`/problems/${p.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised"
              >
                <span className={`text-pass ${solved[p.slug] ? '' : 'opacity-0'}`}>✓</span>
                <span className="font-medium text-fg">{p.title}</span>
                {due && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    Due
                  </span>
                )}
                <span className="ml-auto hidden items-center gap-1.5 sm:flex">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-fg-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
                <DifficultyBadge difficulty={p.difficulty} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
