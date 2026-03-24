import { type AppData, type Project, type Task, type Column } from './types'
import { v4 as uuid } from 'uuid'

const DATA_URL = '/api/data'

export async function loadData(): Promise<AppData> {
  const res = await fetch(DATA_URL)
  if (!res.ok) throw new Error('Failed to load data')
  return res.json()
}

export async function saveData(data: AppData): Promise<void> {
  await fetch(DATA_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  })
}

// Projects

export function addProject(data: AppData, name: string): AppData {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const project: Project = {
    id,
    name,
    description: '',
    repo: '',
    stack: '',
    context: '',
    status: 'New',
    tasks: [],
  }
  return { ...data, projects: [...data.projects, project] }
}

export function updateProject(data: AppData, projectId: string, updates: Partial<Project>): AppData {
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId ? { ...p, ...updates } : p
    ),
  }
}

export function deleteProject(data: AppData, projectId: string): AppData {
  return { ...data, projects: data.projects.filter((p) => p.id !== projectId) }
}

// Columns

export function addColumn(data: AppData, label: string): AppData {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const col: Column = { id, label }
  return { ...data, columns: [...(data.columns ?? []), col] }
}

// Tasks

export function moveTask(data: AppData, projectId: string, taskId: string, newStatus: string): AppData {
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === taskId ? { ...t, status: newStatus } : t
            ),
          }
        : p
    ),
  }
}

export function addTask(data: AppData, projectId: string, task: Omit<Task, 'id' | 'createdAt'>): AppData {
  const newTask: Task = {
    ...task,
    id: uuid(),
    createdAt: new Date().toISOString(),
  }
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p
    ),
  }
}

export function updateTask(data: AppData, projectId: string, taskId: string, updates: Partial<Task>): AppData {
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === taskId ? { ...t, ...updates } : t
            ),
          }
        : p
    ),
  }
}

export function deleteTask(data: AppData, projectId: string, taskId: string): AppData {
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
        : p
    ),
  }
}
