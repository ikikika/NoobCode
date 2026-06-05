import type { ProblemMeta } from './schema'

// Lazy dynamic imports — one per slug. Enables per-problem code splitting.
export const problemRegistry: Record<string, () => Promise<{ default: unknown }>> = {
  'two-sum': () => import('./problems/two-sum/index'),
  'valid-parentheses': () => import('./problems/valid-parentheses/index'),
  'contains-duplicate': () => import('./problems/contains-duplicate/index'),
}

// Lightweight metadata for the list/skills pages (no heavy code payload).
export const problemsMeta: ProblemMeta[] = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-map'],
    patterns: ['brute-force', 'hash-map'],
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    tags: ['string', 'stack'],
    patterns: ['stack'],
  },
  {
    slug: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'easy',
    tags: ['array', 'hash-set', 'sorting'],
    patterns: ['hash-set', 'sorting'],
  },
]

export const allSlugs: string[] = Object.keys(problemRegistry)
