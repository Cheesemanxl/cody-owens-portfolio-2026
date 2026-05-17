# Claude Code Instructions

## Git Workflow

Always sync main before branching:
  git checkout main && git pull origin main && git checkout -b <name>

Never commit directly to main — it is branch-protected. All changes go via PR.

Branch naming: feat/, fix/, test/, chore/ prefix (e.g. feat/add-leaderboard).

Run the full test suite before committing:
  npm run test          # frontend (Vitest) + backend (go test ./...)

## Project Structure

- backend/cmd/server/main.go    — Go entry point, chi router, middleware wiring
- backend/internal/handlers/    — HTTP handlers (me, cards, profile)
- backend/internal/db/db.go     — SQLite open + migrations
- frontend/src/                 — Vite + React app
- staticwebapp.config.json      — SWA routing, auth config, protected routes

## Running Locally

  npm run dev    (requires Azure SWA CLI: npm i -g @azure/static-web-apps-cli)
