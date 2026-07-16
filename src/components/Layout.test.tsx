import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'

describe('Layout accessibility', () => {
  it('exposes a skip link and a focusable main landmark', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    expect(screen.getByText('Skip to content')).toBeInTheDocument()

    const main = document.getElementById('main-content')
    expect(main).not.toBeNull()
    expect(main?.tagName).toBe('MAIN')
    expect(main?.getAttribute('tabindex')).toBe('-1')
  })

  it('does not show Problems or Skills nav tabs', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('navigation', { name: /primary/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Problems' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Skills' })).not.toBeInTheDocument()
  })
})
