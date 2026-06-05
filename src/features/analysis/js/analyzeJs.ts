import type { CodeFeatures } from '../types'

// Remove line/block comments and string/template literals so tokens inside
// them do not trigger false positives.
function stripCommentsAndStrings(code: string): string {
  let out = code
  // Block comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, ' ')
  // Line comments
  out = out.replace(/\/\/[^\n]*/g, ' ')
  // String + template literals
  out = out.replace(/'(?:\\.|[^'\\])*'/g, "''")
  out = out.replace(/"(?:\\.|[^"\\])*"/g, '""')
  out = out.replace(/`(?:\\.|[^`\\])*`/g, '``')
  return out
}

// Walk the code tracking brace depth; remember which brace depths were opened
// by a loop header so we can measure the deepest concurrent loop nesting.
function detectMaxLoopDepth(code: string): number {
  let maxDepth = 0
  let loopDepth = 0
  // Stack entry === true when the matching `{` was opened by a loop header.
  const stack: boolean[] = []
  let pendingLoop = false

  const loopHeader = /\b(for|while)\s*\(/g
  // Mark positions where a loop header occurs.
  const loopPositions = new Set<number>()
  let m: RegExpExecArray | null
  while ((m = loopHeader.exec(code))) {
    loopPositions.add(m.index)
  }

  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    if (loopPositions.has(i)) {
      pendingLoop = true
    }
    if (ch === '{') {
      const isLoop = pendingLoop
      stack.push(isLoop)
      if (isLoop) {
        loopDepth++
        maxDepth = Math.max(maxDepth, loopDepth)
      }
      pendingLoop = false
    } else if (ch === '}') {
      const wasLoop = stack.pop()
      if (wasLoop) loopDepth--
    }
  }

  return maxDepth
}

export function analyzeJs(code: string, functionName: string): CodeFeatures {
  const clean = stripCommentsAndStrings(code)

  const maxLoopDepth = detectMaxLoopDepth(clean)

  const usesHashStructure =
    /\bnew\s+Map\b|\bnew\s+Set\b/.test(clean) || /=\s*\{\s*\}/.test(clean) || /=\s*\{[^}]*:/.test(clean)

  const usesSorting = /\.sort\s*\(/.test(clean)

  const twoPointerShape =
    /\b(let|var|const)\s+\w+\s*=\s*0\b/.test(clean) && /length\s*-\s*1/.test(clean)

  const returnCount = (clean.match(/\breturn\b/g) || []).length
  const earlyReturn = returnCount > 1

  // Recursion: remove the declaration line, then look for the function name
  // being called elsewhere in the body.
  let usesRecursion = false
  if (functionName) {
    const declRe = new RegExp(
      `function\\s+${functionName}\\b|\\b${functionName}\\s*=\\s*(function|\\()|\\bconst\\s+${functionName}\\b`,
    )
    const body = clean.replace(declRe, ' ')
    const callRe = new RegExp(`\\b${functionName}\\s*\\(`)
    usesRecursion = callRe.test(body)
  }

  return {
    maxLoopDepth,
    usesHashStructure,
    usesSorting,
    usesRecursion,
    twoPointerShape,
    earlyReturn,
  }
}
