import { reducer, PHASES } from './reducer.js'
import {
  evGameStarted, evTowerPlaced, evWaveStarted, evEnemySpawned,
  evEnemyMoved, evEnemyHit, evEnemyKilled, evEnemyReachedEnd,
  evWaveCompleted, evGameOver,
} from './events.js'
import { INITIAL_LIVES } from './constants.js'

describe('reducer', () => {
  describe('null state guard', () => {
    it('returns null for non-GAME_STARTED events before the game begins', () => {
      expect(reducer(null, evTowerPlaced('t1', 0, 0))).toBeNull()
      expect(reducer(null, evWaveStarted(1, 5, 3))).toBeNull()
      expect(reducer(null, evEnemySpawned('e1', 3))).toBeNull()
    })
  })

  describe('GAME_STARTED', () => {
    it('initializes state from null', () => {
      const state = reducer(null, evGameStarted())
      expect(state.phase).toBe(PHASES.PLACEMENT)
      expect(state.wave).toBe(1)
      expect(state.lives).toBe(INITIAL_LIVES)
      expect(state.towers).toEqual([])
      expect(state.enemies).toEqual([])
      expect(state.won).toBe(false)
    })

    it('resets to initial state when called mid-game', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evTowerPlaced('t1', 3, 3))
      state = reducer(state, evWaveStarted(1, 5, 3))
      const reset = reducer(state, evGameStarted())
      expect(reset.towers).toEqual([])
      expect(reset.wave).toBe(1)
      expect(reset.phase).toBe(PHASES.PLACEMENT)
    })
  })

  describe('TOWER_PLACED', () => {
    it('adds the tower to the towers array', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evTowerPlaced('t1', 4, 4))
      expect(state.towers).toHaveLength(1)
      expect(state.towers[0]).toEqual({ id: 't1', col: 4, row: 4 })
    })

    it('accumulates multiple towers without replacing earlier ones', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evTowerPlaced('t1', 4, 4))
      state = reducer(state, evTowerPlaced('t2', 5, 4))
      expect(state.towers).toHaveLength(2)
      expect(state.towers.map(t => t.id)).toEqual(['t1', 't2'])
    })
  })

  describe('WAVE_STARTED', () => {
    it('transitions to wave phase and records wave params', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 7, 4))
      expect(state.phase).toBe(PHASES.WAVE)
      expect(state.totalEnemies).toBe(7)
      expect(state.enemyHp).toBe(4)
    })

    it('resets enemies and spawnedCount', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      expect(state.enemies).toEqual([])
      expect(state.spawnedCount).toBe(0)
    })
  })

  describe('ENEMY_SPAWNED', () => {
    it('adds an enemy at progress 0 and increments spawnedCount', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      expect(state.enemies).toHaveLength(1)
      expect(state.enemies[0]).toEqual({ id: 'e1', hp: 3, progress: 0 })
      expect(state.spawnedCount).toBe(1)
    })
  })

  describe('ENEMY_MOVED', () => {
    it('updates the target enemy progress', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      state = reducer(state, evEnemyMoved('e1', 5))
      expect(state.enemies[0].progress).toBe(5)
    })

    it('does not affect other enemies', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      state = reducer(state, evEnemySpawned('e2', 3))
      state = reducer(state, evEnemyMoved('e1', 3))
      expect(state.enemies.find(e => e.id === 'e2').progress).toBe(0)
    })
  })

  describe('ENEMY_HIT', () => {
    it('reduces the enemy HP by the damage amount', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      state = reducer(state, evEnemyHit('e1', 't1', 1))
      expect(state.enemies[0].hp).toBe(2)
    })

    it('does not affect other enemies', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      state = reducer(state, evEnemySpawned('e2', 3))
      state = reducer(state, evEnemyHit('e1', 't1', 2))
      expect(state.enemies.find(e => e.id === 'e2').hp).toBe(3)
    })
  })

  describe('ENEMY_KILLED', () => {
    it('removes the enemy from the array', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      state = reducer(state, evEnemySpawned('e2', 3))
      state = reducer(state, evEnemyKilled('e1'))
      expect(state.enemies).toHaveLength(1)
      expect(state.enemies[0].id).toBe('e2')
    })
  })

  describe('ENEMY_REACHED_END', () => {
    it('removes the enemy and decrements lives', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      state = reducer(state, evEnemyReachedEnd('e1'))
      expect(state.enemies).toHaveLength(0)
      expect(state.lives).toBe(INITIAL_LIVES - 1)
    })

    it('decrements lives for each enemy that reaches the end', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evEnemySpawned('e1', 3))
      state = reducer(state, evEnemySpawned('e2', 3))
      state = reducer(state, evEnemyReachedEnd('e1'))
      state = reducer(state, evEnemyReachedEnd('e2'))
      expect(state.lives).toBe(INITIAL_LIVES - 2)
    })
  })

  describe('WAVE_COMPLETED', () => {
    it('returns to placement phase and increments wave counter', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evWaveStarted(1, 5, 3))
      state = reducer(state, evWaveCompleted(1, 10))
      expect(state.phase).toBe(PHASES.PLACEMENT)
      expect(state.wave).toBe(2)
    })
  })

  describe('GAME_OVER', () => {
    it('transitions to game_over phase on win', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evGameOver(true, 5))
      expect(state.phase).toBe(PHASES.GAME_OVER)
      expect(state.won).toBe(true)
    })

    it('transitions to game_over phase on loss', () => {
      let state = reducer(null, evGameStarted())
      state = reducer(state, evGameOver(false, 2))
      expect(state.phase).toBe(PHASES.GAME_OVER)
      expect(state.won).toBe(false)
    })
  })

  describe('event sourcing: replay property', () => {
    it('produces the same state whether events are applied incrementally or replayed in batch', () => {
      const events = [
        evGameStarted(),
        evTowerPlaced('t1', 4, 4),
        evTowerPlaced('t2', 5, 4),
        evWaveStarted(1, 5, 3),
        evEnemySpawned('e1', 3),
        evEnemyMoved('e1', 2),
        evEnemyHit('e1', 't1', 1),
        evWaveCompleted(1, 10),
      ]

      let incrementalState = null
      for (const ev of events) {
        incrementalState = reducer(incrementalState, ev)
      }

      const batchState = events.reduce(reducer, null)

      expect(batchState).toEqual(incrementalState)
    })
  })
})
