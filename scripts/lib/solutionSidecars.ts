/**
 * Authoring helpers for solution-step sidecars.
 *
 * Layout (next to `<slug>.json`):
 *
 *   src/content/problems/<slug>/
 *     solutions/
 *       00-<approach-slug>/
 *         typescript/
 *           01-<step-slug>.ts
 *           01-<step-slug>.md   # YAML frontmatter title + explanation body
 *         javascript/
 *           01-<step-slug>.js
 *           01-<step-slug>.md
 *         python/
 *           01-<step-slug>.py
 *           01-<step-slug>.md
 *
 * The JSON file remains what the app loads. Sidecars are for editing real
 * multiline code; `pack` writes steps back into the JSON.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'
import {
  problemSchema,
  type LanguageId,
  type ProblemInput,
  type SolutionStep,
  type StepsByLanguage,
} from '../../src/content/schema'

export const PROBLEMS_DIR = resolve('src/content/problems')

export const LANG_EXT: Record<LanguageId, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
}

const LANGS: LanguageId[] = ['python', 'javascript', 'typescript']

export type SidecarPaths = {
  problemsDir: string
  json: string
  root: string
  solutions: string
}

export function sidecarPaths(slug: string, problemsDir: string = PROBLEMS_DIR): SidecarPaths {
  const root = join(problemsDir, slug)
  return {
    problemsDir,
    json: join(problemsDir, `${slug}.json`),
    root,
    solutions: join(root, 'solutions'),
  }
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || 'step'
}

export function humanizeSlug(slug: string): string {
  const words = slug.split('-').filter(Boolean)
  if (words.length === 0) return 'Step'
  return words.map((w, i) => (i === 0 ? w[0]!.toUpperCase() + w.slice(1) : w)).join(' ')
}

export function padIndex(n: number): string {
  return String(n).padStart(2, '0')
}

export function parseStepMeta(md: string): { title?: string; explanation: string } {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { explanation: md.replace(/\s+$/, '') }

  const yaml = match[1]!
  const body = match[2]!.replace(/^\s+|\s+$/g, '')
  const titleLine = yaml.match(/^title:\s*(.*)$/m)?.[1]?.trim()
  if (!titleLine) return { explanation: body }

  let title = titleLine
  if (
    (title.startsWith('"') && title.endsWith('"')) ||
    (title.startsWith("'") && title.endsWith("'"))
  ) {
    title = title.slice(1, -1)
  }
  return { title, explanation: body }
}

export function serializeStepMeta(title: string | undefined, explanation: string): string {
  const raw = title ?? ''
  const titleLine =
    /[:#[\]{}&*?|>!%@`]/.test(raw) || raw.includes('\n') || raw.includes('"')
      ? `title: ${JSON.stringify(raw)}`
      : `title: ${raw}`
  if (!explanation) return `---\n${titleLine}\n---\n`
  return `---\n${titleLine}\n---\n\n${explanation.replace(/\s+$/, '')}\n`
}

export function listProblemSlugsWithSidecars(problemsDir: string = PROBLEMS_DIR): string[] {
  return readdirSync(problemsDir)
    .filter((name) => {
      const path = join(problemsDir, name)
      return (
        statSync(path).isDirectory() &&
        existsSync(join(path, 'solutions')) &&
        existsSync(join(problemsDir, `${name}.json`))
      )
    })
    .sort()
}

export function readProblemJson(slug: string, problemsDir: string = PROBLEMS_DIR): ProblemInput {
  const file = sidecarPaths(slug, problemsDir).json
  if (!existsSync(file)) {
    throw new Error(`Missing problem JSON: ${file}`)
  }
  const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown
  const parsed = problemSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Invalid problem JSON for "${slug}":\n${parsed.error.message}`)
  }
  // Return the raw input shape (preserves optional fields as authored) after
  // confirming it validates — pack mutates steps on this object.
  return raw as ProblemInput
}

function listNumberedDirs(dir: string): { index: number; name: string; path: string }[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .map((name) => {
      const match = name.match(/^(\d+)-(.+)$/)
      if (!match) return null
      const path = join(dir, name)
      if (!statSync(path).isDirectory()) return null
      return { index: Number(match[1]), name, path }
    })
    .filter((x): x is { index: number; name: string; path: string } => x !== null)
    .sort((a, b) => a.index - b.index || a.name.localeCompare(b.name))
}

function listStepBases(langDir: string, ext: string): string[] {
  return readdirSync(langDir)
    .filter((f) => f.endsWith(`.${ext}`) && /^\d+-/.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => file.slice(0, -(ext.length + 1)))
}

function readStepsForLanguage(langDir: string, lang: LanguageId): SolutionStep[] {
  const ext = LANG_EXT[lang]
  if (!existsSync(langDir)) return []

  const bases = listStepBases(langDir, ext)
  if (bases.length === 0) return []

  return bases.map((base) => {
    const codePath = join(langDir, `${base}.${ext}`)
    const metaPath = join(langDir, `${base}.md`)
    const code = readFileSync(codePath, 'utf8')
    const stepSlug = base.replace(/^\d+-/, '')

    let title: string | undefined = humanizeSlug(stepSlug)
    let explanation = ''
    if (existsSync(metaPath)) {
      const meta = parseStepMeta(readFileSync(metaPath, 'utf8'))
      if (meta.title !== undefined) title = meta.title
      explanation = meta.explanation
    }

    const step: SolutionStep = title
      ? { title, explanation, code }
      : { explanation, code }
    return step
  })
}

export function readStepsFromSidecars(
  slug: string,
  problemsDir: string = PROBLEMS_DIR,
): StepsByLanguage[] {
  const solutionsDir = sidecarPaths(slug, problemsDir).solutions
  const solutionDirs = listNumberedDirs(solutionsDir)
  if (solutionDirs.length === 0) {
    throw new Error(`No numbered solution folders under ${solutionsDir}`)
  }

  return solutionDirs.map(({ path: solDir }) => {
    const steps: StepsByLanguage = {}
    for (const lang of LANGS) {
      const langSteps = readStepsForLanguage(join(solDir, lang), lang)
      if (langSteps.length > 0) steps[lang] = langSteps
    }
    if (!steps.python && !steps.javascript && !steps.typescript) {
      throw new Error(`Solution folder ${basename(solDir)} has no language step files`)
    }
    return steps
  })
}

export function packSlug(
  slug: string,
  problemsDir: string = PROBLEMS_DIR,
): { solutionsUpdated: number; path: string } {
  const paths = sidecarPaths(slug, problemsDir)
  const problem = readProblemJson(slug, problemsDir)
  const sidecarSteps = readStepsFromSidecars(slug, problemsDir)

  if (sidecarSteps.length !== problem.solutions.length) {
    throw new Error(
      `"${slug}": sidecar has ${sidecarSteps.length} solution folder(s) but JSON has ${problem.solutions.length}. Keep them 1:1 by index.`,
    )
  }

  for (let i = 0; i < problem.solutions.length; i++) {
    problem.solutions[i]!.steps = sidecarSteps[i]!
  }

  const checked = problemSchema.safeParse(problem)
  if (!checked.success) {
    throw new Error(`Packed "${slug}" failed schema validation:\n${checked.error.message}`)
  }

  writeFileSync(paths.json, `${JSON.stringify(problem, null, 2)}\n`)
  return { solutionsUpdated: sidecarSteps.length, path: paths.json }
}

export function unpackSlug(
  slug: string,
  opts: { force?: boolean; problemsDir?: string } = {},
): { solutionsWritten: number; root: string } {
  const problemsDir = opts.problemsDir ?? PROBLEMS_DIR
  const problem = readProblemJson(slug, problemsDir)
  const paths = sidecarPaths(slug, problemsDir)

  if (existsSync(paths.solutions) && !opts.force) {
    throw new Error(
      `Sidecar already exists at ${paths.solutions}. Re-run with --force to overwrite.`,
    )
  }

  if (existsSync(paths.solutions) && opts.force) {
    rmSync(paths.solutions, { recursive: true, force: true })
  }

  mkdirSync(paths.solutions, { recursive: true })

  problem.solutions.forEach((solution, solIndex) => {
    const solDir = join(paths.solutions, `${padIndex(solIndex)}-${slugify(solution.approachName)}`)
    mkdirSync(solDir, { recursive: true })

    for (const lang of LANGS) {
      const steps = solution.steps[lang]
      if (!steps || steps.length === 0) continue

      const langDir = join(solDir, lang)
      mkdirSync(langDir, { recursive: true })
      const ext = LANG_EXT[lang]

      steps.forEach((step, stepIndex) => {
        const base = `${padIndex(stepIndex + 1)}-${slugify(step.title ?? `step-${stepIndex + 1}`)}`
        writeFileSync(join(langDir, `${base}.${ext}`), step.code)
        writeFileSync(join(langDir, `${base}.md`), serializeStepMeta(step.title, step.explanation))
      })
    }
  })

  return { solutionsWritten: problem.solutions.length, root: paths.root }
}

/** True when packing sidecars would leave JSON steps unchanged. */
export function sidecarsMatchJson(
  slug: string,
  problemsDir: string = PROBLEMS_DIR,
): { ok: boolean; detail: string } {
  try {
    const problem = readProblemJson(slug, problemsDir)
    const sidecarSteps = readStepsFromSidecars(slug, problemsDir)
    if (sidecarSteps.length !== problem.solutions.length) {
      return {
        ok: false,
        detail: `solution count mismatch (sidecar ${sidecarSteps.length} vs JSON ${problem.solutions.length})`,
      }
    }
    for (let i = 0; i < problem.solutions.length; i++) {
      const fromJson = JSON.stringify(problem.solutions[i]!.steps)
      const fromSidecar = JSON.stringify(sidecarSteps[i])
      if (fromJson !== fromSidecar) {
        return { ok: false, detail: `steps differ for solution[${i}]` }
      }
    }
    return { ok: true, detail: 'in sync' }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}
