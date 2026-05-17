import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Board.module.css'

const LANES = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

export default function Board() {
  const { user, loading } = useAuth()
  const [cards, setCards] = useState([])
  const [drafts, setDrafts] = useState({ todo: '', inprogress: '', done: '' })

  useEffect(() => {
    if (!user) return
    fetch('/api/cards')
      .then(r => r.json())
      .then(setCards)
      .catch(() => {})
  }, [user])

  if (loading) return null
  if (!user) return <Navigate to="/" replace />

  async function addCard(lane) {
    const title = drafts[lane].trim()
    if (!title) return
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane, title }),
    })
    if (res.ok) {
      const card = await res.json()
      setCards(prev => [...prev, card])
      setDrafts(prev => ({ ...prev, [lane]: '' }))
    }
  }

  async function deleteCard(id) {
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCards(prev => prev.filter(c => c.id !== id))
    }
  }

  return (
    <div className={styles.board}>
      {LANES.map(lane => (
        <div key={lane.id} className={styles.column}>
          <h2 className={styles.columnHeader}>{lane.label}</h2>
          <div className={styles.cards}>
            {cards.filter(c => c.lane === lane.id).map(card => (
              <div key={card.id} className={styles.card}>
                <span>{card.title}</span>
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
  )
}
