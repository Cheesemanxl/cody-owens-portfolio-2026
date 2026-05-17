export const COLS = 10
export const ROWS = 6
export const CELL_PX = 64

// Z-shaped path: enter left at (0,2), exit right at (9,5)
//
//  col: 0  1  2  3  4  5  6  7  8  9
//  row 0: .  .  P  P  P  P  P  P  .  .
//  row 1: .  .  P  .  .  .  .  P  .  .
//  row 2: E  P  P  .  .  .  .  P  .  .
//  row 3: .  .  .  P  P  P  P  P  .  .
//  row 4: .  .  .  P  .  .  .  .  .  .
//  row 5: .  .  .  P  P  P  P  P  P  X
export const PATH = [
  [0,2],[1,2],[2,2],
  [2,1],[2,0],
  [3,0],[4,0],[5,0],[6,0],[7,0],
  [7,1],[7,2],[7,3],
  [6,3],[5,3],[4,3],[3,3],
  [3,4],[3,5],
  [4,5],[5,5],[6,5],[7,5],[8,5],[9,5],
]

export const PATH_SET = new Set(PATH.map(([c, r]) => `${c},${r}`))

export const TOWER_RANGE   = 2.5
export const TOWER_DAMAGE  = 1

export const ENEMIES_BASE  = 5    // enemies on wave 1
export const ENEMIES_SCALE = 2    // +2 per additional wave
export const ENEMY_BASE_HP = 3    // HP on wave 1
export const ENEMY_HP_SCALE = 1   // +1 HP per additional wave

export const SPAWN_EVERY   = 3    // ticks between enemy spawns
export const INITIAL_LIVES = 10
export const MAX_WAVES     = 5
export const TICK_MS       = 600
