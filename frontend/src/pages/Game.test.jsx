import { render, screen } from '@testing-library/react'
import Game from './Game'

describe('Game', () => {
  it('renders the page heading', () => {
    render(<Game />)
    expect(screen.getByRole('heading', { name: 'Tower Defense' })).toBeInTheDocument()
  })

  it('renders the coming soon subtitle', () => {
    render(<Game />)
    expect(screen.getByText(/Coming soon/)).toBeInTheDocument()
  })
})
