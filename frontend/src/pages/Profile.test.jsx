import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Profile from './Profile'

function renderProfile(userId = 'player-1') {
  return render(
    <MemoryRouter initialEntries={[`/profile/${userId}`]}>
      <Routes>
        <Route path="/profile/:userId" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Profile', () => {
  it('renders the page heading', () => {
    renderProfile()
    expect(screen.getByRole('heading', { name: 'Player Profile' })).toBeInTheDocument()
  })

  it('displays the userId from the URL', () => {
    renderProfile('abc-123')
    expect(screen.getByText('User: abc-123')).toBeInTheDocument()
  })

  it('renders the stat cards', () => {
    renderProfile()
    expect(screen.getByText('Games Played')).toBeInTheDocument()
    expect(screen.getByText('Best Wave')).toBeInTheDocument()
    expect(screen.getByText('Member Since')).toBeInTheDocument()
  })
})
