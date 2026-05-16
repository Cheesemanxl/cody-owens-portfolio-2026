import { render, screen } from '@testing-library/react'
import Game from './Game'

describe('Game', () => {
  it('renders the page heading', () => {
    render(<Game />)
    expect(screen.getByRole('heading', { name: 'Tower Defense' })).toBeInTheDocument()
  })

  it('renders the canvas placeholder', () => {
    render(<Game />)
    expect(screen.getByText('Game canvas will render here')).toBeInTheDocument()
  })
})
