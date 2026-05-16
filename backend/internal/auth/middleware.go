package auth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
)

type Principal struct {
	IdentityProvider string   `json:"identityProvider"`
	UserID           string   `json:"userId"`
	UserDetails      string   `json:"userDetails"`
	UserRoles        []string `json:"userRoles"`
}

type contextKey string

const principalKey contextKey = "principal"

// Middleware decodes the X-MS-CLIENT-PRINCIPAL header injected by Azure Static
// Web Apps (and the SWA CLI emulator during local development).
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if header := r.Header.Get("X-MS-CLIENT-PRINCIPAL"); header != "" {
			if decoded, err := base64.StdEncoding.DecodeString(header); err == nil {
				var p Principal
				if err := json.Unmarshal(decoded, &p); err == nil {
					r = r.WithContext(context.WithValue(r.Context(), principalKey, &p))
				}
			}
		}
		next.ServeHTTP(w, r)
	})
}

func GetPrincipal(r *http.Request) *Principal {
	p, _ := r.Context().Value(principalKey).(*Principal)
	return p
}

// WithPrincipal returns a copy of r with p injected — intended for tests only.
func WithPrincipal(r *http.Request, p *Principal) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), principalKey, p))
}
