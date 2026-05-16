import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Nav.module.css'

export default function Nav() {
  const { user } = useAuth()

  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.brand}>Cody Owens</NavLink>
      <div className={styles.links}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : undefined}>Home</NavLink>
        <NavLink to="/game" className={({ isActive }) => isActive ? styles.active : undefined}>Game</NavLink>
        {user
          ? <a href="/.auth/logout">Sign out</a>
          : <a href="/.auth/login/github">Sign in</a>
        }
      </div>
    </nav>
  )
}
