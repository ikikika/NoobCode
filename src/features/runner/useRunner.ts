import { useCallback } from 'react'
import type { LanguageId, TestCase } from '../../content/schema'
import { useRunnerStore } from '../../store/useRunnerStore'
import { getRunner } from './runnerRegistry'
import type { RunResult } from './LanguageRunner'

export interface RunArgs {
  language: LanguageId
  userCode: string
  functionName: string
  tests: TestCase[]
  timeoutMs?: number
}

export function useRunner() {
  const status = useRunnerStore((s) => s.status)
  const result = useRunnerStore((s) => s.result)
  const loadingMessage = useRunnerStore((s) => s.loadingMessage)
  const setStatus = useRunnerStore((s) => s.setStatus)
  const setResult = useRunnerStore((s) => s.setResult)
  const setLoadingMessage = useRunnerStore((s) => s.setLoadingMessage)
  const reset = useRunnerStore((s) => s.reset)

  const run = useCallback(
    async (args: RunArgs): Promise<RunResult | null> => {
      const runner = getRunner(args.language)
      setStatus('loading')
      setResult(null)
      setLoadingMessage('Preparing runtime…')
      try {
        await runner.init((msg) => setLoadingMessage(msg))
        setStatus('running')
        setLoadingMessage('Running tests…')
        const runResult = await runner.run({
          userCode: args.userCode,
          functionName: args.functionName,
          tests: args.tests,
          timeoutMs: args.timeoutMs,
        })
        setResult(runResult)
        setStatus(runResult.error && runResult.cases.length === 0 ? 'error' : 'done')
        setLoadingMessage('')
        return runResult
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        // A cooperative Stop surfaces as a KeyboardInterrupt from Pyodide —
        // treat it as a clean cancellation, not an error.
        if (message.includes('KeyboardInterrupt')) {
          setResult(null)
          setStatus('idle')
          setLoadingMessage('')
          return null
        }
        setResult({
          passed: false,
          cases: [],
          stdout: '',
          stderr: '',
          durationMs: 0,
          timedOut: false,
          error: message,
        })
        setStatus('error')
        setLoadingMessage('')
        return null
      }
    },
    [setStatus, setResult, setLoadingMessage],
  )

  const interrupt = useCallback(
    (language: LanguageId) => {
      getRunner(language).interrupt()
      setStatus('idle')
      setLoadingMessage('')
    },
    [setStatus, setLoadingMessage],
  )

  return { run, interrupt, status, result, loadingMessage, reset }
}
