import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DiffLayout = 'split' | 'inline'

interface UiPrefsState {
  diffLayout: DiffLayout
  setDiffLayout: (layout: DiffLayout) => void
  toggleDiffLayout: () => void
}

export const useUiPrefs = create<UiPrefsState>()(
  persist(
    (set, get) => ({
      diffLayout: 'split',
      setDiffLayout: (layout) => set({ diffLayout: layout }),
      toggleDiffLayout: () => set({ diffLayout: get().diffLayout === 'split' ? 'inline' : 'split' }),
    }),
    { name: 'noobcode-ui', version: 1 },
  ),
)
