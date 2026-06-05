import type { Problem } from '../../content/schema'
import type { ApproachId, CodeFeatures, MethodReview } from './types'

export function classify(features: CodeFeatures): ApproachId {
  if (features.usesRecursion) return 'recursion'
  if (features.twoPointerShape) return 'two-pointers'
  if (features.maxLoopDepth >= 2) return 'brute-force'
  if (features.usesSorting && !features.usesHashStructure) return 'sorting'
  if (features.usesHashStructure) return 'hash-map'
  if (features.maxLoopDepth === 1) return 'brute-force'
  return 'unknown'
}

export function estimateComplexity(features: CodeFeatures): { time: string; space: string } {
  let time: string
  if (features.usesSorting && features.maxLoopDepth <= 1) time = 'O(n log n)'
  else if (features.maxLoopDepth >= 3) time = 'O(n³)'
  else if (features.maxLoopDepth >= 2) time = 'O(n²)'
  else if (features.maxLoopDepth >= 1) time = 'O(n)'
  else time = 'O(1)'

  const space = features.usesHashStructure ? 'O(n)' : 'O(1)'
  return { time, space }
}

export function buildReview(features: CodeFeatures, problem: Problem): MethodReview {
  const approachUsed = classify(features)
  const estimatedComplexity = estimateComplexity(features)
  const inefficiencies: string[] = []
  const suggestions: string[] = []

  const reference = problem.solutions.find((s) => s.technique?.optimal)

  let isOptimal = true
  let referenceApproach: string | undefined

  if (reference?.technique) {
    const sig = reference.technique.signature
    referenceApproach = `${reference.approachName} — ${reference.timeComplexity} time, ${reference.spaceComplexity} space`

    const loopOk = features.maxLoopDepth <= sig.maxLoopDepth
    const hashOk = !sig.usesHashStructure || features.usesHashStructure
    isOptimal = loopOk && hashOk

    if (!loopOk) {
      inefficiencies.push(
        `Your solution uses nested iteration (loop depth ${features.maxLoopDepth}); the optimal approach needs at most depth ${sig.maxLoopDepth}.`,
      )
      suggestions.push(
        'Try to remove a nested loop — a hash structure can often replace the inner scan with an O(1) lookup.',
      )
    }
    if (!hashOk) {
      inefficiencies.push(
        'The optimal approach relies on a hash map/set for constant-time lookups, which your solution does not use.',
      )
      suggestions.push('Introduce a dict/set (Python) or Map/Set (JS) to memoize values you have already seen.')
    }
    if (features.usesSorting && !sig.usesSorting) {
      inefficiencies.push('Sorting adds an O(n log n) factor that the optimal solution avoids.')
      suggestions.push('Consider whether a single linear pass with a hash structure removes the need to sort.')
    }
  }

  if (isOptimal && inefficiencies.length === 0) {
    suggestions.push('Nice — this matches the optimal approach. Focus on edge cases and readability.')
  }

  return {
    approachUsed,
    estimatedComplexity,
    isOptimal,
    inefficiencies,
    suggestions,
    referenceApproach,
    source: 'heuristic',
  }
}
