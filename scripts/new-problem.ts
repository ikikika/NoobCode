/* Scaffold a new problem folder from a template.
 *
 *   npm run new:problem -- <slug> ["Title"]
 *
 * Creates src/content/problems/<slug>/index.ts and prints the snippet to add
 * to src/content/index.ts. It deliberately does NOT auto-edit the registry —
 * registering by hand keeps the lazy-import map explicit and reviewable.
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
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

const dir = resolve('src/content/problems', slug)
const file = resolve(dir, 'index.ts')
if (existsSync(file)) {
  console.error(`Refusing to overwrite existing problem: ${file}`)
  process.exit(1)
}

const template = `import type { ProblemInput } from '../../schema'

const problem = {
  slug: '${slug}',
  title: '${title}',
  difficulty: 'easy',
  tags: [],
  patterns: ['brute-force'],
  description: \`TODO: describe the problem in markdown.\`,
  constraints: ['TODO'],
  examples: [{ input: 'TODO', output: 'TODO' }],
  functionName: { python: '${fnPy}', javascript: '${fnJs}' },
  starterCode: {
    python: \`def ${fnPy}(args):
    pass
\`,
    javascript: \`function ${fnJs}(args) {
}
\`,
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
            python: \`def ${fnPy}(args):
    pass
\`,
            javascript: \`function ${fnJs}(args) {
}
\`,
          },
        },
      ],
    },
  ],
} satisfies ProblemInput

export default problem
`

mkdirSync(dir, { recursive: true })
writeFileSync(file, template)

console.log(`Created ${file}\n`)
console.log('Now register it in src/content/index.ts:')
console.log(`  problemRegistry: '${slug}': () => import('./problems/${slug}/index'),`)
console.log(
  `  problemsMeta:    { slug: '${slug}', title: '${title}', difficulty: 'easy', tags: [], patterns: ['brute-force'] }`,
)
console.log('\nThen run: npm run validate:content')
