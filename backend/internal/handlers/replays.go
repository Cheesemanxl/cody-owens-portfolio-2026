package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
)

type replaySummary struct {
	ID          string `json:"id"`
	Won         bool   `json:"won"`
	WaveReached int    `json:"waveReached"`
	CreatedAt   string `json:"createdAt"`
}

func SaveReplay(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		p := auth.GetPrincipal(r)
		if p == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var body struct {
			Events      json.RawMessage `json:"events"`
			Won         bool            `json:"won"`
			WaveReached int             `json:"waveReached"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		if len(body.Events) == 0 || string(body.Events) == "null" || body.WaveReached < 1 {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		id := newID()
		_, err := db.ExecContext(r.Context(),
			`INSERT INTO replays (id, user_id, events, won, wave_reached) VALUES (?, ?, ?, ?, ?)`,
			id, p.UserID, string(body.Events), body.Won, body.WaveReached,
		)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(replaySummary{
			ID:          id,
			Won:         body.Won,
			WaveReached: body.WaveReached,
			CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func ListReplays(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := chi.URLParam(r, "userId")

		// Resolve slug or id to the actual user id
		var resolvedID string
		err := db.QueryRowContext(r.Context(),
			`SELECT id FROM users WHERE slug = ? OR id = ? LIMIT 1`,
			userID, userID,
		).Scan(&resolvedID)
		if err == sql.ErrNoRows {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		rows, err := db.QueryContext(r.Context(),
			`SELECT id, won, wave_reached, created_at FROM replays WHERE user_id = ? ORDER BY created_at DESC`,
			resolvedID,
		)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		replays := []replaySummary{}
		for rows.Next() {
			var s replaySummary
			var rawCreatedAt string
			var wonInt int
			if err := rows.Scan(&s.ID, &wonInt, &s.WaveReached, &rawCreatedAt); err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			s.Won = wonInt != 0
			if t, parseErr := time.Parse("2006-01-02 15:04:05", rawCreatedAt); parseErr == nil {
				s.CreatedAt = t.UTC().Format(time.RFC3339)
			} else {
				s.CreatedAt = rawCreatedAt
			}
			replays = append(replays, s)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(replays)
	}
}
