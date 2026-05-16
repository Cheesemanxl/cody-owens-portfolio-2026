package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type profileResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Provider  string `json:"provider"`
	CreatedAt string `json:"createdAt"`
}

func Profile(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := chi.URLParam(r, "userId")

		var p profileResponse
		var rawCreatedAt string
		err := db.QueryRowContext(r.Context(),
			`SELECT id, provider, username, created_at FROM users WHERE id = ?`, userID,
		).Scan(&p.ID, &p.Provider, &p.Username, &rawCreatedAt)
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		if t, parseErr := time.Parse("2006-01-02 15:04:05", rawCreatedAt); parseErr == nil {
			p.CreatedAt = t.UTC().Format(time.RFC3339)
		} else {
			p.CreatedAt = rawCreatedAt
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(p)
	}
}
