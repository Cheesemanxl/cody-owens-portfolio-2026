import { EV } from './events.js'
import { INITIAL_LIVES } from './constants.js'

export const PHASES = {
  PLACEMENT: 'placement',
  WAVE:      'wave',
  GAME_OVER: 'game_over',
}

const INITIAL = {
  phase:        PHASES.PLACEMENT,
  wave:         1,
  lives:        INITIAL_LIVES,
  towers:       [],   // { id, col, row }
  enemies:      [],   // { id, hp, progress }  — progress = index into PATH
  spawnedCount: 0,
  totalEnemies: 0,
  enemyHp:      0,
  won:          false,
}

// Pure function: (state | null, event) → state
// State is null before GAME_STARTED; every other event requires existing state.
export function reducer(state, event) {
  if (state === null && event.type !== EV.GAME_STARTED) return null

  switch (event.type) {
    case EV.GAME_STARTED:
      return { ...INITIAL }

    case EV.TOWER_PLACED:
      return {
        ...state,
        towers: [...state.towers, { id: event.id, col: event.col, row: event.row }],
      }

    case EV.WAVE_STARTED:
      return {
        ...state,
        phase:        PHASES.WAVE,
        enemies:      [],
        spawnedCount: 0,
        totalEnemies: event.totalEnemies,
        enemyHp:      event.enemyHp,
      }

    case EV.ENEMY_SPAWNED:
      return {
        ...state,
        spawnedCount: state.spawnedCount + 1,
        enemies: [...state.enemies, { id: event.id, hp: event.hp, progress: 0 }],
      }

    case EV.ENEMY_MOVED:
      return {
        ...state,
        enemies: state.enemies.map(e =>
          e.id === event.id ? { ...e, progress: event.progress } : e
        ),
      }

    case EV.ENEMY_HIT:
      return {
        ...state,
        enemies: state.enemies.map(e =>
          e.id === event.enemyId ? { ...e, hp: e.hp - event.damage } : e
        ),
      }

    case EV.ENEMY_KILLED:
      return {
        ...state,
        enemies: state.enemies.filter(e => e.id !== event.id),
      }

    case EV.ENEMY_REACHED_END:
      return {
        ...state,
        lives:   state.lives - 1,
        enemies: state.enemies.filter(e => e.id !== event.id),
      }

    case EV.WAVE_COMPLETED:
      return {
        ...state,
        phase: PHASES.PLACEMENT,
        wave:  state.wave + 1,
      }

    case EV.GAME_OVER:
      return {
        ...state,
        phase: PHASES.GAME_OVER,
        won:   event.won,
      }

    default:
      return state
  }
}
