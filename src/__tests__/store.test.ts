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
import type { AppData } from '../types'

function makeData(overrides?: Partial<AppData>): AppData {
  return {
    global: {
      apiKeys: '~/.env',
      vault: '~/vault',
      skills: '~/skills',
      codeRoot: '~/code',
      linkedin: '~/linkedin',
      claudeMemory: '~/memory',
      notes: '',
    },
    columns: [
      { id: 'backlog', label: 'Backlog' },
      { id: 'todo', label: 'Todo' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'done', label: 'Done' },
    ],
    projects: [],
    ...overrides,
  }
}

function makeProject(id = 'test', tasks: AppData['projects'][0]['tasks'] = []) {
  return {
    id,
    name: 'Test Project',
    description: 'desc',
    repo: '/repo',
    stack: 'ts',
    context: 'ctx',
    status: 'active',
    tasks,
  }
}

function makeTask(id = 'task-1', overrides = {}) {
  return {
    id,
    title: 'Test Task',
    description: 'task desc',
    status: 'todo',
    priority: 'medium' as const,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─── Projects ───

describe('addProject', () => {
  it('adds a project with correct defaults', () => {
    const data = makeData()
    const result = addProject(data, 'My New Project')
    expect(result.projects).toHaveLength(1)
    expect(result.projects[0].id).toBe('my-new-project')
    expect(result.projects[0].name).toBe('My New Project')
    expect(result.projects[0].status).toBe('New')
    expect(result.projects[0].tasks).toEqual([])
    expect(result.projects[0].description).toBe('')
  })

  it('preserves existing projects', () => {
    const data = makeData({ projects: [makeProject('existing')] })
    const result = addProject(data, 'Second')
    expect(result.projects).toHaveLength(2)
    expect(result.projects[0].id).toBe('existing')
    expect(result.projects[1].id).toBe('second')
  })

  it('generates kebab-case id from name with special chars', () => {
    const result = addProject(makeData(), 'My @#$ Project!!!')
    expect(result.projects[0].id).toBe('my-project-')
  })

  it('does not mutate original data', () => {
    const data = makeData()
    const original = JSON.stringify(data)
    addProject(data, 'New')
    expect(JSON.stringify(data)).toBe(original)
  })
})

describe('updateProject', () => {
  it('updates specified fields', () => {
    const data = makeData({ projects: [makeProject()] })
    const result = updateProject(data, 'test', { description: 'updated', stack: 'python' })
    expect(result.projects[0].description).toBe('updated')
    expect(result.projects[0].stack).toBe('python')
    expect(result.projects[0].name).toBe('Test Project') // unchanged
  })

  it('leaves other projects untouched', () => {
    const data = makeData({ projects: [makeProject('a'), makeProject('b')] })
    const result = updateProject(data, 'a', { description: 'changed' })
    expect(result.projects[0].description).toBe('changed')
    expect(result.projects[1].description).toBe('desc')
  })

  it('handles non-existent project gracefully', () => {
    const data = makeData({ projects: [makeProject()] })
    const result = updateProject(data, 'nonexistent', { description: 'x' })
    expect(result.projects).toHaveLength(1)
    expect(result.projects[0].description).toBe('desc')
  })

  it('does not mutate original data', () => {
    const data = makeData({ projects: [makeProject()] })
    const original = JSON.stringify(data)
    updateProject(data, 'test', { description: 'x' })
    expect(JSON.stringify(data)).toBe(original)
  })
})

describe('deleteProject', () => {
  it('removes the project', () => {
    const data = makeData({ projects: [makeProject('a'), makeProject('b')] })
    const result = deleteProject(data, 'a')
    expect(result.projects).toHaveLength(1)
    expect(result.projects[0].id).toBe('b')
  })

  it('returns empty array when deleting last project', () => {
    const data = makeData({ projects: [makeProject()] })
    const result = deleteProject(data, 'test')
    expect(result.projects).toEqual([])
  })

  it('handles non-existent project gracefully', () => {
    const data = makeData({ projects: [makeProject()] })
    const result = deleteProject(data, 'nonexistent')
    expect(result.projects).toHaveLength(1)
  })

  it('does not mutate original data', () => {
    const data = makeData({ projects: [makeProject()] })
    const original = JSON.stringify(data)
    deleteProject(data, 'test')
    expect(JSON.stringify(data)).toBe(original)
  })
})

// ─── Columns ───

describe('addColumn', () => {
  it('adds a column with correct id', () => {
    const data = makeData()
    const result = addColumn(data, 'Waiting For Input')
    expect(result.columns).toHaveLength(5)
    expect(result.columns[4]).toEqual({ id: 'waiting_for_input', label: 'Waiting For Input' })
  })

  it('preserves existing columns', () => {
    const data = makeData()
    const result = addColumn(data, 'New Col')
    expect(result.columns.slice(0, 4)).toEqual(data.columns)
  })

  it('handles missing columns array', () => {
    const data = { ...makeData(), columns: undefined as unknown as AppData['columns'] }
    const result = addColumn(data, 'First')
    expect(result.columns).toHaveLength(1)
  })

  it('does not mutate original data', () => {
    const data = makeData()
    const original = JSON.stringify(data)
    addColumn(data, 'New')
    expect(JSON.stringify(data)).toBe(original)
  })
})

// ─── Tasks ───

describe('addTask', () => {
  it('adds a task with generated id and timestamp', () => {
    const data = makeData({ projects: [makeProject()] })
    const result = addTask(data, 'test', {
      title: 'New task',
      description: 'details',
      status: 'todo',
      priority: 'high',
    })
    const tasks = result.projects[0].tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('New task')
    expect(tasks[0].priority).toBe('high')
    expect(tasks[0].id).toBeTruthy()
    expect(tasks[0].createdAt).toBeTruthy()
  })

  it('appends to existing tasks', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const result = addTask(data, 'test', {
      title: 'Second',
      description: '',
      status: 'backlog',
      priority: 'low',
    })
    expect(result.projects[0].tasks).toHaveLength(2)
    expect(result.projects[0].tasks[0].id).toBe('task-1')
    expect(result.projects[0].tasks[1].title).toBe('Second')
  })

  it('generates unique ids for multiple adds', () => {
    let data = makeData({ projects: [makeProject()] })
    data = addTask(data, 'test', { title: 'A', description: '', status: 'todo', priority: 'medium' })
    data = addTask(data, 'test', { title: 'B', description: '', status: 'todo', priority: 'medium' })
    const ids = data.projects[0].tasks.map((t) => t.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('does not add task to wrong project', () => {
    const data = makeData({ projects: [makeProject('a'), makeProject('b')] })
    const result = addTask(data, 'a', { title: 'X', description: '', status: 'todo', priority: 'medium' })
    expect(result.projects[0].tasks).toHaveLength(1)
    expect(result.projects[1].tasks).toHaveLength(0)
  })

  it('does not mutate original data', () => {
    const data = makeData({ projects: [makeProject()] })
    const original = JSON.stringify(data)
    addTask(data, 'test', { title: 'X', description: '', status: 'todo', priority: 'medium' })
    expect(JSON.stringify(data)).toBe(original)
  })
})

describe('moveTask', () => {
  it('changes task status', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask('t1', { status: 'todo' })])] })
    const result = moveTask(data, 'test', 't1', 'in_progress')
    expect(result.projects[0].tasks[0].status).toBe('in_progress')
  })

  it('only changes the target task', () => {
    const data = makeData({
      projects: [makeProject('test', [
        makeTask('t1', { status: 'todo' }),
        makeTask('t2', { status: 'backlog' }),
      ])],
    })
    const result = moveTask(data, 'test', 't1', 'done')
    expect(result.projects[0].tasks[0].status).toBe('done')
    expect(result.projects[0].tasks[1].status).toBe('backlog')
  })

  it('does not affect other projects', () => {
    const data = makeData({
      projects: [
        makeProject('a', [makeTask('t1', { status: 'todo' })]),
        makeProject('b', [makeTask('t2', { status: 'todo' })]),
      ],
    })
    const result = moveTask(data, 'a', 't1', 'done')
    expect(result.projects[0].tasks[0].status).toBe('done')
    expect(result.projects[1].tasks[0].status).toBe('todo')
  })

  it('handles non-existent task gracefully', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const result = moveTask(data, 'test', 'nonexistent', 'done')
    expect(result.projects[0].tasks[0].status).toBe('todo')
  })

  it('does not mutate original data', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const original = JSON.stringify(data)
    moveTask(data, 'test', 'task-1', 'done')
    expect(JSON.stringify(data)).toBe(original)
  })
})

