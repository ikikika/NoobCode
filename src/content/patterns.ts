export const PATTERNS = [
  'hash-map',
  'hash-set',
  'two-pointers',
  'sliding-window',
  'stack',
  'queue',
  'binary-search',
  'recursion',
  'dynamic-programming',
  'backtracking',
  'depth-first-search',
  'breadth-first-search',
  'greedy',
  'sorting',
  'divide-and-conquer',
  'brute-force',
] as const

export type PatternId = (typeof PATTERNS)[number]

export const PATTERN_LABELS: Record<PatternId, string> = {
  'hash-map': 'Hash Map',
  'hash-set': 'Hash Set',
  'two-pointers': 'Two Pointers',
  'sliding-window': 'Sliding Window',
  stack: 'Stack',
  queue: 'Queue',
  'binary-search': 'Binary Search',
  recursion: 'Recursion',
  'dynamic-programming': 'Dynamic Programming',
  backtracking: 'Backtracking',
  'depth-first-search': 'Depth-First Search',
  'breadth-first-search': 'Breadth-First Search',
  greedy: 'Greedy',
  sorting: 'Sorting',
  'divide-and-conquer': 'Divide and Conquer',
  'brute-force': 'Brute Force',
}
