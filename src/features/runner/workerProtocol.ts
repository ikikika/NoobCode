import type { TestCase } from '../../content/schema'
import type { CodeFeatures } from '../analysis/types'
import type { RunResult } from './LanguageRunner'

// --- Requests (main thread → worker) ---
export interface WorkerInitRequest {
  type: 'init'
  id: number
}

export interface WorkerRunRequest {
  type: 'run'
  id: number
  userCode: string
  functionName: string
  tests: TestCase[]
}

export interface WorkerAnalyzeRequest {
  type: 'analyze'
  id: number
  userCode: string
  functionName: string
}

export type WorkerRequest = WorkerInitRequest | WorkerRunRequest | WorkerAnalyzeRequest

// --- Responses (worker → main thread) ---
export interface ReadyMsg {
  type: 'ready'
  id: number
}

export interface ProgressMsg {
  type: 'progress'
  id: number
  message: string
}

export interface StdoutMsg {
  type: 'stdout'
  id: number
  text: string
}

export interface StderrMsg {
  type: 'stderr'
  id: number
  text: string
}

export interface ResultMsg {
  type: 'result'
  id: number
  result: RunResult
}

export interface ErrorMsg {
  type: 'error'
  id: number
  message: string
}

export interface WorkerFeaturesMsg {
  type: 'features'
  id: number
  features?: CodeFeatures
  error?: string
}

export type WorkerResponse =
  | ReadyMsg
  | ProgressMsg
  | StdoutMsg
  | StderrMsg
  | ResultMsg
  | ErrorMsg
  | WorkerFeaturesMsg
