import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Profile from './Profile'

const mockUser = {
  id: 'u1',
  username: 'coder',
  provider: 'github',
  createdAt: '2026-05-16 05:37:42',
}

function stubFetch({ status = 200, body = mockUser } = {}) {
  vi.stubGlobal('fetch', () =>
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    })
  )
}

function renderProfile(userId = 'u1') {
  return render(
    <MemoryRouter initialEntries={[`/profile/${userId}`]}>
      <Routes>
        <Route path="/profile/:userId" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Profile', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows loading initially', () => {
    stubFetch()
    renderProfile()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders username after load', async () => {
    stubFetch()
    renderProfile()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'coder' })).toBeInTheDocument())
  })

  it('shows provider badge', async () => {
    stubFetch()
    renderProfile()
    await waitFor(() => expect(screen.getByText('github')).toBeInTheDocument())
  })

  it('shows member since date', async () => {
    stubFetch()
    renderProfile()
    await waitFor(() => expect(screen.getByText(/May 16, 2026/)).toBeInTheDocument())
  })

  it('renders stat cards', async () => {
    stubFetch()
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText('Games Played')).toBeInTheDocument()
      expect(screen.getByText('Best Wave')).toBeInTheDocument()
      expect(screen.getByText('Member Since')).toBeInTheDocument()
    })
  })

  it('renders replays section with empty state', async () => {
    stubFetch()
    renderProfile()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Game Replays' })).toBeInTheDocument()
      expect(screen.getByText('No replays yet.')).toBeInTheDocument()
    })
  })

  it('shows not found for unknown user', async () => {
    stubFetch({ status: 404 })
    renderProfile('nobody')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Player not found' })).toBeInTheDocument())
  })
})
