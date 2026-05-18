import { render, screen } from '@testing-library/react'
import { AuthContext } from '../context/AuthContext'
import Game from './Game'

function renderGame(user = null) {
  return render(
    <AuthContext.Provider value={{ user, loading: false }}>
      <Game />
    </AuthContext.Provider>
  )
}

describe('Game', () => {
  it('renders the page heading', () => {
    renderGame()
    expect(screen.getByRole('heading', { name: 'Event Sourcing Game' })).toBeInTheDocument()
  })

  it('renders the start button before a game begins', () => {
    renderGame()
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument()
  })
})
