import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewPanel } from './ReviewPanel'
import { useProgressStore } from '../../store/useProgressStore'
import type { MethodReview } from '../analysis/types'

beforeEach(() => {
  useProgressStore.setState({ review: {} })
})

describe('ReviewPanel', () => {
  it('prompts to run tests when there is no review yet', () => {
    render(<ReviewPanel slug="unseen-problem" />)
    expect(screen.getByText(/run all tests to get a review/i)).toBeInTheDocument()
  })

  it('renders the verdict, complexity, and suggestions for a stored review', () => {
    const review: MethodReview = {
      approachUsed: 'hash-map',
      estimatedComplexity: { time: 'O(n)', space: 'O(n)' },
      isOptimal: true,
      inefficiencies: [],
      suggestions: ['Nice — this matches the optimal approach.'],
      source: 'heuristic',
    }
    useProgressStore.getState().storeReview('two-sum', review)

    render(<ReviewPanel slug="two-sum" />)
    expect(screen.getByText('Hash Map')).toBeInTheDocument()
    expect(screen.getByText('Optimal')).toBeInTheDocument()
    // O(n) shows for both time and space complexity.
    expect(screen.getAllByText('O(n)').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/matches the optimal approach/i)).toBeInTheDocument()
  })

  it('shows a "Needs work" verdict and lists inefficiencies', () => {
    const review: MethodReview = {
      approachUsed: 'brute-force',
      estimatedComplexity: { time: 'O(n²)', space: 'O(1)' },
      isOptimal: false,
      inefficiencies: ['Your solution uses nested iteration (loop depth 2).'],
      suggestions: ['Try to remove a nested loop.'],
      source: 'heuristic',
    }
    useProgressStore.getState().storeReview('two-sum', review)

    render(<ReviewPanel slug="two-sum" />)
    expect(screen.getByText('Needs work')).toBeInTheDocument()
    expect(screen.getByText(/nested iteration/i)).toBeInTheDocument()
    expect(screen.getByText(/remove a nested loop/i)).toBeInTheDocument()
  })
})
