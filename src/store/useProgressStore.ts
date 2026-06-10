import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LanguageId } from '../content/schema'
import type { AttemptRecord, MethodReview } from '../features/analysis/types'
import { nextSchedule, type ScheduleEntry } from '../features/review/schedule'

export interface LastRun {
  passed: number
  total: number
}

interface ProgressState {
  solved: Record<string, boolean>
  savedCode: Record<string, string> // key = "slug:language"
  lastLanguage: LanguageId
  attempts: AttemptRecord[]
  review: Record<string, MethodReview>
  schedule: Record<string, ScheduleEntry>
  lastRun: Record<string, LastRun> // key = slug → most recent full run's tally

  markSolved: (slug: string) => void
  isSolved: (slug: string) => boolean
  saveCode: (slug: string, language: LanguageId, code: string) => void
  getCode: (slug: string, language: LanguageId) => string
  setLastLanguage: (lang: LanguageId) => void
  recordAttempt: (attempt: AttemptRecord) => void
  storeReview: (slug: string, review: MethodReview) => void
  updateSchedule: (slug: string, passed: boolean) => void
  setLastRun: (slug: string, run: LastRun) => void
}

const codeKey = (slug: string, language: LanguageId) => `${slug}:${language}`

// Forward-migrate a persisted blob to the current schema. Exported so the
// migration ladder can be unit-tested without rehydrating the live store.
export function migrateProgress(persisted: unknown, version: number): ProgressState {
  const state = (persisted ?? {}) as Partial<ProgressState>
  if (version < 2) {
    state.attempts = state.attempts ?? []
    state.review = state.review ?? {}
  }
  if (version < 3) {
    state.schedule = state.schedule ?? {}
  }
  if (version < 4) {
    state.lastRun = state.lastRun ?? {}
  }
  return state as ProgressState
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      solved: {},
      savedCode: {},
      lastLanguage: 'python',
      attempts: [],
      review: {},
      schedule: {},
      lastRun: {},

      markSolved: (slug) => set((s) => ({ solved: { ...s.solved, [slug]: true } })),
      isSolved: (slug) => Boolean(get().solved[slug]),

      saveCode: (slug, language, code) =>
        set((s) => ({ savedCode: { ...s.savedCode, [codeKey(slug, language)]: code } })),
      getCode: (slug, language) => get().savedCode[codeKey(slug, language)] ?? '',

      setLastLanguage: (lang) => set({ lastLanguage: lang }),

      recordAttempt: (attempt) => set((s) => ({ attempts: [...s.attempts, attempt] })),

      storeReview: (slug, review) => set((s) => ({ review: { ...s.review, [slug]: review } })),

      updateSchedule: (slug, passed) =>
        set((s) => ({
          schedule: {
            ...s.schedule,
            [slug]: nextSchedule(s.schedule[slug], passed, Date.now()),
          },
        })),

      setLastRun: (slug, run) => set((s) => ({ lastRun: { ...s.lastRun, [slug]: run } })),
    }),
    {
      name: 'noobcode-progress',
      version: 4,
      migrate: (persisted, version) => migrateProgress(persisted, version),
    },
  ),
)
