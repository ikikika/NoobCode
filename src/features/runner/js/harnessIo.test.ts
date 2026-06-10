import { describe, it, expect } from 'vitest'
import { runJsTests } from './harness'
import type { TestCase } from '../../../content/schema'

// Integration tests for the structured-I/O and design execution paths through
// the real JS harness (the same code the worker runs).

describe('runJsTests — tree I/O', () => {
  it('decodes a tree argument and runs the solution', () => {
    const code = `function maxDepth(root){ if(!root) return 0; return 1 + Math.max(maxDepth(root.left), maxDepth(root.right)); }`
    const tests: TestCase[] = [
      { name: 'balanced', args: [[3, 9, 20, null, null, 15, 7]], expected: 3, hidden: false },
      { name: 'empty', args: [[]], expected: 0, hidden: false },
    ]
    const res = runJsTests(code, 'maxDepth', tests, { io: { args: ['tree'] } })
    expect(res.passed).toBe(true)
  })

  it('encodes a returned tree back to an array', () => {
    const code = `function invertTree(root){ if(!root) return null; const t=root.left; root.left=invertTree(root.right); root.right=invertTree(t); return root; }`
    const tests: TestCase[] = [
      { name: 'invert', args: [[1, 2, 3]], expected: [1, 3, 2], hidden: false },
    ]
    const res = runJsTests(code, 'invertTree', tests, { io: { args: ['tree'], result: 'tree' } })
    expect(res.passed).toBe(true)
  })
})

describe('runJsTests — list I/O', () => {
  it('decodes and re-encodes a linked list', () => {
    const code = `function reverseList(head){ let prev=null; while(head){ const n=head.next; head.next=prev; prev=head; head=n; } return prev; }`
    const tests: TestCase[] = [
      { name: 'reverse', args: [[1, 2, 3]], expected: [3, 2, 1], hidden: false },
    ]
    const res = runJsTests(code, 'reverseList', tests, { io: { args: ['list'], result: 'list' } })
    expect(res.passed).toBe(true)
  })
})

describe('runJsTests — design mode', () => {
  it('replays an operation sequence against a class instance', () => {
    const code = `class Counter { constructor(){ this.n = 0; } inc(){ this.n++; } get(){ return this.n; } }`
    const tests: TestCase[] = [
      {
        name: 'sequence',
        ops: ['Counter', 'inc', 'inc', 'get'],
        args: [[], [], [], []],
        expected: [null, null, null, 2],
        hidden: false,
      },
    ]
    const res = runJsTests(code, 'Counter', tests, { kind: 'design' })
    expect(res.passed).toBe(true)
    expect(res.cases[0].actual).toEqual([null, null, null, 2])
  })

  it('reports a clear error when the class is missing', () => {
    const res = runJsTests('const x = 1;', 'Missing', [], { kind: 'design' })
    expect(res.error).toContain("class named 'Missing'")
  })
})
