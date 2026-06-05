import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const AI_MODELS = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest, cheapest)' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (balanced)' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (most capable)' },
] as const

export type AiModelId = (typeof AI_MODELS)[number]['id']

interface SettingsState {
  aiEnabled: boolean
  apiKey: string
  model: AiModelId
  setAiEnabled: (value: boolean) => void
  setApiKey: (value: string) => void
  setModel: (value: AiModelId) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiEnabled: false,
      apiKey: '',
      model: 'claude-haiku-4-5',
      setAiEnabled: (value) => set({ aiEnabled: value }),
      setApiKey: (value) => set({ apiKey: value }),
      setModel: (value) => set({ model: value }),
    }),
    {
      name: 'noobcode-settings',
      version: 1,
    },
  ),
)
