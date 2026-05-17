package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
)

var p1 = &auth.Principal{UserID: "u1", IdentityProvider: "github", UserDetails: "coder"}
var p2 = &auth.Principal{UserID: "u2", IdentityProvider: "github", UserDetails: "other"}

func jsonBody(t *testing.T, v any) *bytes.Buffer {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return bytes.NewBuffer(b)
}

func cardRequest(method, cardID string, body *bytes.Buffer, p *auth.Principal) *http.Request {
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, "/api/cards/"+cardID, body)
	} else {
		req = httptest.NewRequest(method, "/api/cards/"+cardID, nil)
	}
	if p != nil {
		req = auth.WithPrincipal(req, p)
	}
	if cardID != "" {
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", cardID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	}
	return req
}

func seedCard(t *testing.T, db interface{ Exec(string, ...any) (interface{}, error) }, id, userID, lane, title string) {
	t.Helper()
}

// --- Cards (GET) ---

func TestCards_unauthenticated(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	Cards(db).ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/api/cards", nil))
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("got %d, want 401", rr.Code)
	}
}

func TestCards_returnsEmpty(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	req := auth.WithPrincipal(httptest.NewRequest(http.MethodGet, "/api/cards", nil), p1)
	Cards(db).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rr.Code)
	}
	var cards []card
	json.NewDecoder(rr.Body).Decode(&cards)
	if len(cards) != 0 {
		t.Errorf("expected empty list, got %d cards", len(cards))
	}
}

func TestCards_returnsOwnCardsOnly(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO cards (id, user_id, lane, title) VALUES ('c1', 'u1', 'todo', 'mine')`)
	db.Exec(`INSERT INTO cards (id, user_id, lane, title) VALUES ('c2', 'u2', 'todo', 'theirs')`)

	rr := httptest.NewRecorder()
	req := auth.WithPrincipal(httptest.NewRequest(http.MethodGet, "/api/cards", nil), p1)
	Cards(db).ServeHTTP(rr, req)

	var cards []card
	json.NewDecoder(rr.Body).Decode(&cards)
	if len(cards) != 1 {
		t.Fatalf("expected 1 card, got %d", len(cards))
	}
	if cards[0].Title != "mine" {
		t.Errorf("title: got %q, want %q", cards[0].Title, "mine")
	}
}

// --- CreateCard (POST) ---

func TestCreateCard_unauthenticated(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "todo", "title": "task"})
	CreateCard(db).ServeHTTP(rr, httptest.NewRequest(http.MethodPost, "/api/cards", body))
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("got %d, want 401", rr.Code)
	}
}

func TestCreateCard_createsCard(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "todo", "title": "my task"})
	req := auth.WithPrincipal(httptest.NewRequest(http.MethodPost, "/api/cards", body), p1)
	CreateCard(db).ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("got %d, want 201", rr.Code)
	}
	var c card
	json.NewDecoder(rr.Body).Decode(&c)
	if c.Title != "my task" {
		t.Errorf("title: got %q, want %q", c.Title, "my task")
	}
	if c.Lane != "todo" {
		t.Errorf("lane: got %q, want %q", c.Lane, "todo")
	}
	if c.ID == "" {
		t.Error("expected non-empty id")
	}
}

func TestCreateCard_invalidLane(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "invalid", "title": "task"})
	req := auth.WithPrincipal(httptest.NewRequest(http.MethodPost, "/api/cards", body), p1)
	CreateCard(db).ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("got %d, want 400", rr.Code)
	}
}

func TestCreateCard_emptyTitle(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "todo", "title": ""})
	req := auth.WithPrincipal(httptest.NewRequest(http.MethodPost, "/api/cards", body), p1)
	CreateCard(db).ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("got %d, want 400", rr.Code)
	}
}

func TestCreateCard_titleTooLong(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "todo", "title": strings.Repeat("x", 501)})
	req := auth.WithPrincipal(httptest.NewRequest(http.MethodPost, "/api/cards", body), p1)
	CreateCard(db).ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("got %d, want 400", rr.Code)
	}
}

// --- MoveCard (PATCH) ---

func TestMoveCard_unauthenticated(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "done"})
	MoveCard(db).ServeHTTP(rr, cardRequest(http.MethodPatch, "c1", body, nil))
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("got %d, want 401", rr.Code)
	}
}

func TestMoveCard_movesCard(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO cards (id, user_id, lane, title) VALUES ('c1', 'u1', 'todo', 'task')`)

	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "inprogress"})
	MoveCard(db).ServeHTTP(rr, cardRequest(http.MethodPatch, "c1", body, p1))

	if rr.Code != http.StatusNoContent {
		t.Errorf("got %d, want 204", rr.Code)
	}
	var lane string
	db.QueryRow(`SELECT lane FROM cards WHERE id = 'c1'`).Scan(&lane)
	if lane != "inprogress" {
		t.Errorf("lane after move: got %q, want %q", lane, "inprogress")
	}
}

func TestMoveCard_invalidLane(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "limbo"})
	MoveCard(db).ServeHTTP(rr, cardRequest(http.MethodPatch, "c1", body, p1))
	if rr.Code != http.StatusBadRequest {
		t.Errorf("got %d, want 400", rr.Code)
	}
}

func TestMoveCard_wrongUser(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO cards (id, user_id, lane, title) VALUES ('c1', 'u2', 'todo', 'theirs')`)

	rr := httptest.NewRecorder()
	body := jsonBody(t, map[string]string{"lane": "done"})
	MoveCard(db).ServeHTTP(rr, cardRequest(http.MethodPatch, "c1", body, p1))

	if rr.Code != http.StatusNotFound {
		t.Errorf("got %d, want 404", rr.Code)
	}
}

// --- DeleteCard ---

func TestDeleteCard_unauthenticated(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	DeleteCard(db).ServeHTTP(rr, cardRequest(http.MethodDelete, "c1", nil, nil))
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("got %d, want 401", rr.Code)
	}
}

func TestDeleteCard_deletesCard(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO cards (id, user_id, lane, title) VALUES ('c1', 'u1', 'todo', 'task')`)

	rr := httptest.NewRecorder()
	DeleteCard(db).ServeHTTP(rr, cardRequest(http.MethodDelete, "c1", nil, p1))

	if rr.Code != http.StatusNoContent {
		t.Errorf("got %d, want 204", rr.Code)
	}
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM cards WHERE id = 'c1'`).Scan(&count)
	if count != 0 {
		t.Error("expected card to be deleted")
	}
}

func TestDeleteCard_wrongUser(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO cards (id, user_id, lane, title) VALUES ('c1', 'u2', 'todo', 'theirs')`)

	rr := httptest.NewRecorder()
	DeleteCard(db).ServeHTTP(rr, cardRequest(http.MethodDelete, "c1", nil, p1))

	if rr.Code != http.StatusNotFound {
		t.Errorf("got %d, want 404", rr.Code)
	}
	// Card must still exist
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM cards WHERE id = 'c1'`).Scan(&count)
	if count != 1 {
		t.Error("expected card to still exist after rejected delete")
	}
}
