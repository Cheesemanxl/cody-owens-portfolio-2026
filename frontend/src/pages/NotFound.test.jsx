import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from './NotFound'

describe('NotFound', () => {
  it('renders the 404 heading', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  it('renders a link back to home', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/')
  })
})
