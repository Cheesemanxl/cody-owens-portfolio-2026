import { useEffect, useRef } from 'react'
import { EV } from './events.js'
import styles from './EventLog.module.css'

const TYPE_COLOR = {
  [EV.GAME_STARTED]:      '#22c55e',
  [EV.TOWER_PLACED]:      '#6366f1',
  [EV.WAVE_STARTED]:      '#eab308',
  [EV.ENEMY_SPAWNED]:     '#f97316',
  [EV.ENEMY_MOVED]:       '#475569',
  [EV.ENEMY_HIT]:         '#f87171',
  [EV.ENEMY_KILLED]:      '#ef4444',
  [EV.ENEMY_REACHED_END]: '#dc2626',
  [EV.WAVE_COMPLETED]:    '#4ade80',
  [EV.GAME_OVER]:         '#e2e8f0',
}

function detail(ev) {
  switch (ev.type) {
    case EV.TOWER_PLACED:      return `id:${ev.id} (${ev.col},${ev.row})`
    case EV.WAVE_STARTED:      return `wave:${ev.wave} enemies:${ev.totalEnemies} hp:${ev.enemyHp}`
    case EV.ENEMY_SPAWNED:     return `id:${ev.id} hp:${ev.hp}`
    case EV.ENEMY_MOVED:       return `id:${ev.id} →${ev.progress}`
    case EV.ENEMY_HIT:         return `id:${ev.enemyId} -${ev.damage}hp by:${ev.towerId}`
    case EV.ENEMY_KILLED:      return `id:${ev.id}`
    case EV.ENEMY_REACHED_END: return `id:${ev.id}`
    case EV.WAVE_COMPLETED:    return `wave:${ev.wave} lives:${ev.livesRemaining}`
    case EV.GAME_OVER:         return ev.won ? `won after ${ev.wavesReached} waves` : `lost on wave ${ev.wavesReached}`
    default:                   return ''
  }
}

export default function EventLog({ events }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  return (
    <div className={styles.log}>
      <div className={styles.header}>
        Event Log <span className={styles.count}>({events.length})</span>
      </div>
      <div className={styles.entries}>
        {events.map((ev, i) => (
          <div key={i} className={styles.entry}>
            <span className={styles.seq}>#{i}</span>
            <span className={styles.type} style={{ color: TYPE_COLOR[ev.type] ?? '#e2e8f0' }}>
              {ev.type}
            </span>
            <span className={styles.detail}>{detail(ev)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
