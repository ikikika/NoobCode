import type { Page } from '@playwright/test'

// Deterministic E2E setup: seed the persisted zustand blobs before the app loads
// (via addInitScript) so flows don't depend on flaky editor typing. Shapes match
// the persist format `{ state, version }` used by useProgressStore (v4) and
// useRewardsStore (v1); `noobcode-theme` is a raw string.

export interface SeedOptions {
  /** Pre-saved editor code, keyed "slug:language". */
  savedCode?: Record<string, string>
  lastLanguage?: 'python' | 'javascript' | 'typescript'
  coins?: number
  unlockedThemes?: string[]
  customThemeUnlocked?: boolean
  theme?: string
}

export async function seed(page: Page, opts: SeedOptions = {}): Promise<void> {
  await page.addInitScript((o: SeedOptions) => {
    localStorage.setItem(
      'noobcode-progress',
      JSON.stringify({
        state: {
          solved: {},
          savedCode: o.savedCode ?? {},
          lastLanguage: o.lastLanguage ?? 'python',
          attempts: [],
          review: {},
          schedule: {},
          lastRun: {},
        },
        version: 4,
      }),
    )
    localStorage.setItem(
      'noobcode-rewards',
      JSON.stringify({
        state: {
          coins: o.coins ?? 0,
          ledger: [],
          lastDailyClaim: null,
          loginStreak: 0,
          unlockedThemes: o.unlockedThemes ?? ['cream'],
          rewardedSolves: {},
          achievementsEarnedAt: {},
          customThemeUnlocked: o.customThemeUnlocked ?? false,
          seeded: true,
        },
        version: 1,
      }),
    )
    if (o.theme) localStorage.setItem('noobcode-theme', o.theme)
  }, opts)
}

export async function openProblem(page: Page, slug: string): Promise<void> {
  await page.goto(`/#/problems/${slug}`)
  await page.getByRole('button', { name: 'Run All' }).waitFor()
}

export async function readCoins(page: Page): Promise<number> {
  const text = await page.getByTestId('coin-count').innerText()
  return Number.parseInt(text.trim(), 10)
}

// Correct reference solutions used as fixtures.
export const SOLUTIONS = {
  twoSumPython: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []
`,
  twoSumJs: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const c = target - nums[i];
    if (seen.has(c)) return [seen.get(c), i];
    seen.set(nums[i], i);
  }
  return [];
}
`,
  twoSumTs: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const c = target - nums[i];
    if (seen.has(c)) return [seen.get(c)!, i];
    seen.set(nums[i], i);
  }
  return [];
}
`,
  levelOrderPython: `from collections import deque


def level_order(root):
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
    return res
`,
  minStackPython: `class MinStack:
    def __init__(self):
        self.s = []
        self.m = []

    def push(self, val):
        self.s.append(val)
        self.m.append(val if not self.m else min(val, self.m[-1]))

    def pop(self):
        self.s.pop()
        self.m.pop()

    def top(self):
        return self.s[-1]

    def getMin(self):
        return self.m[-1]
`,
  infiniteLoopPython: `def two_sum(nums, target):
    while True:
        pass
`,
}
