import { Spinner } from '../../components/Spinner'
import { formatValue } from '../../lib/formatValue'
import type { RunResult } from '../runner/LanguageRunner'
import type { RunnerStatus } from '../../store/useRunnerStore'

interface ResultsPanelProps {
  status: RunnerStatus
  result: RunResult | null
  loadingMessage: string
}

export function ResultsPanel({ status, result, loadingMessage }: ResultsPanelProps) {
  if (status === 'loading' || status === 'running') {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-sm text-fg-muted">
        <Spinner size={18} />
        {loadingMessage || 'Working…'}
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-fg-subtle">
        Run your code to see test results.
      </div>
    )
  }

  if (result.error && result.cases.length === 0) {
    return (
      <div className="p-4">
        <div data-testid="results-error" className="rounded-md bg-fail-surface p-3 text-sm text-fail">
          <div className="font-semibold">Error</div>
          <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{result.error}</pre>
        </div>
      </div>
    )
  }

  const passedCount = result.cases.filter((c) => c.passed).length

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <div
        role="status"
        aria-live="polite"
        data-testid="results-banner"
        className={`mb-3 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
          result.passed ? 'bg-pass-surface text-pass' : 'bg-fail-surface text-fail'
        }`}
      >
        <span>
          {result.passed ? 'All tests passed' : 'Some tests failed'} — {passedCount}/
          {result.cases.length}
        </span>
        <span className="text-xs font-normal opacity-80">{result.durationMs.toFixed(0)} ms</span>
      </div>

      {result.timedOut && (
        <div className="mb-3 rounded-md bg-fail-surface px-3 py-2 text-xs text-fail">
          Execution timed out.
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {result.cases.map((c, i) => (
          <li key={i} className="rounded-md border border-line bg-surface-raised p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-fg">
                <span className={c.passed ? 'text-pass' : 'text-fail'}>{c.passed ? '✓' : '✗'}</span>{' '}
                {c.name}
              </span>
              <span className="text-xs text-fg-subtle">{c.durationMs.toFixed(1)} ms</span>
            </div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs text-fg-muted">
              <dt className="text-fg-subtle">input</dt>
              <dd className="break-all">{formatValue(c.input)}</dd>
              <dt className="text-fg-subtle">expected</dt>
              <dd className="break-all">{formatValue(c.expected)}</dd>
              <dt className="text-fg-subtle">actual</dt>
              <dd className={`break-all ${c.passed ? '' : 'text-fail'}`}>
                {formatValue(c.actual)}
              </dd>
              {c.error && (
                <>
                  <dt className="text-fg-subtle">error</dt>
                  <dd className="break-all text-fail">{c.error}</dd>
                </>
              )}
              {c.stdout && (
                <>
                  <dt className="text-fg-subtle">stdout</dt>
                  <dd className="whitespace-pre-wrap break-all">{c.stdout}</dd>
                </>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
