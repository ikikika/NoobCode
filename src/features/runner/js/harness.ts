import { deepEqual } from '../../../lib/deepEqual'
import type { CaseResult, RunResult, ExecSpec } from '../LanguageRunner'
import type { TestCase } from '../../../content/schema'
import { decodeArgs, encodeResult } from '../io'

function structuredCloneSafe<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value)) as T
  }
}

function loadError(start: number, message: string): RunResult {
  return {
    passed: false,
    cases: [],
    stdout: '',
    stderr: '',
    durationMs: performance.now() - start,
    timedOut: false,
    error: message,
  }
}

export function runJsTests(
  userCode: string,
  functionName: string,
  tests: TestCase[],
  spec: ExecSpec = {},
): RunResult {
  const start = performance.now()
  const kind = spec.kind ?? 'function'

  // Evaluate the user's code once and hand back the target symbol (function or
  // class constructor, depending on the problem kind).
  let target: unknown
  try {
    const factory = new Function(
      `"use strict";\n${userCode}\n;return typeof ${functionName} !== 'undefined' ? ${functionName} : undefined;`,
    )
    target = factory()
  } catch (err) {
    return loadError(start, `Error while loading your code: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (typeof target !== 'function') {
    const what = kind === 'design' ? 'class' : 'function'
    return loadError(start, `Could not find a ${what} named '${functionName}'.`)
  }

  const cases: CaseResult[] =
    kind === 'design'
      ? runDesignCases(target as new (...args: unknown[]) => Record<string, (...a: unknown[]) => unknown>, tests)
      : runFunctionCases(target as (...args: unknown[]) => unknown, tests, spec)

  return {
    passed: cases.length > 0 && cases.every((c) => c.passed),
    cases,
    stdout: '',
    stderr: '',
    durationMs: performance.now() - start,
    timedOut: false,
  }
}

function withCapturedLog<T>(run: () => T): { value?: T; error?: string; stdout: string } {
  const originalLog = console.log
  let buffer = ''
  console.log = (...parts: unknown[]) => {
    buffer += parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ') + '\n'
  }
  try {
    return { value: run(), stdout: buffer }
  } catch (err) {
    return { error: err instanceof Error ? `${err.name}: ${err.message}` : String(err), stdout: buffer }
  } finally {
    console.log = originalLog
  }
}

function runFunctionCases(
  fn: (...args: unknown[]) => unknown,
  tests: TestCase[],
  spec: ExecSpec,
): CaseResult[] {
  const cases: CaseResult[] = []
  for (const test of tests) {
    const args = (test.args ?? []) as unknown[]
    const caseStart = performance.now()
    const { value, error, stdout } = withCapturedLog(() => {
      const decoded = decodeArgs(structuredCloneSafe(args), spec.io)
      return encodeResult(fn(...decoded), spec.io?.result)
    })
    cases.push({
      name: test.name,
      passed: error === undefined && deepEqual(value, test.expected),
      input: args,
      expected: test.expected,
      actual: value,
      stdout,
      durationMs: performance.now() - caseStart,
      error,
    })
  }
  return cases
}

function runDesignCases(
  Ctor: new (...args: unknown[]) => Record<string, (...a: unknown[]) => unknown>,
  tests: TestCase[],
): CaseResult[] {
  const cases: CaseResult[] = []
  for (const test of tests) {
    const ops = (test.ops ?? []) as string[]
    const argLists = (test.args ?? []) as unknown[][]
    const caseStart = performance.now()
    const { value, error, stdout } = withCapturedLog(() => {
      const results: unknown[] = []
      let instance: Record<string, (...a: unknown[]) => unknown> | null = null
      for (let i = 0; i < ops.length; i++) {
        const callArgs = structuredCloneSafe(argLists[i] ?? [])
        if (i === 0) {
          instance = new Ctor(...callArgs)
          results.push(null)
        } else {
          const method = instance![ops[i]]
          if (typeof method !== 'function') {
            throw new Error(`Class has no method named '${ops[i]}'`)
          }
          const r = method.apply(instance, callArgs)
          results.push(r === undefined ? null : r)
        }
      }
      return results
    })
    cases.push({
      name: test.name,
      passed: error === undefined && deepEqual(value, test.expected),
      input: [ops, argLists],
      expected: test.expected,
      actual: value,
      stdout,
      durationMs: performance.now() - caseStart,
      error,
    })
  }
  return cases
}
