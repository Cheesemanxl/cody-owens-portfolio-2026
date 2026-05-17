import { render, screen } from '@testing-library/react'
import EventLog from './EventLog.jsx'
import {
  evGameStarted, evTowerPlaced, evWaveStarted, evEnemySpawned,
  evEnemyMoved, evEnemyHit, evEnemyKilled, evEnemyReachedEnd,
  evWaveCompleted, evGameOver,
} from './events.js'

// scrollIntoView is not implemented in jsdom
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

describe('EventLog', () => {
  it('renders the header with event count', () => {
    render(<EventLog events={[evGameStarted()]} />)
    expect(screen.getByText(/Event Log/)).toBeInTheDocument()
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  it('renders one entry per event', () => {
    const events = [evGameStarted(), evTowerPlaced('t1', 3, 3)]
    render(<EventLog events={events} />)
    expect(screen.getByText('#0')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('renders the GAME_STARTED event type', () => {
    render(<EventLog events={[evGameStarted()]} />)
    expect(screen.getByText('GAME_STARTED')).toBeInTheDocument()
  })

  it('renders TOWER_PLACED with coordinate detail', () => {
    render(<EventLog events={[evTowerPlaced('t1', 3, 4)]} />)
    expect(screen.getByText('TOWER_PLACED')).toBeInTheDocument()
    expect(screen.getByText(/id:t1.*3,4/)).toBeInTheDocument()
  })

  it('renders WAVE_STARTED with wave, enemies, and HP detail', () => {
    render(<EventLog events={[evWaveStarted(2, 7, 4)]} />)
    expect(screen.getByText(/wave:2 enemies:7 hp:4/)).toBeInTheDocument()
  })

  it('renders ENEMY_SPAWNED with id and hp', () => {
    render(<EventLog events={[evEnemySpawned('e1', 3)]} />)
    expect(screen.getByText(/id:e1 hp:3/)).toBeInTheDocument()
  })

  it('renders ENEMY_MOVED with progress arrow', () => {
    render(<EventLog events={[evEnemyMoved('e1', 5)]} />)
    expect(screen.getByText(/id:e1 →5/)).toBeInTheDocument()
  })

  it('renders ENEMY_HIT with damage and tower', () => {
    render(<EventLog events={[evEnemyHit('e1', 't1', 1)]} />)
    expect(screen.getByText(/id:e1 -1hp by:t1/)).toBeInTheDocument()
  })

  it('renders ENEMY_KILLED with enemy id', () => {
    render(<EventLog events={[evEnemyKilled('e1')]} />)
    expect(screen.getByText('ENEMY_KILLED')).toBeInTheDocument()
    expect(screen.getByText(/id:e1/)).toBeInTheDocument()
  })

  it('renders ENEMY_REACHED_END with enemy id', () => {
    render(<EventLog events={[evEnemyReachedEnd('e1')]} />)
    expect(screen.getByText('ENEMY_REACHED_END')).toBeInTheDocument()
  })

  it('renders WAVE_COMPLETED with wave and lives', () => {
    render(<EventLog events={[evWaveCompleted(1, 8)]} />)
    expect(screen.getByText(/wave:1 lives:8/)).toBeInTheDocument()
  })

  it('renders GAME_OVER win message', () => {
    render(<EventLog events={[evGameOver(true, 5)]} />)
    expect(screen.getByText(/won after 5 waves/)).toBeInTheDocument()
  })

  it('renders GAME_OVER loss message', () => {
    render(<EventLog events={[evGameOver(false, 3)]} />)
    expect(screen.getByText(/lost on wave 3/)).toBeInTheDocument()
  })

  it('renders an empty log with zero count', () => {
    render(<EventLog events={[]} />)
    expect(screen.getByText('(0)')).toBeInTheDocument()
  })
})
