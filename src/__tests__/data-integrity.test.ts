import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import type { AppData } from '../types'

const dataPath = path.resolve(__dirname, '../../data.json')

describe('data.json integrity', () => {
  let data: AppData

  it('is valid JSON', () => {
    const raw = fs.readFileSync(dataPath, 'utf-8')
    data = JSON.parse(raw)
    expect(data).toBeTruthy()
  })

  it('has global context with required fields', () => {
    expect(data.global).toBeTruthy()
    expect(data.global.apiKeys).toBeTruthy()
    expect(data.global.vault).toBeTruthy()
    expect(data.global.codeRoot).toBeTruthy()
  })

  it('has columns array', () => {
    expect(Array.isArray(data.columns)).toBe(true)
    expect(data.columns.length).toBeGreaterThan(0)
  })

  it('each column has id and label', () => {
    for (const col of data.columns) {
      expect(col.id).toBeTruthy()
      expect(col.label).toBeTruthy()
    }
  })

  it('column ids are unique', () => {
    const ids = data.columns.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has projects array', () => {
    expect(Array.isArray(data.projects)).toBe(true)
  })

  it('each project has required fields', () => {
    for (const project of data.projects) {
      expect(project.id).toBeTruthy()
      expect(project.name).toBeTruthy()
      expect(Array.isArray(project.tasks)).toBe(true)
      expect(typeof project.description).toBe('string')
      expect(typeof project.repo).toBe('string')
      expect(typeof project.stack).toBe('string')
      expect(typeof project.context).toBe('string')
      expect(typeof project.status).toBe('string')
    }
  })

  it('project ids are unique', () => {
    const ids = data.projects.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each task has required fields', () => {
    for (const project of data.projects) {
      for (const task of project.tasks) {
        expect(task.id).toBeTruthy()
        expect(task.title).toBeTruthy()
        expect(typeof task.description).toBe('string')
        expect(task.status).toBeTruthy()
        expect(['urgent', 'high', 'medium', 'low']).toContain(task.priority)
        expect(task.createdAt).toBeTruthy()
      }
    }
  })

  it('task ids are unique within each project', () => {
    for (const project of data.projects) {
      const ids = project.tasks.map((t) => t.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('task statuses match valid column ids', () => {
    const columnIds = new Set(data.columns.map((c) => c.id))
    for (const project of data.projects) {
      const projectColumnIds = project.columns
        ? new Set(project.columns.map((c) => c.id))
        : columnIds
      for (const task of project.tasks) {
        expect(projectColumnIds.has(task.status)).toBe(true)
      }
    }
  })
})
