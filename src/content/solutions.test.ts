import { describe, expect, it } from 'vitest'
import { builtinProblems } from './index'
import { runJsTests } from '../features/runner/js/harness'
import { transpileTs } from '../features/runner/ts/transpileTs'
import type { ExecSpec } from '../features/runner/LanguageRunner'

// Correctness gate: every problem's REFERENCE solution must actually pass its own
// tests — not merely be shape-valid (that's what `validate:content` / the Zod
// schema covers). Each `solutions[]` entry is an incremental walkthrough, so the
// FINAL step holds the complete solution; we run it against the full test set
// (including hidden cases). This catches a reference solution that's wrong or has
// drifted away from its tests before it can ship.
//
// Scope: JavaScript and TypeScript only, because both run through the pure,
// Node-runnable `runJsTests` harness (TS via sucrase erasure). Python reference
// solutions need Pyodide (browser-only) and are exercised by the Playwright E2E
// suite instead; a Pyodide-in-Node gate is a possible future extension.

const problems = Object.values(builtinProblems)

function finalStepCode(steps: { code: { javascript: string; typescript: string } }[]) {
  return steps[steps.length - 1].code
}

describe('reference solutions pass their own tests', () => {
  it('has problems to check', () => {
    expect(problems.length).toBeGreaterThan(0)
  })

  for (const problem of problems) {
    const spec: ExecSpec = { kind: problem.kind, io: problem.io }

    problem.solutions.forEach((solution, i) => {
      const label = `${problem.slug} › solution[${i}] "${solution.approachName}"`
      const code = finalStepCode(solution.steps)

      it(`${label} — JavaScript`, () => {
        const result = runJsTests(code.javascript, problem.functionName.javascript, problem.tests, spec)
        const failed = result.cases.filter((c) => !c.passed).map((c) => c.name)
        expect(result.error, `${label} JS load error: ${result.error}`).toBeUndefined()
        expect(result.passed, `${label} failing JS cases: ${failed.join(', ')}`).toBe(true)
      })

      it(`${label} — TypeScript`, () => {
        const js = transpileTs(code.typescript)
        const result = runJsTests(js, problem.functionName.typescript, problem.tests, spec)
        const failed = result.cases.filter((c) => !c.passed).map((c) => c.name)
        expect(result.error, `${label} TS load error: ${result.error}`).toBeUndefined()
        expect(result.passed, `${label} failing TS cases: ${failed.join(', ')}`).toBe(true)
      })
    })
  }
})
