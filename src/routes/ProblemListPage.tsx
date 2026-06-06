import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProblemsMeta } from '../content/useProblemsMeta'
import { useProgressStore } from '../store/useProgressStore'
import { useUserProblemsStore } from '../store/useUserProblemsStore'
import { isDue } from '../features/review/schedule'
import { DifficultyBadge } from '../components/DifficultyBadge'

export function ProblemListPage() {
  const solved = useProgressStore((s) => s.solved)
  const schedule = useProgressStore((s) => s.schedule)
  const addProblem = useUserProblemsStore((s) => s.addProblem)
  const removeProblem = useUserProblemsStore((s) => s.removeProblem)
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const now = Date.now()

  const problems = useProblemsMeta()

  const dueCount = useMemo(
    () => problems.filter((p) => isDue(schedule[p.slug], now)).length,
    [problems, schedule, now],
  )

  const onImportFile = async (file: File) => {
    setImportError(null)
    try {
      const json = JSON.parse(await file.text())
      const result = addProblem(json)
      if (result.ok) {
        navigate(`/problems/${result.slug}`)
      } else {
        setImportError(result.error)
      }
    } catch (err) {
      setImportError(err instanceof Error ? `Not valid JSON: ${err.message}` : 'Not valid JSON')
    }
  }

  return (
    <div className="mx-auto h-full max-w-3xl overflow-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-fg">Problems</h1>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface-raised"
        >
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void onImportFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {importError && (
        <div className="mb-4 rounded-md bg-fail-surface p-3 text-sm text-fail">
          <div className="font-semibold">Could not import problem</div>
          <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{importError}</pre>
        </div>
      )}

      {dueCount > 0 && (
        <Link
          to="/skills"
          className="mb-4 block rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent"
        >
          {dueCount} problem{dueCount === 1 ? '' : 's'} due for review →
        </Link>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {problems.map((p) => {
          const due = isDue(schedule[p.slug], now)
          return (
            <li key={p.slug} className="flex items-center hover:bg-surface-raised">
              <Link to={`/problems/${p.slug}`} className="flex flex-1 items-center gap-3 px-4 py-3">
                <span className={`text-pass ${solved[p.slug] ? '' : 'opacity-0'}`}>✓</span>
                <span className="font-medium text-fg">{p.title}</span>
                {due && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    Due
                  </span>
                )}
                {p.imported && (
                  <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-fg-muted">
                    Imported
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
              {p.imported && (
                <button
                  onClick={() => removeProblem(p.slug)}
                  aria-label={`Remove ${p.title}`}
                  title="Remove imported problem"
                  className="px-3 py-3 text-fg-subtle hover:text-fail"
                >
                  ✕
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
