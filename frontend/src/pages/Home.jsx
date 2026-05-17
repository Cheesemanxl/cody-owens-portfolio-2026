import { Link } from 'react-router-dom'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img src="/headshot.jpg" alt="Cody Owens" className={styles.headshot} />
        <div className={styles.heroText}>
          <h1><img src="/chibi-cody.png" alt="" className={styles.chibi} />Cody Owens</h1>
          <p className={styles.title}>Software Engineer</p>
          <p className={styles.bio}>
            Building reliable backend systems and internal tooling at General Motors.
            Go, React, PostgreSQL, and event-driven architecture.
          </p>
          <div className={styles.links}>
            <a href="https://github.com/Cheesemanxl" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/cody-owens-dev" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="/cody-owens-resume.pdf" download>Resume</a>
            <Link to="/game">Play the Game</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
