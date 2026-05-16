import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function Consumer() {
  const { user, loading } = useAuth()
  if (loading) return <span>loading</span>
  return <span>{user ? user.userDetails : 'logged out'}</span>
}

function stubFetch({ principal = null } = {}) {
  const spy = vi.fn()
  spy.mockImplementation(url => {
    if (url === '/.auth/me') {
      return Promise.resolve({
        json: () => Promise.resolve({ clientPrincipal: principal }),
      })
    }
    // /api/me — return minimal ok response
    return Promise.resolve({ ok: true })
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows logged out when /.auth/me returns null principal', async () => {
    stubFetch({ principal: null })
    renderWithAuth()
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })

  it('exposes user when /.auth/me returns a principal', async () => {
    stubFetch({
      principal: {
        identityProvider: 'github',
        userId: 'u1',
        userDetails: 'coder',
        userRoles: ['authenticated'],
      },
    })
    renderWithAuth()
    await waitFor(() => expect(screen.getByText('coder')).toBeInTheDocument())
  })

  it('calls /api/me to register user when authenticated', async () => {
    const spy = stubFetch({
      principal: { identityProvider: 'github', userId: 'u1', userDetails: 'coder' },
    })
    renderWithAuth()
    await waitFor(() => expect(screen.getByText('coder')).toBeInTheDocument())
    expect(spy).toHaveBeenCalledWith('/api/me')
  })

  it('does not call /api/me when not authenticated', async () => {
    const spy = stubFetch({ principal: null })
    renderWithAuth()
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
    expect(spy).not.toHaveBeenCalledWith('/api/me')
  })

  it('shows logged out when fetch fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('network error')))
    renderWithAuth()
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })
})
