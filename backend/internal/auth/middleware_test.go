package auth

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func encodePrincipal(t *testing.T, p Principal) string {
	t.Helper()
	b, err := json.Marshal(p)
	if err != nil {
		t.Fatal(err)
	}
	return base64.StdEncoding.EncodeToString(b)
}

func TestMiddleware_setsPrincipalInContext(t *testing.T) {
	want := Principal{
		IdentityProvider: "github",
		UserID:           "user-123",
		UserDetails:      "testuser",
		UserRoles:        []string{"authenticated"},
	}

	var got *Principal
	handler := Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = GetPrincipal(r)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-MS-CLIENT-PRINCIPAL", encodePrincipal(t, want))
	handler.ServeHTTP(httptest.NewRecorder(), req)

	if got == nil {
		t.Fatal("expected principal in context, got nil")
	}
	if got.UserID != want.UserID {
		t.Errorf("UserID: got %q, want %q", got.UserID, want.UserID)
	}
	if got.UserDetails != want.UserDetails {
		t.Errorf("UserDetails: got %q, want %q", got.UserDetails, want.UserDetails)
	}
}

func TestMiddleware_noHeader(t *testing.T) {
	var got *Principal
	handler := Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = GetPrincipal(r)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	handler.ServeHTTP(httptest.NewRecorder(), req)

	if got != nil {
		t.Errorf("expected nil principal, got %+v", got)
	}
}

func TestMiddleware_invalidBase64(t *testing.T) {
	var got *Principal
	handler := Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = GetPrincipal(r)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-MS-CLIENT-PRINCIPAL", "not-valid-base64!!!")
	handler.ServeHTTP(httptest.NewRecorder(), req)

	if got != nil {
		t.Errorf("expected nil principal on bad header, got %+v", got)
	}
}
