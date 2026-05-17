import { PATH, TOWER_RANGE, TOWER_DAMAGE, SPAWN_EVERY } from './constants.js'
import { EV, evEnemySpawned, evEnemyMoved, evEnemyHit, evEnemyKilled, evEnemyReachedEnd } from './events.js'

function uid() {
  return Math.random().toString(36).slice(2, 7)
}

// tick(state, tickN) → Event[]
//
// Reads current game state and produces the events for one game tick.
// Never mutates state — the caller appends returned events to the log
// and re-derives state via the reducer.
export function tick(state, tickN) {
  const events = []

  // 1. Spawn a new enemy every SPAWN_EVERY ticks
  if (state.spawnedCount < state.totalEnemies && tickN % SPAWN_EVERY === 1) {
    events.push(evEnemySpawned(`e-${uid()}`, state.enemyHp))
  }

  // 2. Move each living enemy one step along the path
  //    Track their new positions for tower targeting in step 3
  const movedEnemies = []
  for (const enemy of state.enemies) {
    const next = enemy.progress + 1
    if (next >= PATH.length) {
      events.push(evEnemyReachedEnd(enemy.id))
    } else {
      events.push(evEnemyMoved(enemy.id, next))
      movedEnemies.push({ ...enemy, progress: next })
    }
  }

  // 3. Each tower targets the highest-progress enemy within range and fires
  const dmg = new Map() // enemyId → accumulated damage this tick
  for (const tower of state.towers) {
    const target = movedEnemies
      .slice()
      .sort((a, b) => b.progress - a.progress)
      .find(({ progress }) => {
        const [ec, er] = PATH[progress]
        return Math.hypot(tower.col - ec, tower.row - er) <= TOWER_RANGE
      })
    if (target) {
      events.push(evEnemyHit(target.id, tower.id, TOWER_DAMAGE))
      dmg.set(target.id, (dmg.get(target.id) ?? 0) + TOWER_DAMAGE)
    }
  }

  // 4. Kill enemies whose HP is exhausted by this tick's hits
  //    Compare against pre-tick HP (from state.enemies, before events are applied)
  for (const [id, totalDmg] of dmg) {
    const enemy = state.enemies.find(e => e.id === id)
    if (enemy && enemy.hp - totalDmg <= 0) {
      events.push(evEnemyKilled(id))
    }
  }

  return events
}
