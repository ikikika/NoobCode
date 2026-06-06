/* Scaffold a new built-in problem as a JSON file.
 *
 *   npm run new:problem -- <slug> ["Title"]
 *
 * Writes src/content/problems/<slug>.json. No registration step is needed —
 * src/content/index.ts auto-discovers every *.json via import.meta.glob.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: npm run new:problem -- <slug> ["Title"]')
  console.error('  <slug> must be lowercase, digits, and hyphens only.')
  process.exit(1)
}

const title =
  process.argv[3] ??
  slug
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

const fnPy = slug.replace(/-/g, '_')
const fnJs = slug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

const file = resolve('src/content/problems', `${slug}.json`)
if (existsSync(file)) {
  console.error(`Refusing to overwrite existing problem: ${file}`)
  process.exit(1)
}

const problem = {
  slug,
  title,
  difficulty: 'easy',
  tags: [],
  patterns: ['brute-force'],
  description: 'TODO: describe the problem in markdown.',
  constraints: ['TODO'],
  examples: [{ input: 'TODO', output: 'TODO' }],
  functionName: { python: fnPy, javascript: fnJs, typescript: fnJs },
  starterCode: {
    python: `def ${fnPy}(args):\n    pass\n`,
    javascript: `function ${fnJs}(args) {\n}\n`,
    typescript: `function ${fnJs}(args: unknown): unknown {\n  return null;\n}\n`,
  },
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
      steps: [
        {
          title: 'TODO',
          explanation: 'TODO',
          code: {
            python: `def ${fnPy}(args):\n    pass\n`,
            javascript: `function ${fnJs}(args) {\n}\n`,
            typescript: `function ${fnJs}(args: unknown): unknown {\n  return null;\n}\n`,
          },
        },
      ],
    },
  ],
}

writeFileSync(file, JSON.stringify(problem, null, 2) + '\n')

console.log(`Created ${file}`)
console.log('It is auto-registered via import.meta.glob. Fill in the TODOs, then run:')
console.log('  npm run validate:content')