describe('updateTask', () => {
  it('updates specified fields', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const result = updateTask(data, 'test', 'task-1', { title: 'Updated', priority: 'urgent' })
    expect(result.projects[0].tasks[0].title).toBe('Updated')
    expect(result.projects[0].tasks[0].priority).toBe('urgent')
    expect(result.projects[0].tasks[0].description).toBe('task desc') // unchanged
  })

  it('handles non-existent task gracefully', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const result = updateTask(data, 'test', 'nonexistent', { title: 'X' })
    expect(result.projects[0].tasks[0].title).toBe('Test Task')
  })

  it('does not mutate original data', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const original = JSON.stringify(data)
    updateTask(data, 'test', 'task-1', { title: 'X' })
    expect(JSON.stringify(data)).toBe(original)
  })
})

describe('deleteTask', () => {
  it('removes the task', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask('t1'), makeTask('t2')])] })
    const result = deleteTask(data, 'test', 't1')
    expect(result.projects[0].tasks).toHaveLength(1)
    expect(result.projects[0].tasks[0].id).toBe('t2')
  })

  it('returns empty array when deleting last task', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const result = deleteTask(data, 'test', 'task-1')
    expect(result.projects[0].tasks).toEqual([])
  })

  it('does not affect other projects', () => {
    const data = makeData({
      projects: [
        makeProject('a', [makeTask('t1')]),
        makeProject('b', [makeTask('t2')]),
      ],
    })
    const result = deleteTask(data, 'a', 't1')
    expect(result.projects[0].tasks).toHaveLength(0)
    expect(result.projects[1].tasks).toHaveLength(1)
  })

  it('handles non-existent task gracefully', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const result = deleteTask(data, 'test', 'nonexistent')
    expect(result.projects[0].tasks).toHaveLength(1)
  })

  it('does not mutate original data', () => {
    const data = makeData({ projects: [makeProject('test', [makeTask()])] })
    const original = JSON.stringify(data)
    deleteTask(data, 'test', 'task-1')
    expect(JSON.stringify(data)).toBe(original)
  })
})
