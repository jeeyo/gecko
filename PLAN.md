# Plan: Touch-first SPA home dashboard (calendar + markdown + expenses)

## Context

The repo is empty (greenfield, branch `claude/dashboard-calendar-expenses-ZkKFw`). The goal is a single-user, touch-first home dashboard that combines:

1. **Google Calendar events** read via OAuth.
2. **A markdown notes panel** (multiple notes, sidebar list) stored locally in Postgres.
3. **Daily expenses** by category, displayed as **all-day "events" overlaid on the same calendar** but stored locally in Postgres (no write-back to Google).

Decisions confirmed with the user:
- Single user; Google OAuth via env, no login UI.
- Expenses local-only, overlaid client-side onto Google events.
- Multiple markdown notes with a sidebar list.
- Bare-metal Bun + local Postgres (no Docker).
- Seeded fixed expense categories with colors (Food, Transport, Bills, Shopping, Health, Entertainment, Pets, Other).
- Default calendar view: Month.
- Markdown editor: CodeMirror 6 with split edit/preview.
- Dashboard `/` is **read-only**; all create/edit/delete lives on dedicated pages.

## Stack

- **Frontend**: Vite + React 19 + TypeScript, Tailwind v4, **shadcn/ui**, TanStack Query, React Router, **FullCalendar React** (touch-friendly, native all-day support), CodeMirror 6 + `react-markdown` for preview.
- **Backend**: **Bun + ElysiaJS** (TypeScript). Confirmed over alternatives because (a) user requested it, (b) Elysia's **Eden treaty** gives end-to-end typed RPC to the SPA with no schema duplication, (c) Bun's speed + native TS makes single-binary dev painless on bare metal.
- **DB**: Postgres via **Drizzle ORM** (typed queries + migrations) on top of `postgres` (postgres.js) driver.
- **Google API**: `googleapis` npm package for Calendar v3 + OAuth2 client.

## Repo layout (Bun workspaces)

```
package.json                    # workspaces: apps/*
.env.example
README.md
apps/
  api/
    package.json
    drizzle.config.ts
    src/
      index.ts                  # Elysia app + CORS + static SPA in prod
      env.ts
      db/
        index.ts                # postgres.js + drizzle client
        schema.ts               # notes, categories, expenses, oauth_tokens
        seed.ts                 # seeds categories
      google.ts                 # OAuth2 client + token persistence
      routes/
        auth.ts                 # /api/auth/google/{start,callback,status}
        calendar.ts             # /api/calendar/events
        expenses.ts             # /api/expenses CRUD
        notes.ts                # /api/notes CRUD
        categories.ts           # /api/categories list
    drizzle/                    # generated migrations
  web/
    package.json
    vite.config.ts              # dev proxy /api -> :3001
    index.html
    src/
      main.tsx
      App.tsx                   # router + layout
      api/client.ts             # Eden treaty client (typed from apps/api)
      routes/
        Dashboard.tsx           # READ-ONLY home: calendar + recent notes + expense summary
        ExpensesPage.tsx        # /expenses  list + edit
        ExpenseEditPage.tsx     # /expenses/new and /expenses/:id  form
        NotesPage.tsx           # /notes  list + new
        NoteEditPage.tsx        # /notes/:id  CodeMirror editor + preview
        EventDetailPage.tsx     # /events/:id  read-only Google event detail
        SettingsPage.tsx        # /settings  Google connect status, currency
      components/
        ui/...                  # shadcn primitives
        Layout.tsx              # bottom tabs on mobile, sidebar on desktop
        CalendarView.tsx        # FullCalendar wrapper merging events+expenses (read-only on dashboard)
        ExpenseForm.tsx         # used by ExpenseEditPage
        NoteEditor.tsx          # CodeMirror + react-markdown preview, used by NoteEditPage
        EventDetailSheet.tsx    # read-only popover/sheet for event/expense taps from dashboard
      hooks/
        useEvents.ts            # TanStack Query: Google events for range
        useExpenses.ts          # TanStack Query: local expenses
        useNotes.ts
      lib/
        utils.ts                # cn() etc. (shadcn)
        currency.ts
```

