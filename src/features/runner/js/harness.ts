import { deepEqual } from '../../../lib/deepEqual'
import type { CaseResult, RunResult } from '../LanguageRunner'
import type { TestCase } from '../../../content/schema'

export function runJsTests(userCode: string, functionName: string, tests: TestCase[]): RunResult {
  const start = performance.now()
  const cases: CaseResult[] = []

  let fn: ((...args: unknown[]) => unknown) | undefined
  try {
    // Evaluate the user's code and hand back the target function.
    const factory = new Function(
      `"use strict";\n${userCode}\n;return typeof ${functionName} === 'function' ? ${functionName} : undefined;`,
    )
    fn = factory() as ((...args: unknown[]) => unknown) | undefined
  } catch (err) {
    return {
      passed: false,
      cases: [],
      stdout: '',
      stderr: '',
      durationMs: performance.now() - start,
      timedOut: false,
      error: `Error while loading your code: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  if (typeof fn !== 'function') {
    return {
      passed: false,
      cases: [],
      stdout: '',
      stderr: '',
      durationMs: performance.now() - start,
      timedOut: false,
      error: `Could not find a function named '${functionName}'.`,
    }
  }

  const originalLog = console.log
  for (const test of tests) {
    const args = (test.args ?? []) as unknown[]
    let buffer = ''
    console.log = (...parts: unknown[]) => {
      buffer += parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ') + '\n'
    }
    const caseStart = performance.now()
    let actual: unknown = undefined
    let error: string | undefined
    let passed = false
    try {
      // Clone args so user mutation cannot leak between cases.
      actual = fn(...structuredCloneSafe(args))
      passed = deepEqual(actual, test.expected)
    } catch (err) {
      error = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    } finally {
      console.log = originalLog
    }
    cases.push({
      name: test.name,
      passed,
      input: args,
      expected: test.expected,
      actual,
      stdout: buffer,
      durationMs: performance.now() - caseStart,
      error,
    })
  }

  return {
    passed: cases.length > 0 && cases.every((c) => c.passed),
    cases,
    stdout: '',
    stderr: '',
    durationMs: performance.now() - start,
    timedOut: false,
  }
}

function structuredCloneSafe<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value)) as T
  }
}
