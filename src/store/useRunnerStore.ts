import { create } from 'zustand'
import type { RunResult } from '../features/runner/LanguageRunner'

export type RunnerStatus = 'idle' | 'loading' | 'running' | 'done' | 'error'

interface RunnerState {
  status: RunnerStatus
  result: RunResult | null
  loadingMessage: string
  setStatus: (status: RunnerStatus) => void
  setResult: (result: RunResult | null) => void
  setLoadingMessage: (message: string) => void
  reset: () => void
}

export const useRunnerStore = create<RunnerState>((set) => ({
  status: 'idle',
  result: null,
  loadingMessage: '',
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result }),
  setLoadingMessage: (loadingMessage) => set({ loadingMessage }),
  reset: () => set({ status: 'idle', result: null, loadingMessage: '' }),
}))
