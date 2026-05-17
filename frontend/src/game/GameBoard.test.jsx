import { render, screen, fireEvent } from '@testing-library/react'
import GameBoard from './GameBoard.jsx'
import { PHASES } from './reducer.js'
import { COLS, ROWS } from './constants.js'

function makePlacementState(overrides = {}) {
  return {
    phase: PHASES.PLACEMENT,
    wave: 1,
    lives: 10,
    towers: [],
    enemies: [],
    spawnedCount: 0,
    totalEnemies: 5,
    enemyHp: 3,
    won: false,
    ...overrides,
  }
}

describe('GameBoard', () => {
  it('renders nothing when state is null', () => {
    const { container } = render(<GameBoard state={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the full grid of cells', () => {
    render(<GameBoard state={makePlacementState()} />)
    const cells = screen.getAllByTestId(/^cell-/)
    expect(cells).toHaveLength(COLS * ROWS)
  })

  it('shows the entry label on the entry cell when no enemies are present', () => {
    render(<GameBoard state={makePlacementState()} />)
    // PATH[0] = [0,2] — entry cell
    const entryCell = screen.getByTestId('cell-0-2')
    expect(entryCell).toHaveTextContent('▶')
  })

  it('shows the exit label on the exit cell when no enemies are present', () => {
    render(<GameBoard state={makePlacementState()} />)
    // PATH[last] = [9,5] — exit cell
    const exitCell = screen.getByTestId('cell-9-5')
    expect(exitCell).toHaveTextContent('★')
  })

  it('renders a tower on the correct cell', () => {
    const state = makePlacementState({ towers: [{ id: 't1', col: 4, row: 4 }] })
    render(<GameBoard state={state} />)
    expect(screen.getByTitle('Tower t1')).toBeInTheDocument()
    expect(screen.getByTestId('cell-4-4')).toHaveTextContent('▲')
  })

  it('renders enemy HP in the enemy cell', () => {
    // Enemy at progress=0 → PATH[0]=[0,2]
    const state = makePlacementState({
      phase: PHASES.WAVE,
      enemies: [{ id: 'e1', hp: 3, progress: 0 }],
    })
    render(<GameBoard state={state} />)
    // enemy title contains id and hp
    expect(screen.getByTitle('e1 hp:3')).toBeInTheDocument()
    expect(screen.getByTestId('cell-0-2')).toHaveTextContent('3')
  })

  it('calls onCellClick with col and row when a buildable cell is clicked during placement', () => {
    const onCellClick = vi.fn()
    render(<GameBoard state={makePlacementState()} onCellClick={onCellClick} />)
    // Cell (4,4) is not on path and not a tower — should be placeable
    fireEvent.click(screen.getByTestId('cell-4-4'))
    expect(onCellClick).toHaveBeenCalledWith(4, 4)
  })

  it('does not call onCellClick when clicking a path cell', () => {
    const onCellClick = vi.fn()
    render(<GameBoard state={makePlacementState()} onCellClick={onCellClick} />)
    // Cell (0,2) is the entry path cell
    fireEvent.click(screen.getByTestId('cell-0-2'))
    expect(onCellClick).not.toHaveBeenCalled()
  })

  it('does not call onCellClick during the wave phase', () => {
    const onCellClick = vi.fn()
    const state = makePlacementState({ phase: PHASES.WAVE })
    render(<GameBoard state={state} onCellClick={onCellClick} />)
    fireEvent.click(screen.getByTestId('cell-4-4'))
    expect(onCellClick).not.toHaveBeenCalled()
  })

  it('does not call onCellClick when clicking an occupied tower cell', () => {
    const onCellClick = vi.fn()
    const state = makePlacementState({ towers: [{ id: 't1', col: 4, row: 4 }] })
    render(<GameBoard state={state} onCellClick={onCellClick} />)
    fireEvent.click(screen.getByTestId('cell-4-4'))
    expect(onCellClick).not.toHaveBeenCalled()
  })
})
