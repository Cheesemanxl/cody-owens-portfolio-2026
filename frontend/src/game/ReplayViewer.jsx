import { useState, useEffect, useRef, useMemo } from 'react'
import { reducer } from './reducer.js'
import GameBoard from './GameBoard.jsx'
import styles from './ReplayViewer.module.css'

const PLAY_INTERVAL_MS = 400

export default function ReplayViewer({ events, onClose }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  // Derive game state at current step by replaying events[0..index]
  const replayState = useMemo(
    () => events.slice(0, index + 1).reduce(reducer, null),
    [events, index]
  )

  const current = events[index]

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIndex(i => {
          if (i >= events.length - 1) {
            setPlaying(false)
            return i
          }
          return i + 1
        })
      }, PLAY_INTERVAL_MS)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [playing, events.length])

  function prev() { setIndex(i => Math.max(0, i - 1)); setPlaying(false) }
  function next() { setIndex(i => Math.min(events.length - 1, i + 1)); setPlaying(false) }
  function togglePlay() { setPlaying(p => !p) }
  function restart() { setIndex(0); setPlaying(false) }

  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>Step-through Replay</h2>
        <button className={styles.close} onClick={onClose}>✕ Close</button>
      </div>

      {/* Progress bar */}
      <div className={styles.progress}>
        <input
          type="range"
          min={0}
          max={events.length - 1}
          value={index}
          onChange={e => { setIndex(Number(e.target.value)); setPlaying(false) }}
          className={styles.scrubber}
        />
        <span className={styles.counter}>{index + 1} / {events.length}</span>
      </div>

      {/* Transport controls */}
      <div className={styles.controls}>
        <button onClick={restart}   className={styles.btn} title="Restart">⏮</button>
        <button onClick={prev}      className={styles.btn} title="Previous event">← Prev</button>
        <button onClick={togglePlay} className={styles.btnPlay}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={next}      className={styles.btn} title="Next event">Next →</button>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Left: current event data */}
        <div className={styles.eventPane}>
          <div className={styles.paneHeader}>
            Event #{index} — <span className={styles.eventType}>{current?.type}</span>
          </div>
          <pre className={styles.json}>
            {JSON.stringify(current, null, 2)}
          </pre>

          <div className={styles.paneHeader} style={{ marginTop: '1rem' }}>
            State after this event
          </div>
          <div className={styles.stateSummary}>
            <span>phase: <b>{replayState?.phase ?? '—'}</b></span>
            <span>wave: <b>{replayState?.wave ?? '—'}</b></span>
            <span>lives: <b>{replayState?.lives ?? '—'}</b></span>
            <span>towers: <b>{replayState?.towers.length ?? 0}</b></span>
            <span>enemies: <b>{replayState?.enemies.length ?? 0}</b></span>
          </div>
          <div className={styles.replayNote}>
            State = events[0..{index}].reduce(reducer, null)
          </div>
        </div>

        {/* Right: board at this state */}
        <div className={styles.boardPane}>
          <GameBoard state={replayState} />
        </div>
      </div>
    </div>
  )
}
