import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Nav.module.css'

export default function Nav() {
  const { user, loading } = useAuth()

  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.brand}>
        <img src="/chibi-cody.png" alt="" className={styles.chibi} />Cody Owens
      </NavLink>
      <div className={styles.links}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : undefined}>Home</NavLink>
        <NavLink to="/game" className={({ isActive }) => isActive ? styles.active : undefined}>Event Sourcing Game</NavLink>
        <NavLink to="/board" className={({ isActive }) => isActive ? styles.active : undefined}>Task Board</NavLink>
        {!loading && (
          <>
            {user ? (
              <>
                <NavLink to={`/profile/${user.slug ?? user.userId}`} className={({ isActive }) => isActive ? styles.active : undefined}>
                  {user.userDetails}
                </NavLink>
                <a href="/.auth/logout">Sign out</a>
              </>
            ) : (
              <>
                <a href="/.auth/login/github">Sign in with GitHub</a>
                <a href="/.auth/login/google">Sign in with Google</a>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  )
}
