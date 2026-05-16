import { useParams } from 'react-router-dom'
import styles from './Profile.module.css'

export default function Profile() {
  const { userId } = useParams()

  return (
    <div className={styles.page}>
      <h1>Player Profile</h1>
      <p className={styles.id}>User: {userId}</p>
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
          <span className={styles.value}>—</span>
        </div>
      </div>
    </div>
  )
}
