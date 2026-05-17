package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"unicode"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
)

func Me(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		p := auth.GetPrincipal(r)
		if p == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		slug, err := upsertUser(r, db, p)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"id":       p.UserID,
			"username": p.UserDetails,
			"provider": p.IdentityProvider,
			"slug":     slug,
		})
	}
}

func upsertUser(r *http.Request, db *sql.DB, p *auth.Principal) (string, error) {
	slug := makeSlug(p.UserDetails)
	_, err := db.ExecContext(r.Context(), `
		INSERT INTO users (id, provider, username, slug) VALUES (?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET username = excluded.username, slug = excluded.slug
	`, p.UserID, p.IdentityProvider, p.UserDetails, slug)
	if err == nil {
		return slug, nil
	}
	// Slug collision with a different user — disambiguate with provider suffix
	if strings.Contains(err.Error(), "UNIQUE constraint failed: users.slug") {
		slug = fmt.Sprintf("%s-%s", slug, p.IdentityProvider)
		_, err = db.ExecContext(r.Context(), `
			INSERT INTO users (id, provider, username, slug) VALUES (?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET username = excluded.username, slug = excluded.slug
		`, p.UserID, p.IdentityProvider, p.UserDetails, slug)
	}
	return slug, err
}

func makeSlug(username string) string {
	s := strings.ToLower(username)
	// For email addresses use the local part only
	if i := strings.Index(s, "@"); i > 0 {
		s = s[:i]
	}
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		} else {
			b.WriteRune('-')
		}
	}
	slug := strings.Trim(b.String(), "-")
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	return slug
}
