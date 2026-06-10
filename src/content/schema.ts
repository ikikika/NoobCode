import { z } from 'zod'
import { PATTERNS } from './patterns'

export const languageIdSchema = z.enum(['python', 'javascript', 'typescript'])
export type LanguageId = z.infer<typeof languageIdSchema>

export const langCodeSchema = z.object({
  python: z.string(),
  javascript: z.string(),
  typescript: z.string(),
})
export type LangCode = z.infer<typeof langCodeSchema>

// How a single argument or the return value is encoded in the JSON tests.
// 'json' (default) is passed through untouched; 'tree' and 'list' are written as
// arrays in the JSON and decoded into binary-tree / linked-list structures by the
// runner before the user's function sees them (and the result is re-encoded back
// to an array for comparison). See src/features/runner/io.ts.
export const ioKindSchema = z.enum(['json', 'tree', 'list'])
export type IoKind = z.infer<typeof ioKindSchema>

export const testCaseSchema = z.object({
  name: z.string(),
  args: z.array(z.unknown()),
  expected: z.unknown(),
  hidden: z.boolean().default(false),
  // Design problems only: the parallel sequence of method names to invoke. When
  // present, `args` is an array of per-call argument lists and `expected` is the
  // array of per-call results (first entry is the constructor → null).
  ops: z.array(z.string()).optional(),
})
export type TestCase = z.infer<typeof testCaseSchema>

export const exampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional(),
})
export type Example = z.infer<typeof exampleSchema>

export const solutionStepSchema = z.object({
  title: z.string().optional(),
  explanation: z.string(),
  code: langCodeSchema,
})
export type SolutionStep = z.infer<typeof solutionStepSchema>

// IMPORTANT: pattern + technique schemas MUST precede solutionSchema.
export const patternIdSchema = z.enum(PATTERNS)

export const techniqueSignatureSchema = z.object({
  maxLoopDepth: z.number().int().min(0),
  usesHashStructure: z.boolean(),
  usesSorting: z.boolean(),
  usesRecursion: z.boolean(),
  twoPointer: z.boolean(),
})
export type TechniqueSignature = z.infer<typeof techniqueSignatureSchema>

export const techniqueSchema = z.object({
  primaryPattern: patternIdSchema,
  optimal: z.boolean(),
  signature: techniqueSignatureSchema,
})
export type Technique = z.infer<typeof techniqueSchema>

export const solutionSchema = z.object({
  approachName: z.string(),
  summary: z.string().optional(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  technique: techniqueSchema.optional(),
  steps: z.array(solutionStepSchema).min(1),
})
export type Solution = z.infer<typeof solutionSchema>

export const problemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
  patterns: z.array(patternIdSchema).min(1),
  description: z.string(),
  constraints: z.array(z.string()),
  examples: z.array(exampleSchema),
  // 'function' (default): the runner calls functionName(...args). 'design': the
  // runner instantiates the class named by functionName and replays each test's
  // `ops` against it (LeetCode-style design problems, e.g. Min Stack, LRU Cache).
  kind: z.enum(['function', 'design']).default('function'),
  // Optional structured-I/O codec. `args[i]` decodes the i-th argument; `result`
  // encodes the return value. Omitted entries default to 'json'.
  io: z
    .object({
      args: z.array(ioKindSchema).optional(),
      result: ioKindSchema.optional(),
    })
    .optional(),
  functionName: z.object({
    python: z.string(),
    javascript: z.string(),
    typescript: z.string(),
  }),
  starterCode: langCodeSchema,
  tests: z.array(testCaseSchema).min(1),
  solutions: z.array(solutionSchema).min(1),
})

export type Problem = z.infer<typeof problemSchema>
// Input type accepts optional `hidden` (defaulted) on test cases.
export type ProblemInput = z.input<typeof problemSchema>
export type Difficulty = Problem['difficulty']

export type ProblemMeta = Pick<Problem, 'slug' | 'title' | 'difficulty' | 'tags' | 'patterns'>

export const LANGUAGE_LABELS: Record<LanguageId, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
}

export const MONACO_LANGUAGE: Record<LanguageId, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
}
