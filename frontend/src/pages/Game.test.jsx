import { render, screen } from '@testing-library/react'
import Game from './Game'

describe('Game', () => {
  it('renders the page heading', () => {
    render(<Game />)
    expect(screen.getByRole('heading', { name: 'Event Sourcing Game' })).toBeInTheDocument()
  })

  it('renders the start button before a game begins', () => {
    render(<Game />)
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument()
  })
})
