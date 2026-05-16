# cody-owens-portfolio-2026

Personal portfolio and tower defense browser game built to demonstrate event sourcing architecture.

**Stack:** React (Vite) · Go · SQLite · WebSockets · Azure

## Structure

```
frontend/   React app — portfolio site and game UI
backend/    Go API — event store, game logic, WebSocket server
```

## Local Development

Install dependencies once:

```bash
npm install
cd frontend && npm install
```

Start all services:

```bash
npm run dev
```

This runs the Go backend (`:8080`), Vite dev server (`:5173`), and SWA CLI auth emulator together.

**Always open `http://localhost:4280`** — not `:5173`. The SWA CLI on `:4280` is what emulates Azure auth and proxies requests to both services.

### Auth flow

1. Click **Sign in** in the nav
2. The SWA CLI shows a mock login page — enter any username and submit
3. You'll be redirected back as a logged-in user
4. Your profile is written to `backend/data.db` automatically

To log out: navigate to `http://localhost:4280/.auth/logout`

### Cold start (fresh state)

```bash
rm backend/data.db   # wipe the database
npm run dev
```

Then log out via `/.auth/logout` or clear cookies for `localhost:4280` in your browser if you have a leftover session.

### Inspecting the database

Install the **SQLite Viewer** extension in VS Code, then click `backend/data.db` in the file explorer.

## Tests

```bash
cd frontend && npm test          # Vitest (watch mode)
cd backend && go test ./...      # Go tests
```
