import { problemSchema, type Problem, type ProblemMeta } from './schema'

// Auto-discover built-in problems: dropping a <slug>.json file into ./problems
// registers it — no manual registry to maintain. Eagerly imported because the
// payload is small JSON data (the heavy chunks, Monaco/Pyodide, load lazily).
const modules = import.meta.glob<unknown>('./problems/*.json', {
  eager: true,
  import: 'default',
})

export const builtinProblems: Record<string, Problem> = {}

for (const [path, data] of Object.entries(modules)) {
  const result = problemSchema.safeParse(data)
  if (!result.success) {
    // Keep the app running even if one file is malformed; CI's validate:content
    // is the gate that fails the build.
    console.error(`Invalid built-in problem ${path}:`, result.error.message)
    continue
  }
  builtinProblems[result.data.slug] = result.data
}

export const builtinMeta: ProblemMeta[] = Object.values(builtinProblems)
  .map((p) => ({
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    tags: p.tags,
    patterns: p.patterns,
  }))
  .sort((a, b) => a.title.localeCompare(b.title))

export const builtinSlugs: string[] = Object.keys(builtinProblems)
