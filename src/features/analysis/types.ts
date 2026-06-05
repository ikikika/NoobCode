import type { PatternId } from '../../content/patterns'

export interface CodeFeatures {
  maxLoopDepth: number // 0=none, 1=single, 2+=nested
  usesHashStructure: boolean // dict/set/Map/Set
  usesSorting: boolean
  usesRecursion: boolean
  twoPointerShape: boolean
  earlyReturn: boolean // multiple return statements
}

export type ApproachId = PatternId | 'unknown'

export interface MethodReview {
  approachUsed: ApproachId
  estimatedComplexity: { time: string; space: string }
  isOptimal: boolean
  inefficiencies: string[]
  suggestions: string[]
  referenceApproach?: string
  prose?: string // optional AI-polished coaching text
  source: 'heuristic' | 'ai'
}

export interface AttemptRecord {
  slug: string
  timestamp: number
  passed: boolean
  approachUsed?: ApproachId
}
