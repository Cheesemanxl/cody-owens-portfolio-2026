import { useState, useEffect, useRef, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import {
  ENEMIES_BASE, ENEMIES_SCALE, ENEMY_BASE_HP, ENEMY_HP_SCALE,
  MAX_WAVES, TICK_MS, PATH_SET,
} from '../game/constants.js'
import {
  evGameStarted, evTowerPlaced, evWaveStarted,
  evWaveCompleted, evGameOver,
} from '../game/events.js'
import { reducer, PHASES } from '../game/reducer.js'
import { tick as engineTick } from '../game/engine.js'
import GameBoard from '../game/GameBoard.jsx'
import EventLog from '../game/EventLog.jsx'
import ReplayViewer from '../game/ReplayViewer.jsx'
import styles from './Game.module.css'

let towerSeq = 0

export default function Game() {
  const { user } = useContext(AuthContext)
  const [game, setGame] = useState({ events: [], state: null })
  const [showReplay, setShowReplay] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const tickRef  = useRef(0)
  const loopRef  = useRef(null)

  const { events, state } = game

  // ── Dispatch helpers ─────────────────────────────────────────────────────

  function dispatch(event) {
    setGame(prev => ({
      events: [...prev.events, event],
      state:  reducer(prev.state, event),
    }))
  }

  // ── Game actions ──────────────────────────────────────────────────────────

  async function handleSaveReplay() {
    if (!user || saveStatus === 'saving' || saveStatus === 'saved') return
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/replays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: game.events,
          won: game.state?.won ?? false,
          waveReached: game.state?.wave ?? 1,
        }),
      })
      setSaveStatus(res.ok ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    }
  }

  function handleStart() {
    stopLoop()
    towerSeq = 0
    setShowReplay(false)
    setSaveStatus(null)
    const ev = evGameStarted()
    setGame({ events: [ev], state: reducer(null, ev) })
  }

  function handleCellClick(col, row) {
    if (!state || state.phase !== PHASES.PLACEMENT) return
    if (PATH_SET.has(`${col},${row}`)) return
    if (state.towers.some(t => t.col === col && t.row === row)) return
    dispatch(evTowerPlaced(`t${++towerSeq}`, col, row))
  }

  function handleStartWave() {
    if (!state || state.phase !== PHASES.PLACEMENT) return
    const totalEnemies = ENEMIES_BASE + (state.wave - 1) * ENEMIES_SCALE
    const enemyHp      = ENEMY_BASE_HP + (state.wave - 1) * ENEMY_HP_SCALE
    const waveEv = evWaveStarted(state.wave, totalEnemies, enemyHp)

    // Apply wave start, then begin the tick loop
    setGame(prev => {
      const newState = reducer(prev.state, waveEv)
      startLoop()
      return { events: [...prev.events, waveEv], state: newState }
    })
  }

  // ── Game loop ─────────────────────────────────────────────────────────────

  function startLoop() {
    stopLoop()
    tickRef.current = 0
    loopRef.current = setInterval(() => {
      const t = ++tickRef.current
      setGame(prev => {
        if (prev.state?.phase !== PHASES.WAVE) {
          stopLoop()
          return prev
        }

        // Run engine for this tick
        const tickEvents = engineTick(prev.state, t)
        let   working    = tickEvents.reduce(reducer, prev.state)

        // Check for end-of-wave / game-over conditions
        const extraEvents = []
        if (working.lives <= 0) {
          extraEvents.push(evGameOver(false, working.wave))
        } else if (
          working.spawnedCount >= working.totalEnemies &&
          working.enemies.length === 0
        ) {
          if (working.wave >= MAX_WAVES) {
            extraEvents.push(evGameOver(true, working.wave))
          } else {
            extraEvents.push(evWaveCompleted(working.wave, working.lives))
          }
        }

        const allNew   = [...tickEvents, ...extraEvents]
        const final    = extraEvents.reduce(reducer, working)
        if (final.phase !== PHASES.WAVE) stopLoop()

        return { events: [...prev.events, ...allNew], state: final }
      })
    }, TICK_MS)
  }

  function stopLoop() {
    clearInterval(loopRef.current)
    loopRef.current = null
  }

  useEffect(() => () => stopLoop(), [])

  // ── Render ────────────────────────────────────────────────────────────────

  if (showReplay) {
    return (
      <div className={styles.page}>
        <ReplayViewer events={events} onClose={() => setShowReplay(false)} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Event Sourcing Game</h1>
        <p className={styles.subtitle}>
          {state
            ? `Wave ${state.wave} · ${state.lives} ❤ remaining`
            : 'An event sourcing demo — all state is derived by replaying an append-only log'}
        </p>
      </div>

      {!state && (
        <div className={styles.splash}>
          <ul className={styles.rules}>
            <li>Click empty cells to place towers</li>
            <li>Towers auto-attack the nearest enemy within range</li>
            <li>Stop enemies reaching the exit — you have {10} lives</li>
            <li>Survive {MAX_WAVES} waves to win</li>
          </ul>
          <button className={styles.btnPrimary} onClick={handleStart}>
            Start Game
          </button>
        </div>
      )}

      {state && (
        <div className={styles.layout}>
          <div className={styles.main}>
            {/* HUD */}
            <div className={styles.hud}>
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Wave</span>
                <span className={styles.hudValue}>{state.wave} / {MAX_WAVES}</span>
              </div>
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Lives</span>
                <span className={styles.hudValue} style={{ color: state.lives <= 3 ? '#ef4444' : 'inherit' }}>
                  {state.lives}
                </span>
              </div>
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Towers</span>
                <span className={styles.hudValue}>{state.towers.length}</span>
              </div>
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Phase</span>
                <span className={styles.hudValue}>{state.phase}</span>
              </div>
            </div>

            <GameBoard state={state} onCellClick={handleCellClick} />

            {/* Controls */}
            <div className={styles.controls}>
              {state.phase === PHASES.PLACEMENT && (
                <div className={styles.placementBar}>
                  <span className={styles.hint}>Click empty cells to place towers</span>
                  <button className={styles.btnPrimary} onClick={handleStartWave}>
                    ▶ Start Wave {state.wave}
                  </button>
                </div>
              )}
              {state.phase === PHASES.WAVE && (
                <p className={styles.hint}>Wave in progress…</p>
              )}
              {state.phase === PHASES.GAME_OVER && (
                <div className={styles.gameOver}>
                  <p className={state.won ? styles.won : styles.lost}>
                    {state.won ? '🏆 Victory — you survived all waves!' : '💀 Game over'}
                  </p>
                  <div className={styles.endButtons}>
                    <button className={styles.btnPrimary} onClick={handleStart}>
                      Play Again
                    </button>
                    <button className={styles.btnSecondary} onClick={() => setShowReplay(true)}>
                      Step-through Replay
                    </button>
                    {user && (
                      <button
                        className={styles.btnSecondary}
                        onClick={handleSaveReplay}
                        disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                      >
                        {saveStatus === 'saving' ? 'Saving…'
                          : saveStatus === 'saved' ? '✓ Saved'
                          : saveStatus === 'error' ? 'Retry Save'
                          : 'Save Replay'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <EventLog events={events} />
        </div>
      )}
    </div>
  )
}
