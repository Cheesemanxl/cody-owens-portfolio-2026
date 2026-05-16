import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import styles from './Profile.module.css'

export default function Profile() {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

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
          <span className={styles.value}>—</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Best Wave</span>
          <span className={styles.value}>—</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Member Since</span>
          <span className={styles.value}>{memberSince}</span>
        </div>
      </div>

      <section className={styles.replays}>
        <h2>Game Replays</h2>
        <div className={styles.empty}>
          <p>No replays yet.</p>
          <p className={styles.muted}>Play a game to record your first replay.</p>
          <Link to="/game">Play now</Link>
        </div>
      </section>
    </div>
  )
}
