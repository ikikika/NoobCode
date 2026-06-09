import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import type { CodeFeatures } from '../types'

// Runs the real production analyzer.py (the same source the Pyodide worker
// executes) through the system python3, so the Python feature detection is
// covered like the JS analyzer is. Skips cleanly where python3 is unavailable.

function hasPython3(): boolean {
  try {
    execFileSync('python3', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const analyzerSource = readFileSync(resolve('src/features/analysis/python/analyzer.py'), 'utf8')

function analyze(code: string, fn: string): CodeFeatures {
  const wrapper =
    `__analyze_code__ = ${JSON.stringify(code)}\n` +
    `__analyze_fn__ = ${JSON.stringify(fn)}\n` +
    analyzerSource +
    `\nprint(__result)\n`
  const out = execFileSync('python3', ['-c', wrapper], { encoding: 'utf8' })
  return JSON.parse(out) as CodeFeatures
}

describe.skipIf(!hasPython3())('python analyzer.py', () => {
  it('detects nested loops and no hash use (brute force)', () => {
    const code = [
      'def two_sum(nums, target):',
      '    for i in range(len(nums)):',
      '        for j in range(i + 1, len(nums)):',
      '            if nums[i] + nums[j] == target:',
      '                return [i, j]',
      '    return []',
    ].join('\n')
    const f = analyze(code, 'two_sum')
    expect(f.maxLoopDepth).toBe(2)
    expect(f.usesHashStructure).toBe(false)
  })

  it('detects a dict and a single loop (hash map)', () => {
    const code = [
      'def two_sum(nums, target):',
      '    seen = {}',
      '    for i, n in enumerate(nums):',
      '        if target - n in seen:',
      '            return [seen[target - n], i]',
      '        seen[n] = i',
      '    return []',
    ].join('\n')
    const f = analyze(code, 'two_sum')
    expect(f.maxLoopDepth).toBe(1)
    expect(f.usesHashStructure).toBe(true)
  })

  it('detects recursion and sorting', () => {
    const code = [
      'def solve(nums):',
      '    nums = sorted(nums)',
      '    if len(nums) <= 1:',
      '        return nums',
      '    return solve(nums[1:])',
    ].join('\n')
    const f = analyze(code, 'solve')
    expect(f.usesRecursion).toBe(true)
    expect(f.usesSorting).toBe(true)
  })

  it('detects the two-pointer shape', () => {
    const code = [
      'def check(s):',
      '    left = 0',
      '    right = len(s) - 1',
      '    while left < right:',
      '        left += 1',
      '        right -= 1',
      '    return True',
    ].join('\n')
    const f = analyze(code, 'check')
    expect(f.twoPointerShape).toBe(true)
  })

  it('returns a safe baseline on a syntax error', () => {
    const f = analyze('def broken(:', 'broken')
    expect(f.maxLoopDepth).toBe(0)
    expect(f.usesRecursion).toBe(false)
  })
})
