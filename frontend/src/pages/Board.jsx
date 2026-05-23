import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './Board.module.css'

const LANES = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const LANE_IDS = LANES.map(l => l.id)

export default function Board() {
  const { user, loading } = useAuth()
  const [cards, setCards] = useState([])
  const [drafts, setDrafts] = useState({ todo: '', inprogress: '', done: '' })
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const dragging = useRef(null)
  const tempSeq  = useRef(0)

  useEffect(() => {
    if (!user) return
    fetch('/api/cards')
      .then(r => r.json())
      .then(setCards)
      .catch(() => {})
  }, [user])

  if (loading) return null
  if (!user) return (
    <div className={styles.unauth}>
      <h1>Task Board</h1>
      <p className={styles.unauthCopy}>
        Track what you're working on with a personal kanban board — organize tasks across To Do, In Progress, and Done.
      </p>
      <div className={styles.unauthActions}>
        <a href="/.auth/login/github" className={styles.loginBtn}>Sign in with GitHub</a>
        <a href="/.auth/login/google" className={styles.loginBtn}>Sign in with Google</a>
      </div>
    </div>
  )

  async function patchLane(id, lane) {
    const prevLane = cards.find(c => c.id === id)?.lane
    setCards(prev => prev.map(c => c.id === id ? { ...c, lane } : c))
    const res = await fetch(`/api/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane }),
    })
    if (!res.ok) {
      setCards(prev => prev.map(c => c.id === id ? { ...c, lane: prevLane } : c))
      setError('Failed to move card. Try again.')
    }
  }

  async function addCard(lane) {
    const title = drafts[lane].trim()
    if (!title) return
    const tempId = `temp-${++tempSeq.current}`
    setCards(prev => [...prev, { id: tempId, lane, title }])
    setDrafts(prev => ({ ...prev, [lane]: '' }))
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane, title }),
    })
    if (res.ok) {
      const card = await res.json()
      setCards(prev => prev.map(c => c.id === tempId ? card : c))
    } else {
      setCards(prev => prev.filter(c => c.id !== tempId))
      setError('Failed to add card. Try again.')
    }
  }

  async function deleteCard(id) {
    const removed = cards.find(c => c.id === id)
    setCards(prev => prev.filter(c => c.id !== id))
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setCards(prev => [...prev, removed])
      setError('Failed to delete card. Try again.')
    }
  }

  function onDragStart(card) {
    dragging.current = card
  }

  function onDragEnd() {
    dragging.current = null
    setDragOver(null)
  }

  function onDrop(laneId) {
    const card = dragging.current
    if (!card || card.lane === laneId) return
    patchLane(card.id, laneId)
    setDragOver(null)
  }

  return (
    <>
    {error && (
      <div className={styles.error} role="alert">
        {error}
        <button className={styles.errorDismiss} onClick={() => setError(null)}>×</button>
      </div>
    )}
    <div className={styles.board}>
      {LANES.map((lane, laneIdx) => (
        <div
          key={lane.id}
          className={`${styles.column} ${dragOver === lane.id ? styles.dragOver : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(lane.id) }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => onDrop(lane.id)}
        >
          <h2 className={styles.columnHeader}>{lane.label}</h2>
          <div className={styles.cards}>
            {cards.filter(c => c.lane === lane.id).map(card => (
              <div
                key={card.id}
                className={styles.card}
                draggable
                onDragStart={() => onDragStart(card)}
                onDragEnd={onDragEnd}
              >
                <button
                  className={styles.moveBtn}
                  onClick={() => patchLane(card.id, LANE_IDS[laneIdx - 1])}
                  disabled={laneIdx === 0}
                  aria-label="Move left"
                >←</button>
                <span className={styles.cardTitle}>{card.title}</span>
                <button
                  className={styles.moveBtn}
                  onClick={() => patchLane(card.id, LANE_IDS[laneIdx + 1])}
                  disabled={laneIdx === LANE_IDS.length - 1}
                  aria-label="Move right"
                >→</button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => deleteCard(card.id)}
                  aria-label="Delete card"
                >×</button>
              </div>
            ))}
          </div>
          <form
            className={styles.addForm}
            onSubmit={e => { e.preventDefault(); addCard(lane.id) }}
          >
            <input
              className={styles.addInput}
              value={drafts[lane.id]}
              onChange={e => setDrafts(prev => ({ ...prev, [lane.id]: e.target.value }))}
              placeholder="Add a card..."
            />
            <button type="submit" className={styles.addBtn}>Add</button>
          </form>
        </div>
      ))}
    </div>
    </>
  )
}
