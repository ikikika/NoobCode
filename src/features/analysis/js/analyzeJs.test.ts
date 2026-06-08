import { describe, expect, it } from 'vitest'
import { analyzeJs } from './analyzeJs'

describe('analyzeJs', () => {
  it('reports zero loop depth for straight-line code', () => {
    expect(analyzeJs('function f(a){ return a + 1; }', 'f').maxLoopDepth).toBe(0)
  })

  it('detects a single loop', () => {
    const code = `function f(n){ for (let i=0;i<n.length;i++){ n[i]++; } }`
    expect(analyzeJs(code, 'f').maxLoopDepth).toBe(1)
  })

  it('detects nested loops as depth 2', () => {
    const code = `function f(n){
      for (let i=0;i<n.length;i++){
        for (let j=0;j<n.length;j++){ if (n[i]===n[j]) return true; }
      }
      return false;
    }`
    expect(analyzeJs(code, 'f').maxLoopDepth).toBe(2)
  })

  it('detects Map/Set and object literals as hash structures', () => {
    expect(analyzeJs('function f(){ const m = new Map(); return m; }', 'f').usesHashStructure).toBe(
      true,
    )
    expect(analyzeJs('function f(){ const o = { a: 1 }; return o; }', 'f').usesHashStructure).toBe(
      true,
    )
    expect(analyzeJs('function f(a){ return a + 1; }', 'f').usesHashStructure).toBe(false)
  })

  it('detects sorting', () => {
    expect(analyzeJs('function f(a){ return a.sort((x,y)=>x-y); }', 'f').usesSorting).toBe(true)
  })

  it('detects recursion by the function calling itself', () => {
    const code = `function fact(n){ return n <= 1 ? 1 : n * fact(n - 1); }`
    expect(analyzeJs(code, 'fact').usesRecursion).toBe(true)
    expect(analyzeJs('function f(a){ return a; }', 'f').usesRecursion).toBe(false)
  })

  it('detects the two-pointer shape', () => {
    const code = `function f(a){ let left = 0; let right = a.length - 1; return left + right; }`
    expect(analyzeJs(code, 'f').twoPointerShape).toBe(true)
  })

  it('detects multiple returns as early return', () => {
    const code = `function f(a){ if (a) return 1; return 0; }`
    expect(analyzeJs(code, 'f').earlyReturn).toBe(true)
  })

  it('does not false-trigger on tokens inside strings or comments', () => {
    const code = `function f(a){
      // for (let i=0;i<10;i++) this is a comment
      const note = "for while new Map() .sort()";
      return a + note.length;
    }`
    const features = analyzeJs(code, 'f')
    expect(features.maxLoopDepth).toBe(0)
    expect(features.usesHashStructure).toBe(false)
    expect(features.usesSorting).toBe(false)
  })

  it('returns the all-false baseline on a syntax error', () => {
    const features = analyzeJs('function f({{{', 'f')
    expect(features).toEqual({
      maxLoopDepth: 0,
      usesHashStructure: false,
      usesSorting: false,
      usesRecursion: false,
      twoPointerShape: false,
      earlyReturn: false,
    })
  })
})
