import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AchievementsPage } from './AchievementsPage'
import { ACHIEVEMENTS } from '../features/achievements/achievements'
import { useProgressStore } from '../store/useProgressStore'
import { useRewardsStore } from '../store/useRewardsStore'

beforeEach(() => {
  useProgressStore.setState({ solved: {}, attempts: [], review: {} })
  useRewardsStore.setState({ achievementsEarnedAt: {} })
})

describe('AchievementsPage', () => {
  it('renders the header and the unlocked tally', () => {
    render(<AchievementsPage />)
    expect(screen.getByRole('heading', { name: /achievements/i })).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`0 of ${ACHIEVEMENTS.length} unlocked`, 'i')),
    ).toBeInTheDocument()
  })

  it('lists achievements by name', () => {
    render(<AchievementsPage />)
    expect(screen.getByText('First Blood')).toBeInTheDocument()
    expect(screen.getByText('Completionist')).toBeInTheDocument()
  })

  it('features the latest unlock once an achievement is earned', () => {
    useProgressStore.setState({ solved: { 'two-sum': true }, attempts: [], review: {} })
    useRewardsStore.setState({ achievementsEarnedAt: { first: Date.now() } })
    render(<AchievementsPage />)
    expect(screen.getByText('Latest unlock')).toBeInTheDocument()
  })
})
