import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Nav from './Nav'

function renderNav({ user = null, initialPath = '/' } = {}) {
  return render(
    <AuthContext.Provider value={{ user, loading: false }}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Nav />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('Nav', () => {
  it('renders the brand name', () => {
    renderNav()
    expect(screen.getByText('Cody Owens')).toBeInTheDocument()
  })

  it('renders Home and Event Sourcing Game links', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Event Sourcing Game' })).toBeInTheDocument()
  })

  it('Home link points to /', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('Event Sourcing Game link points to /game', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Event Sourcing Game' })).toHaveAttribute('href', '/game')
  })

  it('shows sign-in links when logged out', () => {
    renderNav({ user: null })
    expect(screen.getByRole('link', { name: 'Sign in with GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in with Google' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Sign out' })).not.toBeInTheDocument()
  })

  it('shows username and Sign out when logged in', () => {
    renderNav({ user: { userDetails: 'coder', userId: 'u1' } })
    expect(screen.getByRole('link', { name: 'coder' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign out' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Sign in with GitHub' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Sign in with Google' })).not.toBeInTheDocument()
  })

  it('links username to userId when no slug', () => {
    renderNav({ user: { userDetails: 'coder', userId: 'u1' } })
    expect(screen.getByRole('link', { name: 'coder' })).toHaveAttribute('href', '/profile/u1')
  })

  it('links username to slug when slug is present', () => {
    renderNav({ user: { userDetails: 'coder', userId: 'u1', slug: 'coder' } })
    expect(screen.getByRole('link', { name: 'coder' })).toHaveAttribute('href', '/profile/coder')
  })

  it('shows Task Board link when logged in', () => {
    renderNav({ user: { userDetails: 'coder', userId: 'u1' } })
    expect(screen.getByRole('link', { name: 'Task Board' })).toBeInTheDocument()
  })

  it('shows Task Board link when logged out', () => {
    renderNav({ user: null })
    expect(screen.getByRole('link', { name: 'Task Board' })).toBeInTheDocument()
  })
})
