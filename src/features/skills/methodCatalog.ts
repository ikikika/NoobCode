import type { LanguageId } from '../../content/schema'
import type { AttemptRecord } from '../analysis/types'

export interface MethodEntry {
  /** Display name, e.g. ".items()" or "Object.keys(o)". */
  name: string
  /** One-line description of what it does. */
  description: string
  /** Substring searched in submitted code to detect prior use, e.g. ".items(". */
  detect: string
}

export interface StructureGroup {
  id: string
  label: string
  methods: MethodEntry[]
}

const pythonGroups: StructureGroup[] = [
  {
    id: 'list',
    label: 'List',
    methods: [
      { name: '.append(x)', description: 'Add an item to the end.', detect: '.append(' },
      { name: '.pop([i])', description: 'Remove and return an item (last by default).', detect: '.pop(' },
      { name: '.insert(i, x)', description: 'Insert x before index i.', detect: '.insert(' },
      { name: '.sort()', description: 'Sort the list in place.', detect: '.sort(' },
      { name: '.reverse()', description: 'Reverse the list in place.', detect: '.reverse(' },
      { name: '.index(x)', description: 'First index of x (raises if absent).', detect: '.index(' },
      { name: '.count(x)', description: 'Number of occurrences of x.', detect: '.count(' },
      { name: 'len(seq)', description: 'Number of items.', detect: 'len(' },
      { name: 'sorted(seq)', description: 'Return a new sorted list.', detect: 'sorted(' },
    ],
  },
  {
    id: 'dict',
    label: 'Dictionary',
    methods: [
      { name: '.items()', description: 'Iterate key/value pairs.', detect: '.items(' },
      { name: '.keys()', description: 'View of the keys.', detect: '.keys(' },
      { name: '.values()', description: 'View of the values.', detect: '.values(' },
      { name: '.get(k, default)', description: 'Value for key, or default if missing.', detect: '.get(' },
      { name: '.pop(k)', description: 'Remove key and return its value.', detect: '.pop(' },
      { name: '.setdefault(k, d)', description: 'Get key, inserting default if absent.', detect: '.setdefault(' },
      { name: '.update(other)', description: 'Merge another mapping in.', detect: '.update(' },
    ],
  },
  {
    id: 'set',
    label: 'Set',
    methods: [
      { name: '.add(x)', description: 'Add an element.', detect: '.add(' },
      { name: '.remove(x)', description: 'Remove x (raises if absent).', detect: '.remove(' },
      { name: '.discard(x)', description: 'Remove x if present (no error).', detect: '.discard(' },
      { name: '.union(other)', description: 'Elements in either set.', detect: '.union(' },
      { name: '.intersection(other)', description: 'Elements in both sets.', detect: '.intersection(' },
      { name: '.difference(other)', description: 'Elements only in this set.', detect: '.difference(' },
    ],
  },
  {
    id: 'string',
    label: 'String',
    methods: [
      { name: '.split(sep)', description: 'Split into a list of parts.', detect: '.split(' },
      { name: '.join(iter)', description: 'Join an iterable of strings.', detect: '.join(' },
      { name: '.strip()', description: 'Trim leading/trailing whitespace.', detect: '.strip(' },
      { name: '.lower()', description: 'Lowercase copy.', detect: '.lower(' },
      { name: '.upper()', description: 'Uppercase copy.', detect: '.upper(' },
      { name: '.replace(a, b)', description: 'Replace occurrences of a with b.', detect: '.replace(' },
      { name: '.find(sub)', description: 'Index of substring, or -1.', detect: '.find(' },
      { name: '.isalnum()', description: 'True if all characters are alphanumeric.', detect: '.isalnum(' },
    ],
  },
  {
    id: 'tuple',
    label: 'Tuple',
    methods: [
      { name: '.count(x)', description: 'Number of occurrences of x.', detect: '.count(' },
      { name: '.index(x)', description: 'First index of x.', detect: '.index(' },
      { name: 'len(t)', description: 'Number of items.', detect: 'len(' },
      { name: 'a, b = t', description: 'Unpack into variables.', detect: ' = ' },
    ],
  },
  {
    id: 'deque',
    label: 'Deque (collections)',
    methods: [
      { name: 'deque(iterable)', description: 'Create a double-ended queue.', detect: 'deque(' },
      { name: '.appendleft(x)', description: 'Add to the front (O(1)).', detect: '.appendleft(' },
      { name: '.popleft()', description: 'Remove from the front (O(1)).', detect: '.popleft(' },
      { name: '.append(x)', description: 'Add to the back.', detect: '.append(' },
      { name: '.rotate(n)', description: 'Rotate elements by n steps.', detect: '.rotate(' },
    ],
  },
  {
    id: 'heap',
    label: 'Heap (heapq)',
    methods: [
      { name: 'heappush(h, x)', description: 'Push x onto the heap.', detect: 'heappush(' },
      { name: 'heappop(h)', description: 'Pop the smallest item.', detect: 'heappop(' },
      { name: 'heapify(x)', description: 'Turn a list into a heap in place.', detect: 'heapify(' },
      { name: 'heappushpop(h, x)', description: 'Push then pop in one step.', detect: 'heappushpop(' },
      { name: 'nsmallest(n, it)', description: 'The n smallest elements.', detect: 'nsmallest(' },
      { name: 'nlargest(n, it)', description: 'The n largest elements.', detect: 'nlargest(' },
    ],
  },
]

