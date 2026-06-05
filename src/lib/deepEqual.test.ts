import { describe, expect, it } from 'vitest'
import { deepEqual } from './deepEqual'

describe('deepEqual', () => {
  it('compares primitives', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  it('compares nested arrays', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true)
    expect(deepEqual([0, 1], [1, 0])).toBe(false)
  })

  it('compares plain objects regardless of key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('treats arrays of different lengths as unequal', () => {
    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false)
  })

  it('handles NaN and mismatched types', () => {
    expect(deepEqual(NaN, NaN)).toBe(true)
    expect(deepEqual(1, '1')).toBe(false)
    expect(deepEqual([1], { 0: 1 })).toBe(false)
  })
})
