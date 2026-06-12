import { test } from '@playwright/test'
import { seed, openProblem, runAllExpectPass, SOLUTIONS } from './helpers'

// These exercise the runner's structured-I/O codec and the design (class)
// executor through the real Pyodide runtime.

test('tree problem: level-order traversal passes (tree I/O codec)', async ({ page }) => {
  await seed(page, {
    savedCode: { 'binary-tree-level-order-traversal:python': SOLUTIONS.levelOrderPython },
  })
  await openProblem(page, 'binary-tree-level-order-traversal')

  await runAllExpectPass(page)
})

test('design problem: Min Stack op-sequence passes (design executor)', async ({ page }) => {
  await seed(page, { savedCode: { 'min-stack:python': SOLUTIONS.minStackPython } })
  await openProblem(page, 'min-stack')

  await runAllExpectPass(page)
})
