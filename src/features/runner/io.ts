import type { IoKind } from '../../content/schema'

// Structured-I/O codec shared by the JS/TS harness. Problems declare per-argument
// and return `IoKind`s; tests still store plain arrays in JSON, and these helpers
// convert them to/from binary-tree and linked-list objects so user solutions can
// work with `root.left` / `head.next` directly. The Python harness mirrors this
// logic in harness.py.

export interface TreeNodeLike {
  val: unknown
  left: TreeNodeLike | null
  right: TreeNodeLike | null
}

export interface ListNodeLike {
  val: unknown
  next: ListNodeLike | null
}

/** Level-order array (with `null` for missing children) → binary tree. */
export function buildTree(arr: unknown): TreeNodeLike | null {
  if (!Array.isArray(arr) || arr.length === 0 || arr[0] === null || arr[0] === undefined) {
    return null
  }
  const root: TreeNodeLike = { val: arr[0], left: null, right: null }
  const queue: TreeNodeLike[] = [root]
  let i = 1
  while (i < arr.length && queue.length > 0) {
    const node = queue.shift() as TreeNodeLike
    if (i < arr.length) {
      const lv = arr[i++]
      if (lv !== null && lv !== undefined) {
        node.left = { val: lv, left: null, right: null }
        queue.push(node.left)
      }
    }
    if (i < arr.length) {
      const rv = arr[i++]
      if (rv !== null && rv !== undefined) {
        node.right = { val: rv, left: null, right: null }
        queue.push(node.right)
      }
    }
  }
  return root
}

/** Binary tree → level-order array, trailing nulls trimmed (LeetCode format). */
export function serializeTree(root: unknown): unknown[] {
  const node = root as TreeNodeLike | null
  if (!node) return []
  const out: unknown[] = []
  const queue: (TreeNodeLike | null)[] = [node]
  while (queue.length > 0) {
    const cur = queue.shift() as TreeNodeLike | null
    if (cur) {
      out.push(cur.val)
      queue.push(cur.left)
      queue.push(cur.right)
    } else {
      out.push(null)
    }
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop()
  return out
}

/** Array → singly linked list. */
export function buildList(arr: unknown): ListNodeLike | null {
  if (!Array.isArray(arr) || arr.length === 0) return null
  const dummy: ListNodeLike = { val: 0, next: null }
  let tail = dummy
  for (const v of arr) {
    tail.next = { val: v, next: null }
    tail = tail.next
  }
  return dummy.next
}

/** Singly linked list → array. */
export function serializeList(head: unknown): unknown[] {
  const out: unknown[] = []
  let node = head as ListNodeLike | null
  const seen = new Set<ListNodeLike>()
  while (node) {
    if (seen.has(node)) break // guard against accidental cycles
    seen.add(node)
    out.push(node.val)
    node = node.next
  }
  return out
}

export function decodeArg(value: unknown, kind: IoKind | undefined): unknown {
  if (kind === 'tree') return buildTree(value)
  if (kind === 'list') return buildList(value)
  return value
}

export function encodeResult(value: unknown, kind: IoKind | undefined): unknown {
  if (kind === 'tree') return serializeTree(value)
  if (kind === 'list') return serializeList(value)
  return value
}

export interface IoSpec {
  args?: (IoKind | undefined)[]
  result?: IoKind
}

/** Decode a full argument list against a per-position codec spec. */
export function decodeArgs(args: unknown[], io: IoSpec | undefined): unknown[] {
  if (!io || !io.args) return args
  return args.map((a, i) => decodeArg(a, io.args?.[i]))
}