## Database schema (Drizzle, `apps/api/src/db/schema.ts`)

- `categories` — `id (text pk)`, `name`, `color (hex)`, `sort_order`.
  Seed: Food `#ef4444`, Transport `#3b82f6`, Bills `#a855f7`, Shopping `#f59e0b`, Health `#10b981`, Entertainment `#ec4899`, Pets `#b45309`, Other `#6b7280`.
- `expenses` — `id (uuid pk)`, `date (date)`, `amount_cents (int)`, `currency (text default 'USD')`, `category_id (fk)`, `note (text nullable)`, `created_at`, `updated_at`.
- `notes` — `id (uuid pk)`, `title`, `content (text)`, `created_at`, `updated_at`.
- `oauth_tokens` — single-row table (`id int pk = 1`), `access_token`, `refresh_token`, `scope`, `expiry_date (bigint)`.

Indexes: `expenses(date)` for range queries.

## API surface (Elysia + Eden)

All routes under `/api`, JSON, validated with Elysia's `t` schemas (auto-typed for Eden).

- `GET  /api/auth/google/start` → 302 to Google consent.
- `GET  /api/auth/google/callback` → exchanges code, persists tokens, redirects to `/`.
- `GET  /api/auth/google/status` → `{ connected: boolean, email?: string }`.
- `GET  /api/calendar/events?from=ISO&to=ISO` → flattened list from primary calendar.
- `GET  /api/expenses?from&to` / `POST` / `PATCH /:id` / `DELETE /:id`.
- `GET  /api/notes` (returns `{id,title,updated_at}[]`) / `POST` / `GET /:id` / `PATCH /:id` / `DELETE /:id`.
- `GET  /api/categories`.

`google.ts` uses one shared `OAuth2Client`. On 401, refresh once, retry, persist new tokens. If no refresh token, surface `connected:false` and route the SPA's empty-state to a "Connect Google" button.

## Frontend behavior

### Routing (read vs. edit are strictly separated)

The home dashboard (`/`) is **view-only**. All creation/editing/deletion happens on dedicated routes — taps on the dashboard navigate to those routes rather than mutating in place.

| Route | Purpose | Mutates? |
|---|---|---|
| `/` | Dashboard: calendar + recent notes + today/week expense summary | No |
| `/expenses` | List of expenses, grouped by day, with Edit/Delete actions | Yes |
| `/expenses/new?date=YYYY-MM-DD` | Create expense form | Yes |
| `/expenses/:id` | Edit expense form | Yes |
| `/notes` | Notes list + "New note" button | No (lists only) |
| `/notes/:id` | CodeMirror editor + preview | Yes |
| `/events/:id` | Read-only Google event detail | No |
| `/settings` | Google connect status, currency | Yes (settings) |

**Layout (`Layout.tsx`)** — touch-first:
- Mobile (`< md`): bottom tab bar (Dashboard, Expenses, Notes, Settings); 56px tall, safe-area aware.
- Desktop: collapsible left sidebar with the same sections.
- shadcn primitives: `Button`, `Card`, `Input`, `Select`, `Tabs`, `ScrollArea`, `Sheet`, `Drawer`.

**Dashboard (`/`, `Dashboard.tsx`) — read-only**:
- Top: `CalendarView` in `readOnly` mode (`editable={false}`, `selectable={false}`). Tapping a Google event → navigates to `/events/:id`. Tapping an expense pill → navigates to `/expenses/:id`. Tapping an empty day does **nothing** (no inline add).
- Below the calendar (or beside it on desktop): two summary cards — "Recent notes" (top 5 by `updated_at`, tap → `/notes/:id`) and "This month's expenses" (totals per category bar). All read-only.
- **No FAB, no inline forms, no drawer-edit on this page.** A header button labeled "Add expense" navigates to `/expenses/new?date=today` for users who explicitly want to add from here.

**CalendarView.tsx** (shared component):
- FullCalendar React, `initialView="dayGridMonth"`. Two event sources merged for the visible range: `useEvents` (Google) + `useExpenses` (local). Expenses are `allDay: true` events with `backgroundColor` from category and a title like `· Food $12.40`.
- Props: `readOnly: boolean`. When true, all interactions are navigations (no mutations, no popover edit).

