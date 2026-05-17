import { render, screen, fireEvent } from '@testing-library/react'
import ReplayViewer from './ReplayViewer.jsx'
import {
  evGameStarted, evTowerPlaced, evWaveStarted, evEnemySpawned,
} from './events.js'

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

const EVENTS = [
  evGameStarted(),
  evTowerPlaced('t1', 4, 4),
  evWaveStarted(1, 5, 3),
  evEnemySpawned('e-test', 3),
]

describe('ReplayViewer', () => {
  it('renders the heading', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Step-through Replay' })).toBeInTheDocument()
  })

  it('shows event #0 on initial render', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    expect(screen.getByText(/Event #0/)).toBeInTheDocument()
    expect(screen.getByText('GAME_STARTED')).toBeInTheDocument()
  })

  it('displays the JSON of the current event', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    // The first event is { type: 'GAME_STARTED' }
    expect(screen.getByText(/"type": "GAME_STARTED"/)).toBeInTheDocument()
  })

  it('shows the counter as "1 / N" at start', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    expect(screen.getByText(`1 / ${EVENTS.length}`)).toBeInTheDocument()
  })

  it('advances to the next event when Next is clicked', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Next →/ }))
    expect(screen.getByText(/Event #1/)).toBeInTheDocument()
    expect(screen.getByText('TOWER_PLACED')).toBeInTheDocument()
  })

  it('goes back to the previous event when Prev is clicked', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Next →/ }))
    fireEvent.click(screen.getByRole('button', { name: /← Prev/ }))
    expect(screen.getByText(/Event #0/)).toBeInTheDocument()
  })

  it('does not go below index 0 when Prev is clicked at the start', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /← Prev/ }))
    expect(screen.getByText(/Event #0/)).toBeInTheDocument()
  })

  it('restarts to event #0 when ⏮ is clicked', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Next →/ }))
    fireEvent.click(screen.getByRole('button', { name: /Next →/ }))
    fireEvent.click(screen.getByTitle('Restart'))
    expect(screen.getByText(/Event #0/)).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<ReplayViewer events={EVENTS} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Close/ }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows the replay formula annotation', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    expect(screen.getByText(/State = events\[0\.\./)).toBeInTheDocument()
  })

  it('shows the state phase derived from the replayed events', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    // After event #0 (GAME_STARTED), state.phase = 'placement'
    expect(screen.getByText(/placement/)).toBeInTheDocument()
  })

  it('updates state summary as events are stepped through', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    // Step to WAVE_STARTED (index 2)
    fireEvent.click(screen.getByRole('button', { name: /Next →/ }))
    fireEvent.click(screen.getByRole('button', { name: /Next →/ }))
    // Phase should be 'wave' after WAVE_STARTED — check the <b> in the state summary
    const boldEls = Array.from(document.querySelectorAll('b'))
    expect(boldEls.some(el => el.textContent === 'wave')).toBe(true)
  })

  it('scrubber max equals events.length - 1', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    const scrubber = screen.getByRole('slider')
    expect(scrubber).toHaveAttribute('max', String(EVENTS.length - 1))
  })

  it('updates the index when the scrubber is changed', () => {
    render(<ReplayViewer events={EVENTS} onClose={vi.fn()} />)
    const scrubber = screen.getByRole('slider')
    fireEvent.change(scrubber, { target: { value: '3' } })
    expect(screen.getByText(/Event #3/)).toBeInTheDocument()
  })
})
