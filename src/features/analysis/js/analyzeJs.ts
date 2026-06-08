import { parse } from 'acorn'
import type { CodeFeatures } from '../types'

// Minimal ESTree node shape — we only touch `type` and recurse generically.
interface Node {
  type: string
  [key: string]: unknown
}

const LOOP_TYPES = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
])

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && typeof (value as Node).type === 'string'
}

/**
 * AST-based analysis of a JavaScript solution. Replaces the old brace/regex
 * heuristics with a real parse, so strings, comments, and nested structures no
 * longer cause false positives. Produces the same CodeFeatures shape as the
 * Python analyzer so downstream classification stays language-agnostic.
 */
export function analyzeJs(code: string, functionName: string): CodeFeatures {
  const features: CodeFeatures = {
    maxLoopDepth: 0,
    usesHashStructure: false,
    usesSorting: false,
    usesRecursion: false,
    twoPointerShape: false,
    earlyReturn: false,
  }

  let program: Node
  try {
    program = parse(code, { ecmaVersion: 'latest' }) as unknown as Node
  } catch {
    // Unparseable code — return the all-false baseline rather than throwing.
    return features
  }

  let returnCount = 0
  let hasZeroAssign = false
  let hasLenMinusOne = false

  const callsSelf = (callee: unknown): boolean =>
    isNode(callee) && callee.type === 'Identifier' && (callee as Node).name === functionName

  const isLenMinusOne = (node: Node): boolean =>
    node.type === 'BinaryExpression' &&
    (node as Node).operator === '-' &&
    isNode((node as Node).right) &&
    ((node as Node).right as Node).type === 'Literal' &&
    ((node as Node).right as Node).value === 1 &&
    /\blength\b/.test(JSON.stringify((node as Node).left))

  const visit = (node: Node, loopDepth: number) => {
    const nextDepth = LOOP_TYPES.has(node.type) ? loopDepth + 1 : loopDepth
    if (LOOP_TYPES.has(node.type)) {
      features.maxLoopDepth = Math.max(features.maxLoopDepth, nextDepth)
    }

    switch (node.type) {
      case 'ReturnStatement':
        returnCount++
        break
      case 'NewExpression': {
        const callee = node.callee
        if (isNode(callee) && callee.type === 'Identifier') {
          const name = (callee as Node).name
          if (name === 'Map' || name === 'Set' || name === 'WeakMap' || name === 'WeakSet') {
            features.usesHashStructure = true
          }
        }
        break
      }
      case 'ObjectExpression':
        // Object literal used as a dictionary-style structure.
        features.usesHashStructure = true
        break
      case 'CallExpression': {
        const callee = node.callee
        if (isNode(callee) && callee.type === 'MemberExpression') {
          const prop = (callee as Node).property
          if (isNode(prop) && (prop as Node).name === 'sort') features.usesSorting = true
        }
        if (callsSelf(callee)) features.usesRecursion = true
        break
      }
      case 'VariableDeclarator': {
        const init = node.init
        if (isNode(init) && init.type === 'Literal' && (init as Node).value === 0) {
          hasZeroAssign = true
        }
        break
      }
      case 'AssignmentExpression': {
        const right = node.right
        if (isNode(right) && right.type === 'Literal' && (right as Node).value === 0) {
          hasZeroAssign = true
        }
        break
      }
      case 'BinaryExpression':
        if (isLenMinusOne(node)) hasLenMinusOne = true
        break
    }

    for (const key of Object.keys(node)) {
      const child = node[key]
      if (isNode(child)) {
        visit(child, nextDepth)
      } else if (Array.isArray(child)) {
        for (const item of child) if (isNode(item)) visit(item, nextDepth)
      }
    }
  }

  visit(program, 0)

  features.earlyReturn = returnCount > 1
  features.twoPointerShape = hasZeroAssign && hasLenMinusOne
  return features
}
