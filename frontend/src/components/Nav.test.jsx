import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav'

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Nav />
    </MemoryRouter>
  )
}

describe('Nav', () => {
  it('renders the brand name', () => {
    renderNav()
    expect(screen.getByText('Cody Owens')).toBeInTheDocument()
  })

  it('renders Home and Game links', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Game' })).toBeInTheDocument()
  })

  it('Home link points to /', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('Game link points to /game', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Game' })).toHaveAttribute('href', '/game')
  })
})
