import { tick } from './engine.js'
import { EV } from './events.js'
import { PATH, SPAWN_EVERY } from './constants.js'
import { PHASES } from './reducer.js'

// Build a minimal wave-phase game state for engine tests
function makeState({ towers = [], enemies = [], spawnedCount = 0, totalEnemies = 5, enemyHp = 3 } = {}) {
  return {
    phase: PHASES.WAVE,
    wave: 1,
    lives: 10,
    towers,
    enemies,
    spawnedCount,
    totalEnemies,
    enemyHp,
    won: false,
  }
}

describe('engine tick', () => {
  describe('spawning', () => {
    it(`spawns an enemy on tick 1 (tickN % ${SPAWN_EVERY} === 1)`, () => {
      const events = tick(makeState(), 1)
      const spawns = events.filter(e => e.type === EV.ENEMY_SPAWNED)
      expect(spawns).toHaveLength(1)
      expect(spawns[0].hp).toBe(3)
      expect(typeof spawns[0].id).toBe('string')
    })

    it('spawns with the state enemyHp value', () => {
      const events = tick(makeState({ enemyHp: 7 }), 1)
      const spawns = events.filter(e => e.type === EV.ENEMY_SPAWNED)
      expect(spawns[0].hp).toBe(7)
    })

    it('does not spawn on a non-spawn tick', () => {
      const events = tick(makeState(), 2)
      const spawns = events.filter(e => e.type === EV.ENEMY_SPAWNED)
      expect(spawns).toHaveLength(0)
    })

    it('spawns on tick 4 (the second spawn tick)', () => {
      const events = tick(makeState({ spawnedCount: 1 }), 4)
      const spawns = events.filter(e => e.type === EV.ENEMY_SPAWNED)
      expect(spawns).toHaveLength(1)
    })

    it('does not spawn when spawnedCount has reached totalEnemies', () => {
      const events = tick(makeState({ spawnedCount: 5, totalEnemies: 5 }), 1)
      const spawns = events.filter(e => e.type === EV.ENEMY_SPAWNED)
      expect(spawns).toHaveLength(0)
    })
  })

  describe('enemy movement', () => {
    it('emits ENEMY_MOVED advancing progress by 1', () => {
      const state = makeState({ enemies: [{ id: 'e1', hp: 3, progress: 0 }], spawnedCount: 1 })
      const events = tick(state, 2)
      const moved = events.filter(e => e.type === EV.ENEMY_MOVED)
      expect(moved).toHaveLength(1)
      expect(moved[0]).toMatchObject({ id: 'e1', progress: 1 })
    })

    it('moves each enemy independently', () => {
      const state = makeState({
        enemies: [
          { id: 'e1', hp: 3, progress: 0 },
          { id: 'e2', hp: 3, progress: 3 },
        ],
        spawnedCount: 2,
      })
      const events = tick(state, 2)
      const moved = events.filter(e => e.type === EV.ENEMY_MOVED)
      expect(moved).toHaveLength(2)
      expect(moved.find(e => e.id === 'e1').progress).toBe(1)
      expect(moved.find(e => e.id === 'e2').progress).toBe(4)
    })

    it('emits ENEMY_REACHED_END for an enemy at the last path step', () => {
      const lastProgress = PATH.length - 1
      const state = makeState({ enemies: [{ id: 'e1', hp: 3, progress: lastProgress }], spawnedCount: 5 })
      const events = tick(state, 2)
      const reached = events.filter(e => e.type === EV.ENEMY_REACHED_END)
      expect(reached).toHaveLength(1)
      expect(reached[0].id).toBe('e1')
    })

    it('does not emit ENEMY_MOVED for an enemy at the last path step', () => {
      const lastProgress = PATH.length - 1
      const state = makeState({ enemies: [{ id: 'e1', hp: 3, progress: lastProgress }], spawnedCount: 5 })
      const events = tick(state, 2)
      const moved = events.filter(e => e.type === EV.ENEMY_MOVED)
      expect(moved).toHaveLength(0)
    })
  })

  describe('tower targeting', () => {
    // PATH[1] = [1,2]. Tower at (1,4): distance = hypot(0,2) = 2 ≤ TOWER_RANGE 2.5
    // Enemy at progress=0 moves to progress=1 → cell [1,2], so tower can hit it.
    it('emits ENEMY_HIT when a tower is within range of a moved enemy', () => {
      const state = makeState({
        towers: [{ id: 't1', col: 1, row: 4 }],
        enemies: [{ id: 'e1', hp: 3, progress: 0 }],
        spawnedCount: 5,
      })
      const events = tick(state, 2)
      const hits = events.filter(e => e.type === EV.ENEMY_HIT)
      expect(hits).toHaveLength(1)
      expect(hits[0]).toMatchObject({ enemyId: 'e1', towerId: 't1', damage: 1 })
    })

    it('does not emit ENEMY_HIT when tower is out of range', () => {
      // Tower at far corner (9,0): distance to PATH[1]=[1,2] ≈ 8.25 > 2.5
      const state = makeState({
        towers: [{ id: 't1', col: 9, row: 0 }],
        enemies: [{ id: 'e1', hp: 3, progress: 0 }],
        spawnedCount: 5,
      })
      const events = tick(state, 2)
      const hits = events.filter(e => e.type === EV.ENEMY_HIT)
      expect(hits).toHaveLength(0)
    })

    it('each tower fires independently at the highest-progress enemy in range', () => {
      // Both towers near PATH[1]=[1,2] — only one enemy to target
      const state = makeState({
        towers: [
          { id: 't1', col: 1, row: 4 },
          { id: 't2', col: 0, row: 3 },
        ],
        enemies: [{ id: 'e1', hp: 3, progress: 0 }],
        spawnedCount: 5,
      })
      const events = tick(state, 2)
      const hits = events.filter(e => e.type === EV.ENEMY_HIT)
      expect(hits).toHaveLength(2)
      expect(hits.every(h => h.enemyId === 'e1')).toBe(true)
      const towerIds = hits.map(h => h.towerId)
      expect(towerIds).toContain('t1')
      expect(towerIds).toContain('t2')
    })
  })

  describe('enemy kill', () => {
    it('emits ENEMY_KILLED when accumulated damage exhausts pre-tick HP', () => {
      // Enemy hp=1, tower in range → 1 damage → 1-1=0 → killed
      const state = makeState({
        towers: [{ id: 't1', col: 1, row: 4 }],
        enemies: [{ id: 'e1', hp: 1, progress: 0 }],
        spawnedCount: 5,
      })
      const events = tick(state, 2)
      const kills = events.filter(e => e.type === EV.ENEMY_KILLED)
      expect(kills).toHaveLength(1)
      expect(kills[0].id).toBe('e1')
    })

    it('does not emit ENEMY_KILLED when damage does not exhaust HP', () => {
      const state = makeState({
        towers: [{ id: 't1', col: 1, row: 4 }],
        enemies: [{ id: 'e1', hp: 3, progress: 0 }],
        spawnedCount: 5,
      })
      const events = tick(state, 2)
      const kills = events.filter(e => e.type === EV.ENEMY_KILLED)
      expect(kills).toHaveLength(0)
    })

    it('kills an enemy when multiple towers combine to exhaust its HP', () => {
      // Two towers in range, enemy hp=2 → 2 hits → killed
      const state = makeState({
        towers: [
          { id: 't1', col: 1, row: 4 },
          { id: 't2', col: 0, row: 3 },
        ],
        enemies: [{ id: 'e1', hp: 2, progress: 0 }],
        spawnedCount: 5,
      })
      const events = tick(state, 2)
      const kills = events.filter(e => e.type === EV.ENEMY_KILLED)
      expect(kills).toHaveLength(1)
      expect(kills[0].id).toBe('e1')
    })
  })

  describe('event ordering', () => {
    it('emits events in order: spawn, move, hit, kill', () => {
      const state = makeState({
        towers: [{ id: 't1', col: 1, row: 4 }],
        enemies: [{ id: 'e1', hp: 1, progress: 0 }],
        spawnedCount: 0,
        totalEnemies: 5,
      })
      const events = tick(state, 1)
      const types = events.map(e => e.type)
      const spawnIdx = types.indexOf(EV.ENEMY_SPAWNED)
      const moveIdx  = types.indexOf(EV.ENEMY_MOVED)
      const hitIdx   = types.indexOf(EV.ENEMY_HIT)
      const killIdx  = types.indexOf(EV.ENEMY_KILLED)
      expect(spawnIdx).toBeLessThan(moveIdx)
      expect(moveIdx).toBeLessThan(hitIdx)
      expect(hitIdx).toBeLessThan(killIdx)
    })
  })
})
