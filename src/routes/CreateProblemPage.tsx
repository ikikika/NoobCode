import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { builtinSlugs } from '../content'
import { problemSchema, type Difficulty } from '../content/schema'
import {
  buildProblemSkeleton,
  deriveFunctionNames,
  isValidSlug,
  problemFilePath,
  serializeProblem,
  titleFromSlug,
} from '../content/newProblem'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'written'; path: string }
  | { kind: 'downloaded'; path: string }
  | { kind: 'error'; message: string }

const inputClass =
  'mt-1 w-full rounded-md border border-line bg-surface px-2 py-1 text-sm text-fg'

export function CreateProblemPage() {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const trimmedSlug = slug.trim()
  const slugValid = trimmedSlug !== '' && isValidSlug(trimmedSlug)
  const collides = slugValid && builtinSlugs.includes(trimmedSlug)
  const fnNames = useMemo(
    () => (slugValid ? deriveFunctionNames(trimmedSlug) : null),
    [slugValid, trimmedSlug],
  )

  function download(json: string, fileName: string) {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slugValid) return

    const skeleton = buildProblemSkeleton({ slug: trimmedSlug, title, difficulty })
    const parsed = problemSchema.safeParse(skeleton)
    if (!parsed.success) {
      setStatus({ kind: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid problem.' })
      return
    }
    const json = serializeProblem(skeleton)
    const relPath = problemFilePath(trimmedSlug)
    const fileName = `${trimmedSlug}.json`

    setStatus({ kind: 'busy' })

    // In dev, ask the dev-server plugin to write the file straight into the repo
    // (mirroring `npm run new:problem`). Anywhere else — or if that fails — fall
    // back to downloading the file for the user to drop in manually.
    if (import.meta.env.DEV) {
      try {
        const res = await fetch('/__new-problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: trimmedSlug, title, difficulty }),
        })
        if (res.ok) {
          const data = (await res.json()) as { path?: string }
          setStatus({ kind: 'written', path: data.path ?? relPath })
          return
        }
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (res.status === 409) {
          setStatus({ kind: 'error', message: data.error ?? `${relPath} already exists.` })
          return
        }
        if (res.status === 400) {
          setStatus({ kind: 'error', message: data.error ?? 'Invalid slug.' })
          return
        }
        // Unexpected server error — fall through to download.
      } catch {
        // Dev endpoint unreachable — fall through to download.
      }
    }

    download(json, fileName)
    setStatus({ kind: 'downloaded', path: relPath })
  }

  return (
    <div className="mx-auto h-full max-w-2xl overflow-auto px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-fg">New problem</h1>
        <Link to="/problems" className="ml-auto text-sm text-fg-muted hover:text-fg">
          ← Back to problems
        </Link>
      </div>

      <p className="mb-6 text-sm text-fg-muted">
        Generates a TODO-filled skeleton — the same one{' '}
        <code className="rounded bg-surface-sunken px-1">npm run new:problem</code> creates. While
        running <code className="rounded bg-surface-sunken px-1">npm run dev</code> it writes the
        file into <code className="rounded bg-surface-sunken px-1">src/content/problems/</code> for
        you; on the hosted site it downloads the file to drop in manually. Then fill in the TODOs and
        run <code className="rounded bg-surface-sunken px-1">npm run validate:content</code>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-xs font-medium text-fg-muted">
          Slug <span className="text-fail">*</span>
          <input
            value={slug}
            autoFocus
            placeholder="two-sum"
            onChange={(e) => {
              setSlug(e.target.value)
              setStatus({ kind: 'idle' })
            }}
            className={inputClass}
          />
          {trimmedSlug !== '' && !slugValid && (
            <span className="mt-1 block text-xs text-fail">
              Lowercase letters, digits, and hyphens only.
            </span>
          )}
          {collides && (
            <span className="mt-1 block text-xs text-fail">
              A problem with this slug already exists.
            </span>
          )}
        </label>

        <label className="block text-xs font-medium text-fg-muted">
          Title
          <input
            value={title}
            placeholder={slugValid ? titleFromSlug(trimmedSlug) : 'Two Sum'}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-xs font-medium text-fg-muted">
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className={inputClass}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        {fnNames && (
          <div className="rounded-md border border-line bg-surface-sunken px-3 py-2 text-xs text-fg-muted">
            <div>
              File: <code className="text-fg">{problemFilePath(trimmedSlug)}</code>
            </div>
            <div className="mt-1">
              Functions: <code className="text-fg">{fnNames.python}</code> (Python),{' '}
              <code className="text-fg">{fnNames.javascript}</code> (JS/TS)
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!slugValid || collides || status.kind === 'busy'}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-50"
        >
          {status.kind === 'busy' ? 'Creating…' : 'Create problem'}
        </button>
      </form>

      {status.kind === 'written' && (
        <p className="mt-4 rounded-md border border-pass/40 bg-pass-surface px-4 py-3 text-sm text-fg">
          Created <code className="text-fg">{status.path}</code>. Fill in the TODOs, run{' '}
          <code className="rounded bg-surface-sunken px-1">npm run validate:content</code>, and
          restart the dev server to see it in the list.
        </p>
      )}
      {status.kind === 'downloaded' && (
        <p className="mt-4 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-fg">
          Downloaded <code className="text-fg">{status.path.split('/').pop()}</code>. Move it to{' '}
          <code className="text-fg">{status.path}</code>, fill in the TODOs, and restart the dev
          server.
        </p>
      )}
      {status.kind === 'error' && (
        <p className="mt-4 rounded-md border border-fail/40 bg-fail-surface px-4 py-3 text-sm text-fg">
          {status.message}
        </p>
      )}
    </div>
  )
}
