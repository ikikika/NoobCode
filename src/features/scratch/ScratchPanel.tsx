import { useState } from 'react'
import type { LanguageId, Problem } from '../../content/schema'
import { useProgressStore } from '../../store/useProgressStore'
import { getRunner } from '../runner/runnerRegistry'
import { Spinner } from '../../components/Spinner'
import { formatValue } from '../../lib/formatValue'

interface ScratchPanelProps {
  problem: Problem
  language: LanguageId
}

export function ScratchPanel({ problem, language }: ScratchPanelProps) {
  const savedValue = useProgressStore((s) => s.savedCode[`${problem.slug}:${language}`])
  const code = savedValue || problem.starterCode[language]

  const example = JSON.stringify(problem.tests[0]?.args ?? [])
  const [input, setInput] = useState(example)
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<{
    actual?: unknown
    stdout?: string
    error?: string
  } | null>(null)

  const onRun = async () => {
    let args: unknown[]
    try {
      const parsed = JSON.parse(input)
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of arguments.')
      args = parsed
    } catch (err) {
      setOutput({ error: err instanceof Error ? err.message : 'Invalid JSON' })
      return
    }

    setRunning(true)
    setOutput(null)
    try {
      const runner = getRunner(language)
      await runner.init()
      const result = await runner.run({
        userCode: code,
        functionName: problem.functionName[language],
        tests: [{ name: 'scratch', args, expected: null, hidden: false }],
      })
      const c = result.cases[0]
      if (!c) {
        setOutput({ error: result.error ?? 'No output produced.' })
      } else {
        setOutput({ actual: c.actual, stdout: c.stdout, error: c.error })
      }
    } catch (err) {
      setOutput({ error: err instanceof Error ? err.message : String(err) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <p className="mb-2 text-xs text-fg-subtle">
        Run <span className="font-mono text-fg">{problem.functionName[language]}</span> on your own
        input. Enter the arguments as a JSON array.
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        rows={3}
        className="w-full rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs text-fg"
      />
      <div className="mt-2">
        <button
          onClick={onRun}
          disabled={running}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-50"
        >
          {running && <Spinner size={12} />}
          Run
        </button>
      </div>

      {output && (
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {output.error ? (
            <div className="rounded-md bg-fail-surface p-3 text-xs text-fail">
              <div className="font-semibold">Error</div>
              <pre className="mt-1 whitespace-pre-wrap font-mono">{output.error}</pre>
            </div>
          ) : (
            <div className="rounded-md border border-line bg-surface-raised p-3">
              <div className="text-xs text-fg-subtle">Returned</div>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono text-xs text-fg">
                {formatValue(output.actual, true)}
              </pre>
            </div>
          )}
          {output.stdout && (
            <div className="rounded-md border border-line bg-surface-raised p-3">
              <div className="text-xs text-fg-subtle">stdout</div>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-fg-muted">
                {output.stdout}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
