import { describe, it, expect } from 'vitest'
import {
  buildTree,
  serializeTree,
  buildList,
  serializeList,
  decodeArgs,
  encodeResult,
} from './io'

describe('tree codec', () => {
  it('builds a tree from a level-order array', () => {
    const root = buildTree([3, 9, 20, null, null, 15, 7])
    expect(root?.val).toBe(3)
    expect(root?.left?.val).toBe(9)
    expect(root?.right?.val).toBe(20)
    expect(root?.right?.left?.val).toBe(15)
    expect(root?.left?.left).toBeNull()
  })

  it('round-trips through serialize (trailing nulls trimmed)', () => {
    expect(serializeTree(buildTree([1, 2, 3, null, null, 4, 5]))).toEqual([1, 2, 3, null, null, 4, 5])
    expect(serializeTree(buildTree([1, null, 2]))).toEqual([1, null, 2])
  })

  it('handles the empty tree', () => {
    expect(buildTree([])).toBeNull()
    expect(serializeTree(null)).toEqual([])
  })
})

describe('list codec', () => {
  it('builds and serializes a linked list', () => {
    const head = buildList([2, 4, 3])
    expect(head?.val).toBe(2)
    expect(head?.next?.next?.val).toBe(3)
    expect(serializeList(head)).toEqual([2, 4, 3])
  })

  it('handles the empty list', () => {
    expect(buildList([])).toBeNull()
    expect(serializeList(null)).toEqual([])
  })
})

describe('decodeArgs / encodeResult', () => {
  it('passes json through untouched', () => {
    expect(decodeArgs([[1, 2], 3], undefined)).toEqual([[1, 2], 3])
    expect(encodeResult(42, undefined)).toBe(42)
    expect(encodeResult([1, 2], 'json')).toEqual([1, 2])
  })

  it('decodes only the positions named by the spec', () => {
    const [tree, k] = decodeArgs([[1, 2, 3], 2], { args: ['tree', 'json'] })
    expect((tree as { val: number }).val).toBe(1)
    expect(k).toBe(2)
  })

  it('encodes a returned list back to an array', () => {
    expect(encodeResult(buildList([5, 6]), 'list')).toEqual([5, 6])
  })
})
