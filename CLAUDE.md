# Mission Control

Local project dashboard and task board. Single JSON file as the data store — both the UI and Claude agents read/write the same file.

## Running

```bash
cd ~/Documents/code/mission-control
npm run dev -- --port 5555
```

Opens at http://localhost:5555

## Stack

- Vite + React 19 + TypeScript
- shadcn/ui + Tailwind CSS v4
- No backend — Vite dev server plugin serves `data.json` via `/api/data` (GET/PUT)
- No auth — local only

## Data File

All state lives in `~/Documents/code/mission-control/data.json`. This is the single source of truth.

### Reading data (as an agent)

Read the file directly:
```
Read ~/Documents/code/mission-control/data.json
```

### Writing data (as an agent)

Edit the file directly with the Edit or Write tool. The UI will pick up changes on next load/refresh.

### Data Structure

```json
{
  "global": {
    "apiKeys": "~/Documents/code/template/.env",
    "vault": "~/Documents/Gushon/",
    "skills": "~/Documents/Gushon/claw/",
    "codeRoot": "~/Documents/code/",
    "linkedin": "~/Documents/Gushon/linkedin/",
    "claudeMemory": "~/.claude/projects/-Users-michael/memory/",
    "notes": "free text"
  },
  "columns": [
    { "id": "backlog", "label": "Backlog" },
    { "id": "todo", "label": "Todo" },
    { "id": "in_progress", "label": "In Progress" },
    { "id": "blocked", "label": "Blocked" },
    { "id": "in_review", "label": "In Review" },
    { "id": "done", "label": "Done" }
  ],
  "projects": [
    {
      "id": "aeo",
      "name": "AEO Lighthouse",
      "description": "Short description",
      "repo": "~/Documents/code/AnswerEngineHouse",
      "stack": "Python, Svelte, etc.",
      "status": "Live / Idea / MVP / etc.",
      "context": "Architecture notes, key decisions, anything an agent needs to pick up work on this project",
      "columns": null,
      "tasks": [
        {
          "id": "unique-id",
          "title": "Task title",
          "description": "What needs to happen and why",
          "status": "todo",
          "priority": "high",
          "createdAt": "2026-03-24T00:00:00Z"
        }
      ]
    }
  ]
}
```

### Key fields

- **global**: Paths and context that apply across all projects. Agents should check `global.apiKeys` for API keys and `global.vault` for Obsidian notes/specs.
- **columns**: Default Kanban columns. Projects can override with their own `columns` array.
- **project.context**: Free-text field for architecture, notes, decisions, specs — the knowledge dump an agent needs to work on the project.
- **project.status**: Current state of the project (free text).
- **task.status**: Must match a column `id` from the columns array.
- **task.priority**: One of `urgent`, `high`, `medium`, `low`.

### Adding a project (as an agent)

Add an object to the `projects` array in `data.json`:
```json
{
  "id": "kebab-case-id",
  "name": "Display Name",
  "description": "",
  "repo": "",
  "stack": "",
  "status": "New",
  "context": "",
  "tasks": []
}
```

### Adding a task (as an agent)

Add to a project's `tasks` array. Use `uuid` for `id` or any unique string. Set `status` to a valid column id.

Tasks should be **milestones, sessions, or blockers** — not granular implementation steps. Claude can execute a whole batch of work in one session. A task is something like "Recalibrate scoring system" or "Decision: pick auth method", not "Fix function X" or "Add error handling to Y".

### Updating a task status (as an agent)

Edit the `status` field of the task in `data.json` to any column id.

## UI Layout

- **Left sidebar**: Project list, click to switch. Collapsible with arrow tab.
- **Top bar**: Project name (uppercase, muted), toggle buttons for Details/Board, + Task button.
- **Details panel**: Editable project metadata (description, repo, stack, status, context). Collapsible.
- **Kanban board**: Drag-and-drop tasks between columns. Horizontally scrollable. Add column with + button at end.
- **Global context**: Collapsible section at bottom of sidebar showing shared paths/config.
- **All UI state persists** in localStorage (selected project, panel visibility, sidebar state).

## File Structure

```
data.json              — All project/task data (THE source of truth)
server-plugin.ts       — Vite plugin that serves data.json as /api/data
src/
  App.tsx              — Main layout, state management, persistence
  types.ts             — TypeScript types, default columns, helpers
  store.ts             — Pure functions for data transformations + API calls
  components/
    Sidebar.tsx        — Project list, add/delete project, global context
    ProjectContext.tsx  — Editable project metadata panel
    KanbanBoard.tsx    — Board with drag-and-drop, add column
    KanbanColumn.tsx   — Single column with droppable zone
    TaskCard.tsx       — Draggable task card with delete
    TaskDialog.tsx     — Create/edit task modal
```
