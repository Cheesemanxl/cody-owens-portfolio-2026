import { Link } from 'react-router-dom'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Cody Owens</h1>
        <p className={styles.title}>Software Engineer</p>
        <p className={styles.bio}>
          Building reliable backend systems and internal tooling at General Motors.
          Go, React, PostgreSQL, and event-driven architecture.
        </p>
        <div className={styles.links}>
          <a href="https://github.com/Cheesemanxl" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/cody-owens-dev" target="_blank" rel="noreferrer">LinkedIn</a>
          <Link to="/game">Play the Game</Link>
        </div>
      </section>
    </div>
  )
}
