import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  humanizeSlug,
  parseStepMeta,
  serializeStepMeta,
  sidecarsMatchJson,
  slugify,
  unpackSlug,
  packSlug,
  PROBLEMS_DIR,
} from './solutionSidecars'

describe('solution sidecar helpers', () => {
  it('slugify / humanize', () => {
    expect(slugify('Start from the function shape')).toBe('start-from-the-function-shape')
    expect(humanizeSlug('start-from-the-function-shape')).toBe('Start from the function shape')
  })

  it('round-trips step meta frontmatter', () => {
    const md = serializeStepMeta('Compute the complement', 'Look up `target - n`.')
    expect(md).toContain('title: Compute the complement')
    expect(parseStepMeta(md)).toEqual({
      title: 'Compute the complement',
      explanation: 'Look up `target - n`.',
    })
  })

  it('parses quoted titles', () => {
    expect(parseStepMeta('---\ntitle: "A: B"\n---\n\nHi\n')).toEqual({
      title: 'A: B',
      explanation: 'Hi',
    })
  })
})

describe('pack / unpack round-trip', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  })

  it('unpack → pack keeps steps in sync', () => {
    const problemsDir = mkdtempSync(join(tmpdir(), 'noobcode-sidecars-'))
    dirs.push(problemsDir)

    const slug = 'demo-reverse'
    const problem = {
      slug,
      title: 'Demo',
      difficulty: 'easy',
      tags: [],
      patterns: ['two-pointers'],
      description: 'Reverse a string.',
      constraints: [],
      examples: [],
      functionName: { python: 'rev', javascript: 'rev', typescript: 'rev' },
      starterCode: {
        python: 'def rev(s):\n    pass\n',
        javascript: 'function rev(s) {}\n',
        typescript: 'function rev(s: string): string { return s }\n',
      },
      tests: [{ name: 'basic', args: ['ab'], expected: 'ba' }],
      solutions: [
        {
          approachName: 'Two Pointers',
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)',
          steps: {
            typescript: [
              {
                title: 'Start from the function shape',
                explanation: 'Empty shell.',
                code: 'function rev(s: string): string {\n  return s\n}\n',
              },
              {
                title: 'Return reversed',
                explanation: 'Split, reverse, join.',
                code: 'function rev(s: string): string {\n  return s.split("").reverse().join("")\n}\n',
              },
            ],
          },
        },
      ],
    }

    writeFileSync(join(problemsDir, `${slug}.json`), `${JSON.stringify(problem, null, 2)}\n`)

    unpackSlug(slug, { problemsDir })
    expect(existsSync(join(problemsDir, slug, 'solutions', '00-two-pointers', 'typescript'))).toBe(
      true,
    )

    const before = readFileSync(join(problemsDir, `${slug}.json`), 'utf8')
    packSlug(slug, problemsDir)
    const after = readFileSync(join(problemsDir, `${slug}.json`), 'utf8')

    expect(JSON.parse(after).solutions[0].steps).toEqual(problem.solutions[0].steps)
    expect(sidecarsMatchJson(slug, problemsDir)).toEqual({ ok: true, detail: 'in sync' })
    // Pack may reformat JSON; steps content is what matters.
    expect(before).toContain('Start from the function shape')
  })
})

describe('string-reversal sidecar', () => {
  it('stays in sync when the sidecar directory exists', () => {
    if (!existsSync(join(PROBLEMS_DIR, 'string-reversal', 'solutions'))) return
    const { ok, detail } = sidecarsMatchJson('string-reversal')
    expect(ok, detail).toBe(true)
  })
})
