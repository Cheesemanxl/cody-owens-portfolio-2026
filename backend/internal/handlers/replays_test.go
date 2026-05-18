package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
)

func replayRequest(method, userID string, body interface{}, p *auth.Principal) *http.Request {
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, "/api/replays/"+userID, jsonBody(nil, body))
	} else {
		req = httptest.NewRequest(method, "/api/replays/"+userID, nil)
	}
	if p != nil {
		req = auth.WithPrincipal(req, p)
	}
	if userID != "" {
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("userId", userID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	}
	return req
}

func jsonBodyT(t *testing.T, v any) *httptest.ResponseRecorder {
	t.Helper()
	return httptest.NewRecorder()
}

// --- SaveReplay (POST) ---

func TestSaveReplay_unauthenticated(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := map[string]interface{}{"events": []string{}, "won": false, "waveReached": 1}
	req := httptest.NewRequest(http.MethodPost, "/api/replays", jsonBody(t, body))
	SaveReplay(db).ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("got %d, want 401", rr.Code)
	}
}

func TestSaveReplay_savesReplay(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO users (id, provider, username) VALUES ('u1', 'github', 'coder')`)

	rr := httptest.NewRecorder()
	body := map[string]interface{}{
		"events":      []map[string]string{{"type": "GAME_STARTED"}},
		"won":         true,
		"waveReached": 5,
	}
	req := auth.WithPrincipal(
		httptest.NewRequest(http.MethodPost, "/api/replays", jsonBody(t, body)),
		p1,
	)
	SaveReplay(db).ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("got %d, want 201", rr.Code)
	}
	var s replaySummary
	json.NewDecoder(rr.Body).Decode(&s)
	if s.ID == "" {
		t.Error("expected non-empty id")
	}
	if !s.Won {
		t.Error("expected won=true")
	}
	if s.WaveReached != 5 {
		t.Errorf("waveReached: got %d, want 5", s.WaveReached)
	}
}

func TestSaveReplay_badRequest_emptyEvents(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := map[string]interface{}{"events": nil, "won": false, "waveReached": 1}
	req := auth.WithPrincipal(
		httptest.NewRequest(http.MethodPost, "/api/replays", jsonBody(t, body)),
		p1,
	)
	SaveReplay(db).ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("got %d, want 400", rr.Code)
	}
}

func TestSaveReplay_badRequest_invalidWave(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	body := map[string]interface{}{
		"events":      []map[string]string{{"type": "GAME_STARTED"}},
		"won":         false,
		"waveReached": 0,
	}
	req := auth.WithPrincipal(
		httptest.NewRequest(http.MethodPost, "/api/replays", jsonBody(t, body)),
		p1,
	)
	SaveReplay(db).ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("got %d, want 400", rr.Code)
	}
}

// --- ListReplays (GET) ---

func TestListReplays_unknownUser(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	ListReplays(db).ServeHTTP(rr, replayRequest(http.MethodGet, "nobody", nil, nil))
	if rr.Code != http.StatusNotFound {
		t.Errorf("got %d, want 404", rr.Code)
	}
}

func TestListReplays_returnsEmpty(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO users (id, provider, username) VALUES ('u1', 'github', 'coder')`)

	rr := httptest.NewRecorder()
	ListReplays(db).ServeHTTP(rr, replayRequest(http.MethodGet, "u1", nil, nil))

	if rr.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rr.Code)
	}
	var replays []replaySummary
	json.NewDecoder(rr.Body).Decode(&replays)
	if len(replays) != 0 {
		t.Errorf("expected empty list, got %d", len(replays))
	}
}

func TestListReplays_returnsSavedReplays(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO users (id, provider, username) VALUES ('u1', 'github', 'coder')`)
	db.Exec(`INSERT INTO replays (id, user_id, events, won, wave_reached, created_at) VALUES ('r1', 'u1', '[]', 1, 5, '2024-01-01 00:00:00')`)
	db.Exec(`INSERT INTO replays (id, user_id, events, won, wave_reached, created_at) VALUES ('r2', 'u1', '[]', 0, 2, '2024-01-02 00:00:00')`)

	rr := httptest.NewRecorder()
	ListReplays(db).ServeHTTP(rr, replayRequest(http.MethodGet, "u1", nil, nil))

	if rr.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rr.Code)
	}
	var replays []replaySummary
	json.NewDecoder(rr.Body).Decode(&replays)
	if len(replays) != 2 {
		t.Fatalf("expected 2 replays, got %d", len(replays))
	}
	// Ordered newest first — r2 has later created_at
	if replays[0].ID != "r2" {
		t.Errorf("first replay id: got %q, want r2", replays[0].ID)
	}
}

func TestListReplays_resolvesBySlug(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO users (id, provider, username, slug) VALUES ('u1', 'github', 'coder', 'coder')`)
	db.Exec(`INSERT INTO replays (id, user_id, events, won, wave_reached) VALUES ('r1', 'u1', '[]', 1, 3)`)

	rr := httptest.NewRecorder()
	ListReplays(db).ServeHTTP(rr, replayRequest(http.MethodGet, "coder", nil, nil))

	if rr.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rr.Code)
	}
	var replays []replaySummary
	json.NewDecoder(rr.Body).Decode(&replays)
	if len(replays) != 1 {
		t.Errorf("expected 1 replay, got %d", len(replays))
	}
}

func TestListReplays_doesNotReturnOtherUsersReplays(t *testing.T) {
	db := openTestDB(t)
	db.Exec(`INSERT INTO users (id, provider, username) VALUES ('u1', 'github', 'coder')`)
	db.Exec(`INSERT INTO users (id, provider, username) VALUES ('u2', 'github', 'other')`)
	db.Exec(`INSERT INTO replays (id, user_id, events, won, wave_reached) VALUES ('r1', 'u2', '[]', 1, 5)`)

	rr := httptest.NewRecorder()
	ListReplays(db).ServeHTTP(rr, replayRequest(http.MethodGet, "u1", nil, nil))

	var replays []replaySummary
	json.NewDecoder(rr.Body).Decode(&replays)
	if len(replays) != 0 {
		t.Errorf("expected 0 replays for u1, got %d", len(replays))
	}
}
