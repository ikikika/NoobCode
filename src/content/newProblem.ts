/* Shared, isomorphic helpers for scaffolding a new problem.
 *
 * Pure TypeScript with no Node or browser APIs, so the same code backs three
 * call sites and they all emit byte-identical files:
 *   - the CLI (scripts/new-problem.ts),
 *   - the Vite dev-server plugin (vite-plugins/newProblemPlugin.ts),
 *   - the in-app "New problem" form (src/routes/CreateProblemPage.tsx).
 */
import type { Difficulty, ProblemInput } from './schema'

/** Slugs are lowercase letters, digits, and hyphens only. */
export const SLUG_RE = /^[a-z0-9-]+$/

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug)
}

/** "two-sum" -> "Two Sum" */
export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Derive idiomatic function names per language from a slug:
 *   "two-sum" -> python: two_sum, javascript/typescript: twoSum
 */
export function deriveFunctionNames(slug: string): {
  python: string
  javascript: string
  typescript: string
} {
  const python = slug.replace(/-/g, '_')
  const camel = slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
  return { python, javascript: camel, typescript: camel }
}

/** The file path (relative to the repo root) a problem JSON lives at. */
export function problemFilePath(slug: string): string {
  return `src/content/problems/${slug}.json`
}

export interface SkeletonOptions {
  slug: string
  title?: string
  difficulty?: Difficulty
}

/**
 * Build a valid, TODO-filled problem skeleton (all three languages, one
 * solution with one step). The result satisfies problemSchema.
 */
export function buildProblemSkeleton({
  slug,
  title,
  difficulty = 'easy',
}: SkeletonOptions): ProblemInput {
  const resolvedTitle = title?.trim() ? title.trim() : titleFromSlug(slug)
  const fn = deriveFunctionNames(slug)

  const stub = {
    python: `def ${fn.python}(args):\n    pass\n`,
    javascript: `function ${fn.javascript}(args) {\n}\n`,
    typescript: `function ${fn.typescript}(args: unknown): unknown {\n  return null;\n}\n`,
  }

  return {
    slug,
    title: resolvedTitle,
    difficulty,
    tags: [],
    patterns: ['brute-force'],
    description: 'TODO: describe the problem in markdown.',
    constraints: ['TODO'],
    examples: [{ input: 'TODO', output: 'TODO' }],
    functionName: { python: fn.python, javascript: fn.javascript, typescript: fn.typescript },
    starterCode: { ...stub },
    tests: [{ name: 'example 1', args: [], expected: null }],
    solutions: [
      {
        approachName: 'TODO',
        summary: 'TODO',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        technique: {
          primaryPattern: 'brute-force',
          optimal: true,
          signature: {
            maxLoopDepth: 1,
            usesHashStructure: false,
            usesSorting: false,
            usesRecursion: false,
            twoPointer: false,
          },
        },
        steps: [{ title: 'TODO', explanation: 'TODO', code: { ...stub } }],
      },
    ],
  }
}

/** Serialize a problem to the exact on-disk form (pretty JSON + trailing newline). */
export function serializeProblem(problem: ProblemInput): string {
  return JSON.stringify(problem, null, 2) + '\n'
}
