/// <reference lib="webworker" />
import { loadPyodide, type PyodideInterface } from 'pyodide'
import harnessSource from './harness.py?raw'
import analyzerSource from '../../analysis/python/analyzer.py?raw'
import type { WorkerRequest } from '../workerProtocol'
import type { CaseResult, RunResult } from '../LanguageRunner'
import type { CodeFeatures } from '../../analysis/types'

let pyodide: PyodideInterface | null = null
let currentId = 0

function post(message: unknown) {
  ;(self as unknown as Worker).postMessage(message)
}

async function ensurePyodide(id: number): Promise<PyodideInterface> {
  if (pyodide) return pyodide
  post({ type: 'progress', id, message: 'Downloading Python runtime…' })
  const indexURL = import.meta.env.BASE_URL + 'pyodide/'
  pyodide = await loadPyodide({ indexURL })
  pyodide.setStdout({ batched: (text: string) => post({ type: 'stdout', id: currentId, text }) })
  pyodide.setStderr({ batched: (text: string) => post({ type: 'stderr', id: currentId, text }) })
  post({ type: 'progress', id, message: 'Python runtime ready' })
  return pyodide
}

async function handleRun(req: Extract<WorkerRequest, { type: 'run' }>) {
  const py = await ensurePyodide(req.id)
  currentId = req.id
  const start = performance.now()
  py.globals.set('__user_code__', req.userCode)
  py.globals.set('__function_name__', req.functionName)
  py.globals.set('__tests_json__', JSON.stringify(req.tests))

  let raw: string
  try {
    raw = (await py.runPythonAsync(harnessSource)) as string
  } catch (err) {
    post({ type: 'error', id: req.id, message: err instanceof Error ? err.message : String(err) })
    return
  }

  const parsed = JSON.parse(raw) as { cases: CaseResult[]; error?: string }
  const cases = parsed.cases ?? []
  const durationMs = performance.now() - start
  const result: RunResult = {
    passed: parsed.error ? false : cases.length > 0 && cases.every((c) => c.passed),
    cases,
    stdout: '',
    stderr: '',
    durationMs,
    timedOut: false,
    error: parsed.error,
  }
  post({ type: 'result', id: req.id, result })
}

async function handleAnalyze(req: Extract<WorkerRequest, { type: 'analyze' }>) {
  const py = await ensurePyodide(req.id)
  currentId = req.id
  try {
    py.globals.set('__analyze_code__', req.userCode)
    py.globals.set('__analyze_fn__', req.functionName)
    const raw = (await py.runPythonAsync(analyzerSource)) as string
    const features = JSON.parse(raw) as CodeFeatures
    post({ type: 'features', id: req.id, features })
  } catch (err) {
    post({ type: 'features', id: req.id, error: err instanceof Error ? err.message : String(err) })
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  try {
    if (msg.type === 'init') {
      const py = await ensurePyodide(msg.id)
      // Enable cooperative interruption when the main thread shared a buffer.
      if (msg.interruptBuffer) py.setInterruptBuffer(msg.interruptBuffer)
      post({ type: 'ready', id: msg.id })
      return
    }
    if (msg.type === 'run') {
      await handleRun(msg)
      return
    }
    if (msg.type === 'analyze') {
      await handleAnalyze(msg)
      return
    }
  } catch (err) {
    post({ type: 'error', id: msg.id, message: err instanceof Error ? err.message : String(err) })
  }
}
