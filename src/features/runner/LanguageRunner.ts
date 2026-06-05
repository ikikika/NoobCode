import type { LanguageId, TestCase } from '../../content/schema'

export interface RunOptions {
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
