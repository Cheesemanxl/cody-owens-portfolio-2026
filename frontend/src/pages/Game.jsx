import styles from './Game.module.css'

export default function Game() {
  return (
    <div className={styles.page}>
      <h1>Tower Defense</h1>
      <p className={styles.subtitle}>Coming soon — event sourcing in action.</p>
      <div className={styles.canvas}>
        <span>Game canvas will render here</span>
      </div>
    </div>
  )
}
