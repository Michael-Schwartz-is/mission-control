import { describe, it, expect } from 'vitest'
import {
  addProject,
  updateProject,
  deleteProject,
  addColumn,
  moveTask,
  addTask,
  updateTask,
  deleteTask,
} from '../store'
import { getColumns } from '../types'
import type { AppData } from '../types'

function freshData(): AppData {
  return {
    global: { apiKeys: '~/.env', vault: '~/vault', skills: '', codeRoot: '~/code', linkedin: '', claudeMemory: '', notes: '' },
    columns: [
      { id: 'backlog', label: 'Backlog' },
      { id: 'todo', label: 'Todo' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'done', label: 'Done' },
    ],
    projects: [],
  }
}

describe('full project lifecycle', () => {
  it('create → populate → update → archive → delete', () => {
    let data = freshData()

    // Create project
    data = addProject(data, 'My App')
    expect(data.projects).toHaveLength(1)
    const projectId = data.projects[0].id

    // Add context
    data = updateProject(data, projectId, {
      description: 'A cool app',
      repo: '~/code/my-app',
      stack: 'React, Node',
      context: 'This is the architecture...',
      status: 'Active',
    })
    expect(data.projects[0].repo).toBe('~/code/my-app')

    // Add tasks
    data = addTask(data, projectId, { title: 'Plan the thing', description: 'Session needed', status: 'todo', priority: 'high' })
    data = addTask(data, projectId, { title: 'Build it', description: '', status: 'backlog', priority: 'medium' })
    expect(data.projects[0].tasks).toHaveLength(2)

    // Move task through workflow
    const taskId = data.projects[0].tasks[0].id
    data = moveTask(data, projectId, taskId, 'in_progress')
    expect(data.projects[0].tasks[0].status).toBe('in_progress')
    data = moveTask(data, projectId, taskId, 'done')
    expect(data.projects[0].tasks[0].status).toBe('done')

    // Update project status
    data = updateProject(data, projectId, { status: 'Complete' })
    expect(data.projects[0].status).toBe('Complete')

    // Delete project
    data = deleteProject(data, projectId)
    expect(data.projects).toHaveLength(0)
  })
})

describe('full task lifecycle', () => {
  it('create → edit → move through all states → delete', () => {
    let data = freshData()
    data = addProject(data, 'Test')
    const projectId = data.projects[0].id

    // Create
    data = addTask(data, projectId, { title: 'Do something', description: 'Initial', status: 'backlog', priority: 'low' })
    const taskId = data.projects[0].tasks[0].id

    // Edit
    data = updateTask(data, projectId, taskId, { title: 'Do something important', priority: 'urgent', description: 'Updated desc' })
    expect(data.projects[0].tasks[0].title).toBe('Do something important')
    expect(data.projects[0].tasks[0].priority).toBe('urgent')
    expect(data.projects[0].tasks[0].description).toBe('Updated desc')

    // Move through all states
    for (const status of ['todo', 'in_progress', 'done']) {
      data = moveTask(data, projectId, taskId, status)
      expect(data.projects[0].tasks[0].status).toBe(status)
    }

    // Delete
    data = deleteTask(data, projectId, taskId)
    expect(data.projects[0].tasks).toHaveLength(0)
  })
})

describe('multi-project isolation', () => {
  it('operations on one project do not affect another', () => {
    let data = freshData()
    data = addProject(data, 'Alpha')
    data = addProject(data, 'Beta')

    // Add tasks to Alpha
    data = addTask(data, 'alpha', { title: 'Alpha task', description: '', status: 'todo', priority: 'high' })
    expect(data.projects[0].tasks).toHaveLength(1)
    expect(data.projects[1].tasks).toHaveLength(0)

    // Move Alpha task
    const taskId = data.projects[0].tasks[0].id
    data = moveTask(data, 'alpha', taskId, 'done')
    expect(data.projects[0].tasks[0].status).toBe('done')

    // Update Beta
    data = updateProject(data, 'beta', { description: 'Beta updated' })
    expect(data.projects[0].description).toBe('')
    expect(data.projects[1].description).toBe('Beta updated')

    // Delete Alpha task doesn't touch Beta
    data = addTask(data, 'beta', { title: 'Beta task', description: '', status: 'todo', priority: 'medium' })
    data = deleteTask(data, 'alpha', taskId)
    expect(data.projects[0].tasks).toHaveLength(0)
    expect(data.projects[1].tasks).toHaveLength(1)
  })
})

describe('column management', () => {
  it('added columns appear in getColumns', () => {
    let data = freshData()
    data = addColumn(data, 'Blocked')
    data = addColumn(data, 'Waiting')
    const project = { id: 'p', name: 'P', description: '', repo: '', stack: '', context: '', status: '', tasks: [] }
    const cols = getColumns(data, project)
    expect(cols.map((c) => c.id)).toContain('blocked')
    expect(cols.map((c) => c.id)).toContain('waiting')
  })

  it('tasks can be moved to newly added columns', () => {
    let data = freshData()
    data = addColumn(data, 'Blocked')
    data = addProject(data, 'Test')
    data = addTask(data, 'test', { title: 'T', description: '', status: 'todo', priority: 'medium' })
    const taskId = data.projects[0].tasks[0].id
    data = moveTask(data, 'test', taskId, 'blocked')
    expect(data.projects[0].tasks[0].status).toBe('blocked')
  })
})

describe('edge cases', () => {
  it('handles rapid successive operations', () => {
    let data = freshData()
    data = addProject(data, 'Rapid')
    const pid = data.projects[0].id

    // Add 20 tasks rapidly
    for (let i = 0; i < 20; i++) {
      data = addTask(data, pid, { title: `Task ${i}`, description: '', status: 'backlog', priority: 'medium' })
    }
    expect(data.projects[0].tasks).toHaveLength(20)

    // Move them all to done
    for (const task of data.projects[0].tasks) {
      data = moveTask(data, pid, task.id, 'done')
    }
    expect(data.projects[0].tasks.every((t) => t.status === 'done')).toBe(true)

    // Delete them all
    for (const task of [...data.projects[0].tasks]) {
      data = deleteTask(data, pid, task.id)
    }
    expect(data.projects[0].tasks).toHaveLength(0)
  })

  it('handles empty strings in all text fields', () => {
    let data = freshData()
    data = addProject(data, 'Empty')
    data = updateProject(data, 'empty', { description: '', repo: '', stack: '', context: '', status: '' })
    data = addTask(data, 'empty', { title: 'Minimal', description: '', status: 'todo', priority: 'low' })
    expect(data.projects[0].tasks[0].description).toBe('')
  })

  it('handles unicode in all text fields', () => {
    let data = freshData()
    data = addProject(data, 'פרויקט חדש')
    data = updateProject(data, data.projects[0].id, {
      description: '🚀 Launch',
      context: 'בדיקה של טקסט בעברית עם אימוג\'ים 🎉',
    })
    data = addTask(data, data.projects[0].id, {
      title: '日本語タスク',
      description: 'Описание задачи',
      status: 'todo',
      priority: 'high',
    })
    expect(data.projects[0].description).toBe('🚀 Launch')
    expect(data.projects[0].tasks[0].title).toBe('日本語タスク')
  })

  it('handles very long text', () => {
    let data = freshData()
    data = addProject(data, 'Long')
    const longText = 'x'.repeat(100000)
    data = updateProject(data, 'long', { context: longText })
    expect(data.projects[0].context.length).toBe(100000)
  })
})
