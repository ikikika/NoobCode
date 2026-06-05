import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Problem } from '../content/schema'
import { loadProblem } from '../content/loader'
import { ProblemDetail } from '../features/problem/ProblemDetail'
import { Spinner } from '../components/Spinner'

export function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setProblem(null)
    setError(null)
    if (!slug) return
    loadProblem(slug)
      .then((p) => {
        if (!cancelled) setProblem(p)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-fg-muted">
        <p>Could not load this problem.</p>
        <pre className="max-w-lg whitespace-pre-wrap text-xs text-fail">{error}</pre>
        <Link to="/problems" className="text-accent hover:underline">
          ← Back to problems
        </Link>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-fg-muted">
        <Spinner size={18} /> Loading problem…
      </div>
    )
  }

  return <ProblemDetail problem={problem} />
}
