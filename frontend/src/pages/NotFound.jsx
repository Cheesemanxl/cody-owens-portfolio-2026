import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Go home</Link>
    </div>
  )
}
