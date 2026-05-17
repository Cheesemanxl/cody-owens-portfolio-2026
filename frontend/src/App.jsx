import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Game from './pages/Game'
import Board from './pages/Board'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/board" element={<Board />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </ErrorBoundary>
  )
}
