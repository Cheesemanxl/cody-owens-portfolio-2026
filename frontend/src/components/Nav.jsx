import { NavLink } from 'react-router-dom'
import styles from './Nav.module.css'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.brand}>Cody Owens</NavLink>
      <div className={styles.links}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : undefined}>Home</NavLink>
        <NavLink to="/game" className={({ isActive }) => isActive ? styles.active : undefined}>Game</NavLink>
      </div>
    </nav>
  )
}
