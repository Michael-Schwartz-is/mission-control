export interface Column {
  id: string
  label: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  checklist?: ChecklistItem[]
  createdAt: string
  createdByName?: string
  createdByEmail?: string
  createdVia?: string
  updatedAt?: string
  completedAt?: string
  sourceRefIds?: string[]
}

export interface Project {
  id: string
  name: string
  description: string
  repo: string
  stack: string
  context: string
  status: string
  columns?: Column[]
  tasks: Task[]
}

export interface GlobalContext {
  apiKeys: string
  vault: string
  skills: string
  codeRoot: string
  linkedin: string
  claudeMemory: string
  notes: string
  [key: string]: string
}

export interface AppData {
  global: GlobalContext
  columns: Column[]
  projects: Project[]
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
]

export function getColumns(data: AppData, project: Project): Column[] {
  return project.columns ?? data.columns ?? DEFAULT_COLUMNS
}

export const PRIORITY_ORDER: Record<Task['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}
