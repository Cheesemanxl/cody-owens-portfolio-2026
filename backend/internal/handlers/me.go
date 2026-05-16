package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
)

func Me(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		p := auth.GetPrincipal(r)
		if p == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		_, err := db.ExecContext(r.Context(), `
			INSERT INTO users (id, provider, username) VALUES (?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET username = excluded.username
		`, p.UserID, p.IdentityProvider, p.UserDetails)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"id":       p.UserID,
			"username": p.UserDetails,
			"provider": p.IdentityProvider,
		})
	}
}
