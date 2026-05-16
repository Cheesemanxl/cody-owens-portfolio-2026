import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home', () => {
  it('renders the name heading', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: 'Cody Owens' })).toBeInTheDocument()
  })

  it('renders the job title', () => {
    renderHome()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })

  it('renders GitHub link', () => {
    renderHome()
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Cheesemanxl'
    )
  })

  it('renders LinkedIn link', () => {
    renderHome()
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/cody-owens-dev'
    )
  })

  it('renders a link to the game', () => {
    renderHome()
    expect(screen.getByRole('link', { name: 'Play the Game' })).toHaveAttribute('href', '/game')
  })
})
