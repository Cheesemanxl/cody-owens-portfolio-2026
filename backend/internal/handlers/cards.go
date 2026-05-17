package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
)

type card struct {
	ID    string `json:"id"`
	Lane  string `json:"lane"`
	Title string `json:"title"`
}

var validLanes = map[string]bool{"todo": true, "inprogress": true, "done": true}

func Cards(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		p := auth.GetPrincipal(r)
		if p == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		rows, err := db.QueryContext(r.Context(),
			`SELECT id, lane, title FROM cards WHERE user_id = ? ORDER BY created_at`,
			p.UserID,
		)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		cards := []card{}
		for rows.Next() {
			var c card
			if err := rows.Scan(&c.ID, &c.Lane, &c.Title); err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			cards = append(cards, c)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cards)
	}
}

func CreateCard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		p := auth.GetPrincipal(r)
		if p == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var body struct {
			Lane  string `json:"lane"`
			Title string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		if !validLanes[body.Lane] || body.Title == "" {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		id := newID()
		_, err := db.ExecContext(r.Context(),
			`INSERT INTO cards (id, user_id, lane, title) VALUES (?, ?, ?, ?)`,
			id, p.UserID, body.Lane, body.Title,
		)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(card{ID: id, Lane: body.Lane, Title: body.Title})
	}
}

func MoveCard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		p := auth.GetPrincipal(r)
		if p == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var body struct {
			Lane string `json:"lane"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		if !validLanes[body.Lane] {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		cardID := chi.URLParam(r, "id")
		result, err := db.ExecContext(r.Context(),
			`UPDATE cards SET lane = ? WHERE id = ? AND user_id = ?`,
			body.Lane, cardID, p.UserID,
		)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		if n, _ := result.RowsAffected(); n == 0 {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func DeleteCard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		p := auth.GetPrincipal(r)
		if p == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		cardID := chi.URLParam(r, "id")
		result, err := db.ExecContext(r.Context(),
			`DELETE FROM cards WHERE id = ? AND user_id = ?`,
			cardID, p.UserID,
		)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		if n, _ := result.RowsAffected(); n == 0 {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func newID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
