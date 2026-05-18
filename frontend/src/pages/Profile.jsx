import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import styles from './Profile.module.css'

export default function Profile() {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [replays, setReplays] = useState([])

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then(r => {
        if (r.status === 404) { setStatus('not-found'); return null }
        if (!r.ok) { setStatus('error'); return null }
        return r.json()
      })
      .then(data => {
        if (data) { setUser(data); setStatus('loaded') }
      })
      .catch(() => setStatus('error'))

    fetch(`/api/replays/${userId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setReplays(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [userId])

  if (status === 'loading') return <div className={styles.page}><p className={styles.muted}>Loading...</p></div>
  if (status === 'not-found') return <div className={styles.page}><h1>Player not found</h1><Link to="/">Go home</Link></div>
  if (status === 'error') return <div className={styles.page}><p className={styles.muted}>Something went wrong.</p></div>

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
        <div>
          <h1>{user.username}</h1>
          <span className={styles.provider}>{user.provider}</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Games Played</span>
          <span className={styles.value}>{replays.length || '—'}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Best Wave</span>
          <span className={styles.value}>
            {replays.length ? Math.max(...replays.map(r => r.waveReached)) : '—'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Member Since</span>
          <span className={styles.value}>{memberSince}</span>
        </div>
      </div>

      <section className={styles.replays}>
        <h2>Game Replays</h2>
        {replays.length === 0 ? (
          <div className={styles.empty}>
            <p>No replays yet.</p>
            <p className={styles.muted}>Play a game to record your first replay.</p>
            <Link to="/game">Play now</Link>
          </div>
        ) : (
          <div className={styles.replayList}>
            {replays.map(r => (
              <div key={r.id} className={styles.replayRow}>
                <span className={r.won ? styles.won : styles.lost}>
                  {r.won ? '🏆 Win' : '💀 Loss'}
                </span>
                <span className={styles.replayMeta}>Wave {r.waveReached}</span>
                <span className={styles.replayDate}>
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
