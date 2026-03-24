# Mission Control

Project dashboard and task board. Convex backend with Google OAuth. React frontend with real-time subscriptions.

## Running (dev)

```bash
# Terminal 1: Convex backend (watches and deploys functions)
npx convex dev

# Terminal 2: Frontend (port 5555)
npm run dev -- --port 5555
```

Frontend at http://localhost:5555

## Stack

- **Frontend**: Vite + React 19 + TypeScript, shadcn/ui + Tailwind CSS v4
- **Backend**: Convex (real-time database, serverless functions)
- **Auth**: Convex Auth with Google OAuth
- **Agent access**: API keys via HTTP actions

## Architecture

The frontend uses Convex's reactive `useQuery` hooks — data auto-updates on any change (including writes from agents via API). No polling, no manual refetching.

- `convex/` — Backend: schema, queries, mutations, HTTP actions
- `src/` — React frontend with Convex hooks
- `data.json` — Legacy local data file (for migration reference)

## Auth

Two auth methods:
1. **Google OAuth** — via Convex Auth, session managed automatically
2. **API key** — generated in Settings, sent as `Authorization: Bearer mc_...` to HTTP endpoints

## Convex Functions

### Queries (reactive, auto-update UI)
- `projects.list` — all projects with their tasks
- `columns.list` — kanban columns
- `globalContext.get` — global context data
- `apiKeys.list` — user's API keys

### Mutations
- `projects.create/update/remove`
- `tasks.create/update/remove/move`
- `columns.add`
- `globalContext.set`
- `apiKeys.create/remove`

### HTTP Actions (for agents)
- `GET /api/data` — bulk fetch all data (requires API key)
- `PUT /api/data` — bulk import data (requires API key)

## Agent Access

Agents authenticate via API key to Convex HTTP endpoints:

```bash
# Fetch all data
curl -H "Authorization: Bearer mc_YOUR_KEY" \
  https://YOUR_DEPLOYMENT.convex.site/api/data

# Import data
curl -X PUT -H "Authorization: Bearer mc_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d @data.json \
  https://YOUR_DEPLOYMENT.convex.site/api/data
```

Tasks should be **milestones, sessions, or blockers** — not granular implementation steps.

## Environment Variables (Convex Dashboard)

```bash
npx convex env set AUTH_GOOGLE_ID <google-client-id>
npx convex env set AUTH_GOOGLE_SECRET <google-client-secret>
```

## File Structure

```
convex/
  schema.ts            — Database schema (authTables + app tables)
  auth.ts              — Convex Auth config (Google provider)
  http.ts              — HTTP router (auth callbacks + agent API)
  projects.ts          — Project queries/mutations
  tasks.ts             — Task mutations
  columns.ts           — Column queries/mutations
  globalContext.ts      — Global context query/mutation
  apiKeys.ts           — API key management
  data.ts              — Bulk data get/import (for agent API)
data.json              — Legacy local data (migration reference)
server-plugin.ts       — Legacy Vite plugin (unused)
src/
  main.tsx             — ConvexAuthProvider setup
  auth.tsx             — useAuth hook
  App.tsx              — Main layout, gates on auth, uses Convex hooks
  types.ts             — TypeScript types
  store.ts             — Legacy store (unused by app, kept for tests)
  components/
    LoginPage.tsx       — Google sign-in
    Sidebar.tsx         — Project list, logout
    ProjectContext.tsx   — Editable project metadata
    KanbanBoard.tsx     — Kanban with drag-and-drop
    KanbanColumn.tsx    — Single column
    TaskCard.tsx        — Draggable task card
    TaskDialog.tsx      — Create/edit task modal
    SettingsDialog.tsx  — Settings + API key management
```

## UI Layout

- **Login page**: Google sign-in button
- **Left sidebar**: Project list, user avatar, sign out. Collapsible.
- **Top bar**: Project name, toggle buttons, + Task button
- **Details panel**: Editable project metadata. Collapsible.
- **Kanban board**: Drag-and-drop tasks between columns.
- **Settings**: Preferences, global context, API key management.
- **Keyboard shortcuts**: n=new task, b=board, d=details, s=sidebar, comma=settings
