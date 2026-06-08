import { create } from 'zustand'
import type { LanguageId } from '../content/schema'

interface SolutionState {
  activeSolutionIndex: number
  activeStepIndex: number
  activeLanguage: LanguageId
  setSolutionIndex: (index: number) => void
  setStepIndex: (index: number) => void
  setLanguage: (language: LanguageId) => void
  resetForProblem: (language: LanguageId) => void
}

export const useSolutionStore = create<SolutionState>((set) => ({
  activeSolutionIndex: 0,
  activeStepIndex: 0,
  activeLanguage: 'python',
  setSolutionIndex: (index) => set({ activeSolutionIndex: index, activeStepIndex: 0 }),
  setStepIndex: (index) => set({ activeStepIndex: index }),
  setLanguage: (language) => set({ activeLanguage: language }),
  resetForProblem: (language) =>
    set({ activeSolutionIndex: 0, activeStepIndex: 0, activeLanguage: language }),
}))
