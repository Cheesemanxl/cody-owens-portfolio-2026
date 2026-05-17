import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Board from './Board'

const mockUser = { userId: 'u1', userDetails: 'coder', identityProvider: 'github' }

function renderBoard({ user = mockUser, loading = false } = {}) {
  return render(
    <AuthContext.Provider value={{ user, loading }}>
      <MemoryRouter>
        <Board />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

function stubFetch(cards = []) {
  vi.stubGlobal('fetch', () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(cards) })
  )
}

describe('Board', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows heading when not authenticated', () => {
    renderBoard({ user: null })
    expect(screen.getByRole('heading', { name: 'Task Board' })).toBeInTheDocument()
  })

  it('shows sign-in links when not authenticated', () => {
    renderBoard({ user: null })
    expect(screen.getByRole('link', { name: 'Sign in with GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in with Google' })).toBeInTheDocument()
  })

  it('renders three lane headings', async () => {
    stubFetch()
    renderBoard()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument()
    })
  })

  it('fetches /api/cards on mount', async () => {
    const spy = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))
    vi.stubGlobal('fetch', spy)
    renderBoard()
    await waitFor(() => expect(spy).toHaveBeenCalledWith('/api/cards'))
  })

  it('renders fetched cards in their lanes', async () => {
    stubFetch([
      { id: 'c1', lane: 'todo', title: 'Task A' },
      { id: 'c2', lane: 'done', title: 'Task B' },
    ])
    renderBoard()
    await waitFor(() => {
      expect(screen.getByText('Task A')).toBeInTheDocument()
      expect(screen.getByText('Task B')).toBeInTheDocument()
    })
  })

  it('renders nothing while auth is loading', () => {
    stubFetch()
    const { container } = renderBoard({ loading: true })
    expect(container.firstChild).toBeNull()
  })
})
