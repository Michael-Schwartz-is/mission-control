import { describe, it, expect } from 'vitest'
import { getColumns, DEFAULT_COLUMNS, PRIORITY_ORDER } from '../types'
import type { AppData, Project, Column } from '../types'

function makeData(columns?: Column[]): AppData {
  return {
    global: { apiKeys: '', vault: '', skills: '', codeRoot: '', linkedin: '', claudeMemory: '', notes: '' },
    columns: columns ?? [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    projects: [],
  }
}

function makeProject(columns?: Column[]): Project {
  return {
    id: 'test',
    name: 'Test',
    description: '',
    repo: '',
    stack: '',
    context: '',
    status: '',
    columns,
    tasks: [],
  }
}

describe('getColumns', () => {
  it('returns project columns when project has custom columns', () => {
    const projectCols: Column[] = [{ id: 'x', label: 'X' }]
    const result = getColumns(makeData(), makeProject(projectCols))
    expect(result).toEqual(projectCols)
  })

  it('returns data columns when project has no custom columns', () => {
    const dataCols: Column[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
    const result = getColumns(makeData(dataCols), makeProject())
    expect(result).toEqual(dataCols)
  })

  it('returns DEFAULT_COLUMNS when neither project nor data has columns', () => {
    const data = { ...makeData(), columns: undefined as unknown as Column[] }
    const result = getColumns(data, makeProject())
    expect(result).toEqual(DEFAULT_COLUMNS)
  })

  it('project columns take priority over data columns', () => {
    const projectCols: Column[] = [{ id: 'proj', label: 'Project Col' }]
    const dataCols: Column[] = [{ id: 'data', label: 'Data Col' }]
    const result = getColumns(makeData(dataCols), makeProject(projectCols))
    expect(result).toEqual(projectCols)
  })
})

describe('PRIORITY_ORDER', () => {
  it('urgent is highest priority (lowest number)', () => {
    expect(PRIORITY_ORDER.urgent).toBeLessThan(PRIORITY_ORDER.high)
    expect(PRIORITY_ORDER.high).toBeLessThan(PRIORITY_ORDER.medium)
    expect(PRIORITY_ORDER.medium).toBeLessThan(PRIORITY_ORDER.low)
  })

  it('covers all four priority levels', () => {
    expect(Object.keys(PRIORITY_ORDER)).toEqual(['urgent', 'high', 'medium', 'low'])
  })
})

describe('DEFAULT_COLUMNS', () => {
  it('has expected columns in order', () => {
    const ids = DEFAULT_COLUMNS.map((c) => c.id)
    expect(ids).toEqual(['backlog', 'todo', 'in_progress', 'blocked', 'in_review', 'done'])
  })

  it('each column has id and label', () => {
    for (const col of DEFAULT_COLUMNS) {
      expect(col.id).toBeTruthy()
      expect(col.label).toBeTruthy()
    }
  })
})