**ExpensesPage (`/expenses`)**:
- Day-grouped list. Each row: category color dot, amount, note. Row tap → `/expenses/:id`. Header button "Add expense" → `/expenses/new`. Long-press / swipe-left reveals Delete.

**ExpenseEditPage (`/expenses/new` and `/expenses/:id`)**:
- Full-page form (not a drawer). Fields: large numeric amount input (`inputmode="decimal"`), category as horizontal scrollable pill row (one-tap select), date picker (defaults to `?date=` query or today), optional note. Sticky bottom action bar: Save / (Delete on edit) / Cancel.

**NotesPage (`/notes`)**:
- List sorted by `updated_at desc`. Tap → `/notes/:id`. Header "New note" button → creates and routes to `/notes/:newId`.

**NoteEditPage (`/notes/:id`)**:
- CodeMirror 6 left, rendered preview right (via `react-markdown` + `remark-gfm`); on mobile, `Tabs` toggle Edit / Preview. Auto-save on blur + every 2s while editing (debounced), TanStack Query `onMutate` optimistic update. Header has Delete.

**EventDetailPage (`/events/:id`)**:
- Read-only: title, time, location, attendees, description (sanitized HTML). "Open in Google Calendar" link.

**Touch-first specifics**:
- 44px minimum tap targets; `touch-action: manipulation` on tappables.
- Disable double-tap zoom on calendar pills.
- Use `pointer:coarse` media query in Tailwind to bump paddings.
- No hover-only affordances; every action is reachable by tap.

## Auth & secrets

`.env.example`:
```
DATABASE_URL=postgres://localhost/gecko
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
SESSION_SECRET=     # signs a single-user cookie (optional, used to gate /api on LAN)
PORT=3001
WEB_ORIGIN=http://localhost:5173
```

Single-user gate: a fixed cookie `gecko_session` set to an HMAC of `SESSION_SECRET`, issued on first visit from localhost — keeps the API from being open if exposed on LAN later. Skip if `SESSION_SECRET` is empty (pure local).

## Dev workflow

Root `package.json` scripts:
- `bun install`
- `bun run db:push` — `drizzle-kit push` against `DATABASE_URL`.
- `bun run db:seed` — seeds categories.
- `bun run dev` — runs `bun --hot apps/api/src/index.ts` and `vite` (in `apps/web`) concurrently via `concurrently`. Vite proxies `/api` → `:3001`.
- `bun run build` — `vite build` then API serves `apps/web/dist` as static fallback.

## Verification

1. `createdb gecko && bun install && bun run db:push && bun run db:seed`.
2. Set Google OAuth client (Web app, redirect `http://localhost:3001/api/auth/google/callback`) → fill `.env` → `bun run dev`.
3. Visit `http://localhost:5173`, click "Connect Google" → consent → returned to dashboard with events visible for current month.
4. Confirm dashboard is read-only: tapping an empty day does nothing; tapping a Google event navigates to `/events/:id`; there is no inline edit drawer or FAB.
5. Go to `/expenses` → "Add expense" → log a $12.40 Food expense for today → save → return to dashboard → red pill appears on today's cell alongside Google events. Tap the pill → routes to `/expenses/:id` (edit page), not an inline editor.
6. Add another expense in the new "Pets" category → confirm it renders with the Pets color (`#b45309`).
7. Go to Notes → New note → type markdown on `/notes/:id` → verify split preview renders. Reload → content persisted. Recent-notes card on dashboard shows it and is tappable.
8. **Touch check**: open Chrome DevTools device toolbar (iPhone), confirm bottom tab bar, drawer animations, and that all tap targets are reachable without zoom.
9. **Range check**: navigate to next month → confirm `from`/`to` query params bound the fetched window for both events and expenses.
10. **Token refresh**: in `oauth_tokens` set `expiry_date` to `0`, reload → API silently refreshes; events still load.
11. `bun test` in `apps/api`: tests for expense range query, categories seed including Pets, and notes CRUD against a `gecko_test` DB.
