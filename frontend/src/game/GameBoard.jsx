import { COLS, ROWS, PATH, PATH_SET, CELL_PX, TOWER_RANGE } from './constants.js'
import { PHASES } from './reducer.js'
import styles from './GameBoard.module.css'

const ENTRY = `${PATH[0][0]},${PATH[0][1]}`
const EXIT  = `${PATH[PATH.length - 1][0]},${PATH[PATH.length - 1][1]}`

// Cells the currently-hovered tower covers on the path
function coveredPathCells(towerCol, towerRow) {
  const covered = new Set()
  for (const [c, r] of PATH) {
    if (Math.hypot(towerCol - c, towerRow - r) <= TOWER_RANGE) {
      covered.add(`${c},${r}`)
    }
  }
  return covered
}

export default function GameBoard({ state, onCellClick, hoveredTower = null }) {
  if (!state) return null

  const { phase, towers, enemies } = state

  // Index enemies by path cell for quick lookup
  const enemiesByCell = new Map()
  for (const enemy of enemies) {
    const [c, r] = PATH[enemy.progress]
    const key = `${c},${r}`
    if (!enemiesByCell.has(key)) enemiesByCell.set(key, [])
    enemiesByCell.get(key).push(enemy)
  }

  const rangeHighlight = hoveredTower
    ? coveredPathCells(hoveredTower.col, hoveredTower.row)
    : new Set()

  const towersByCell = new Map(towers.map(t => [`${t.col},${t.row}`, t]))

  return (
    <div className={styles.board} style={{ '--cols': COLS, '--rows': ROWS, '--cell': `${CELL_PX}px` }}>
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const key = `${col},${row}`
          const isPath    = PATH_SET.has(key)
          const isEntry   = key === ENTRY
          const isExit    = key === EXIT
          const tower     = towersByCell.get(key)
          const cellEnems = enemiesByCell.get(key) ?? []
          const inRange   = rangeHighlight.has(key)
          const placeable = phase === PHASES.PLACEMENT && !isPath && !tower

          return (
            <div
              key={key}
              data-testid={`cell-${col}-${row}`}
              className={[
                styles.cell,
                isPath    ? styles.path    : styles.buildable,
                isEntry   ? styles.entry   : '',
                isExit    ? styles.exit    : '',
                inRange   ? styles.range   : '',
                placeable ? styles.placeable : '',
              ].join(' ')}
              onClick={() => placeable && onCellClick?.(col, row)}
            >
              {tower && (
                <div className={styles.tower} title={`Tower ${tower.id}`}>▲</div>
              )}
              {cellEnems.map(e => (
                <div
                  key={e.id}
                  className={styles.enemy}
                  title={`${e.id} hp:${e.hp}`}
                >
                  {e.hp}
                </div>
              ))}
              {isEntry && !cellEnems.length && <span className={styles.label}>▶</span>}
              {isExit  && !cellEnems.length && <span className={styles.label}>★</span>}
            </div>
          )
        })
      )}
    </div>
  )
}
