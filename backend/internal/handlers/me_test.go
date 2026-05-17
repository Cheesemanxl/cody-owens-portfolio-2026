package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
	_ "modernc.org/sqlite"
)

func openTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Exec(`
		CREATE TABLE users (
			id TEXT PRIMARY KEY,
			provider TEXT NOT NULL,
			username TEXT NOT NULL,
			slug TEXT UNIQUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func requestWithPrincipal(p *auth.Principal) *http.Request {
	return auth.WithPrincipal(httptest.NewRequest(http.MethodGet, "/api/me", nil), p)
}

func TestMe_unauthenticated(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	Me(db).ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/api/me", nil))

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("got %d, want 401", rr.Code)
	}
}

func TestMe_createsUser(t *testing.T) {
	db := openTestDB(t)
	p := &auth.Principal{UserID: "u1", IdentityProvider: "github", UserDetails: "coder"}

	rr := httptest.NewRecorder()
	Me(db).ServeHTTP(rr, requestWithPrincipal(p))

	if rr.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rr.Code)
	}

	var body map[string]string
	json.NewDecoder(rr.Body).Decode(&body)
	if body["id"] != "u1" {
		t.Errorf("id: got %q, want %q", body["id"], "u1")
	}
	if body["username"] != "coder" {
		t.Errorf("username: got %q, want %q", body["username"], "coder")
	}
}

func TestMe_idempotent(t *testing.T) {
	db := openTestDB(t)
	p := &auth.Principal{UserID: "u1", IdentityProvider: "github", UserDetails: "coder"}

	Me(db).ServeHTTP(httptest.NewRecorder(), requestWithPrincipal(p))
	rr := httptest.NewRecorder()
	Me(db).ServeHTTP(rr, requestWithPrincipal(p))

	if rr.Code != http.StatusOK {
		t.Errorf("second call got %d, want 200", rr.Code)
	}
}
