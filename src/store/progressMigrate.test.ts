import { describe, it, expect } from 'vitest'
import { migrateProgress } from './useProgressStore'

// The persist `migrate` ladder must forward old localStorage blobs to the
// current schema without dropping existing data.

describe('migrateProgress', () => {
  it('adds attempts/review/schedule/lastRun to a v1 blob', () => {
    const v1 = { solved: { 'two-sum': true }, savedCode: {}, lastLanguage: 'python' }
    const out = migrateProgress(v1, 1)
    expect(out.solved).toEqual({ 'two-sum': true })
    expect(out.attempts).toEqual([])
    expect(out.review).toEqual({})
    expect(out.schedule).toEqual({})
    expect(out.lastRun).toEqual({})
  })

  it('only fills the gaps newer than the persisted version', () => {
    const v3 = {
      solved: {},
      savedCode: {},
      lastLanguage: 'javascript',
      attempts: [{ slug: 'x', timestamp: 1, passed: true }],
      review: {},
      schedule: { x: { box: 2, dueAt: 10, lastReviewed: 5 } },
    }
    const out = migrateProgress(v3, 3)
    // Pre-existing data is preserved...
    expect(out.attempts).toHaveLength(1)
    expect(out.schedule.x.box).toBe(2)
    // ...and only the v4 field is introduced.
    expect(out.lastRun).toEqual({})
  })

  it('tolerates an empty/undefined persisted blob', () => {
    const out = migrateProgress(undefined, 0)
    expect(out.attempts).toEqual([])
    expect(out.review).toEqual({})
    expect(out.schedule).toEqual({})
    expect(out.lastRun).toEqual({})
  })
})
