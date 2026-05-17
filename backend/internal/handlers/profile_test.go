package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

func routedRequest(userId string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/api/profile/"+userId, nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("userId", userId)
	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
}

func TestProfile_notFound(t *testing.T) {
	db := openTestDB(t)
	rr := httptest.NewRecorder()
	Profile(db).ServeHTTP(rr, routedRequest("nobody"))

	if rr.Code != http.StatusNotFound {
		t.Errorf("got %d, want 404", rr.Code)
	}
}

func TestProfile_returnsUser(t *testing.T) {
	db := openTestDB(t)
	if _, err := db.Exec(`INSERT INTO users (id, provider, username) VALUES ('u1', 'github', 'coder')`); err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	Profile(db).ServeHTTP(rr, routedRequest("u1"))

	if rr.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rr.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["username"] != "coder" {
		t.Errorf("username: got %q, want %q", body["username"], "coder")
	}
	if body["createdAt"] == "" {
		t.Error("expected createdAt to be present")
	}
}

func TestProfile_returnsUserBySlug(t *testing.T) {
	db := openTestDB(t)
	if _, err := db.Exec(`INSERT INTO users (id, provider, username, slug) VALUES ('u1', 'github', 'coder', 'coder')`); err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	Profile(db).ServeHTTP(rr, routedRequest("coder"))

	if rr.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rr.Code)
	}
	var body map[string]string
	json.NewDecoder(rr.Body).Decode(&body)
	if body["username"] != "coder" {
		t.Errorf("username: got %q, want %q", body["username"], "coder")
	}
}
