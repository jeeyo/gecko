# Gecko — touch-first home dashboard

A single-user SPA dashboard combining Google Calendar events, a markdown notes panel, and per-day expenses overlaid on the same calendar. Read-only home; all edits live on dedicated pages.

- **Frontend**: Vite + React + TypeScript + Tailwind + shadcn/ui + FullCalendar + CodeMirror.
- **Backend**: Bun + ElysiaJS, Drizzle ORM, Postgres.
- **Google**: Calendar v3 (read-only) via `googleapis`.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- Postgres running locally
- A Google OAuth 2.0 Client (type: Web app) with redirect URI `http://localhost:3001/api/auth/google/callback`

## Setup

```bash
cp .env.example .env
# Fill in DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

createdb gecko
bun install
bun run db:push     # creates tables via drizzle-kit
bun run db:seed     # seeds expense categories (incl. Pets)
```

## Run

```bash
bun run dev
```

- API: http://localhost:3001
- Web: http://localhost:5173 (proxies `/api` → :3001)

Open the web app, go to **Settings → Connect Google**, complete consent, and your calendar shows up on the dashboard.

## Routes

| Route | Read/Edit | Purpose |
|---|---|---|
| `/` | Read | Calendar + recent notes + month expense summary |
| `/expenses` | Read+Edit | Day-grouped expense list |
| `/expenses/new` | Edit | Create expense |
| `/expenses/:id` | Edit | Update/delete expense |
| `/notes` | Read | Notes list |
| `/notes/:id` | Edit | CodeMirror + preview |
| `/events/:id` | Read | Google event details |
| `/settings` | Edit | Google connection |

## Project layout

```
apps/api    Bun + Elysia + Drizzle (Postgres)
apps/web    Vite + React + shadcn UI
PLAN.md     Approved design doc
```