const javascriptGroups: StructureGroup[] = [
  {
    id: 'array',
    label: 'Array',
    methods: [
      { name: '.push(x)', description: 'Add to the end.', detect: '.push(' },
      { name: '.pop()', description: 'Remove from the end.', detect: '.pop(' },
      { name: '.shift()', description: 'Remove from the front.', detect: '.shift(' },
      { name: '.unshift(x)', description: 'Add to the front.', detect: '.unshift(' },
      { name: '.map(fn)', description: 'Transform each element.', detect: '.map(' },
      { name: '.filter(fn)', description: 'Keep elements that match.', detect: '.filter(' },
      { name: '.reduce(fn, init)', description: 'Fold into a single value.', detect: '.reduce(' },
      { name: '.slice(a, b)', description: 'Copy a subarray.', detect: '.slice(' },
      { name: '.sort(cmp)', description: 'Sort in place (provide a comparator!).', detect: '.sort(' },
      { name: '.indexOf(x)', description: 'First index of x, or -1.', detect: '.indexOf(' },
      { name: '.includes(x)', description: 'Whether x is present.', detect: '.includes(' },
    ],
  },
  {
    id: 'object',
    label: 'Object',
    methods: [
      { name: 'Object.keys(o)', description: 'Array of own keys.', detect: 'Object.keys(' },
      { name: 'Object.values(o)', description: 'Array of own values.', detect: 'Object.values(' },
      { name: 'Object.entries(o)', description: 'Array of [key, value] pairs.', detect: 'Object.entries(' },
      { name: 'k in o', description: 'Whether a key exists.', detect: ' in ' },
      { name: 'Object.assign(t, s)', description: 'Copy properties into target.', detect: 'Object.assign(' },
      { name: 'Object.freeze(o)', description: 'Make the object immutable.', detect: 'Object.freeze(' },
    ],
  },
  {
    id: 'map',
    label: 'Map',
    methods: [
      { name: '.set(k, v)', description: 'Set a key/value entry.', detect: '.set(' },
      { name: '.get(k)', description: 'Value for a key.', detect: '.get(' },
      { name: '.has(k)', description: 'Whether a key exists.', detect: '.has(' },
      { name: '.delete(k)', description: 'Remove a key.', detect: '.delete(' },
      { name: '.keys()', description: 'Iterator over keys.', detect: '.keys(' },
      { name: '.values()', description: 'Iterator over values.', detect: '.values(' },
      { name: '.entries()', description: 'Iterator over [key, value].', detect: '.entries(' },
    ],
  },
  {
    id: 'set',
    label: 'Set',
    methods: [
      { name: '.add(x)', description: 'Add an element.', detect: '.add(' },
      { name: '.has(x)', description: 'Whether x is present.', detect: '.has(' },
      { name: '.delete(x)', description: 'Remove an element.', detect: '.delete(' },
      { name: '.forEach(fn)', description: 'Run fn for each element.', detect: '.forEach(' },
    ],
  },
  {
    id: 'string',
    label: 'String',
    methods: [
      { name: '.split(sep)', description: 'Split into an array.', detect: '.split(' },
      { name: '.slice(a, b)', description: 'Extract a substring.', detect: '.slice(' },
      { name: '.toLowerCase()', description: 'Lowercase copy.', detect: '.toLowerCase(' },
      { name: '.toUpperCase()', description: 'Uppercase copy.', detect: '.toUpperCase(' },
      { name: '.replace(a, b)', description: 'Replace matches of a with b.', detect: '.replace(' },
      { name: '.indexOf(sub)', description: 'Index of a substring, or -1.', detect: '.indexOf(' },
      { name: '.includes(sub)', description: 'Whether a substring is present.', detect: '.includes(' },
      { name: '.trim()', description: 'Trim surrounding whitespace.', detect: '.trim(' },
      { name: '.charAt(i)', description: 'Character at an index.', detect: '.charAt(' },
    ],
  },
  {
    id: 'typed-array',
    label: 'Typed Array',
    methods: [
      { name: 'new Int32Array(n)', description: 'Fixed-length array of 32-bit ints.', detect: 'Int32Array(' },
      { name: 'new Uint8Array(n)', description: 'Fixed-length array of bytes.', detect: 'Uint8Array(' },
      { name: 'new Float64Array(n)', description: 'Fixed-length array of doubles.', detect: 'Float64Array(' },
      { name: '.fill(v)', description: 'Fill with a value.', detect: '.fill(' },
      { name: '.set(arr)', description: 'Copy values from another array.', detect: '.set(' },
      { name: '.subarray(a, b)', description: 'A view over part of the buffer.', detect: '.subarray(' },
    ],
  },
]

/** Methods grouped by data structure, per language. TypeScript mirrors JavaScript. */
export const METHOD_REFERENCE: Record<LanguageId, StructureGroup[]> = {
  python: pythonGroups,
  javascript: javascriptGroups,
  typescript: javascriptGroups,
}

/** Join the source of every past submission in a language into one searchable string. */
export function buildCorpus(attempts: AttemptRecord[], language: LanguageId): string {
  return attempts
    .filter((a) => a.language === language && typeof a.code === 'string')
    .map((a) => a.code)
    .join('\n')
}

/** Whether a method's detection token appears anywhere in the corpus. */
export function isMethodUsed(corpus: string, method: MethodEntry): boolean {
  return corpus.includes(method.detect)
}
