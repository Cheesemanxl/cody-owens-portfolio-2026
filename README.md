# cody-owens-portfolio-2026

Personal portfolio and tower defense browser game built to demonstrate event sourcing architecture.

**Stack:** React (Vite) · Go · SQLite · WebSockets · Azure

## Structure

```
frontend/   React app — portfolio site and game UI
backend/    Go API — event store, game logic, WebSocket server
```

## Development

```bash
cd frontend && npm install && npm run dev   # http://localhost:5173
cd backend && go run ./cmd/server           # http://localhost:8080
```
