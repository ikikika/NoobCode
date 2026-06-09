import type { IoKind, LanguageId, TestCase } from '../../content/schema'

// Execution shape for a problem: how to invoke the user's code and how to
// encode/decode structured arguments and results. Defaults to a plain function
// call with JSON-passthrough I/O, which matches the bulk of problems.
export interface ExecSpec {
  kind?: 'function' | 'design'
  io?: { args?: (IoKind | undefined)[]; result?: IoKind }
}

export interface RunOptions extends ExecSpec {
  userCode: string
  functionName: string
  tests: TestCase[]
  timeoutMs?: number
}

export interface CaseResult {
  name: string
  passed: boolean
  input: unknown[]
  expected: unknown
  actual: unknown
  stdout: string
  durationMs: number
  error?: string
}

export interface RunResult {
  passed: boolean
  cases: CaseResult[]
  stdout: string
  stderr: string
  durationMs: number
  timedOut: boolean
  error?: string
}

export interface LanguageRunner {
  language: LanguageId
  init(onProgress?: (msg: string) => void): Promise<void>
  run(opts: RunOptions): Promise<RunResult>
  interrupt(): void
  dispose(): void
}
