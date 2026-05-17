// Event type constants
export const EV = {
  GAME_STARTED:      'GAME_STARTED',
  TOWER_PLACED:      'TOWER_PLACED',
  WAVE_STARTED:      'WAVE_STARTED',
  ENEMY_SPAWNED:     'ENEMY_SPAWNED',
  ENEMY_MOVED:       'ENEMY_MOVED',
  ENEMY_HIT:         'ENEMY_HIT',
  ENEMY_KILLED:      'ENEMY_KILLED',
  ENEMY_REACHED_END: 'ENEMY_REACHED_END',
  WAVE_COMPLETED:    'WAVE_COMPLETED',
  GAME_OVER:         'GAME_OVER',
}

// Factory functions — seq is assigned by the game log on append, not here
export const evGameStarted      = ()                          => ({ type: EV.GAME_STARTED })
export const evTowerPlaced      = (id, col, row)              => ({ type: EV.TOWER_PLACED, id, col, row })
export const evWaveStarted      = (wave, totalEnemies, hp)    => ({ type: EV.WAVE_STARTED, wave, totalEnemies, enemyHp: hp })
export const evEnemySpawned     = (id, hp)                    => ({ type: EV.ENEMY_SPAWNED, id, hp })
export const evEnemyMoved       = (id, progress)              => ({ type: EV.ENEMY_MOVED, id, progress })
export const evEnemyHit         = (enemyId, towerId, damage)  => ({ type: EV.ENEMY_HIT, enemyId, towerId, damage })
export const evEnemyKilled      = (id)                        => ({ type: EV.ENEMY_KILLED, id })
export const evEnemyReachedEnd  = (id)                        => ({ type: EV.ENEMY_REACHED_END, id })
export const evWaveCompleted    = (wave, lives)               => ({ type: EV.WAVE_COMPLETED, wave, livesRemaining: lives })
export const evGameOver         = (won, wave)                 => ({ type: EV.GAME_OVER, won, wavesReached: wave })
