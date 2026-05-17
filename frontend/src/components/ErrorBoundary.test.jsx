import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

function Bomb({ shouldThrow = false }) {
  if (shouldThrow) throw new Error('boom')
  return <span>OK</span>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('renders fallback heading when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })

  it('renders recovery hint when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Try refreshing the page.')).toBeInTheDocument()
  })
})
