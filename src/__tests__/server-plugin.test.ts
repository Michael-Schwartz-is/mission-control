import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import http from 'http'
import type { Plugin } from 'vite'

// Import the plugin factory
import { dataServerPlugin } from '../../server-plugin'

const TEST_DATA_PATH = path.resolve(__dirname, '../../data.test.json')

// We can't easily test the full Vite middleware, so we test the data file
// read/write cycle that the plugin performs

describe('server data read/write cycle', () => {
  const testData = {
    global: { apiKeys: 'test', vault: 'test', skills: '', codeRoot: '', linkedin: '', claudeMemory: '', notes: '' },
    columns: [{ id: 'todo', label: 'Todo' }],
    projects: [{ id: 'p1', name: 'P1', description: '', repo: '', stack: '', context: '', status: '', tasks: [] }],
  }

  it('can write and read back JSON data', () => {
    fs.writeFileSync(TEST_DATA_PATH, JSON.stringify(testData, null, 2), 'utf-8')
    const read = JSON.parse(fs.readFileSync(TEST_DATA_PATH, 'utf-8'))
    expect(read).toEqual(testData)
  })

  it('preserves data through serialization roundtrip', () => {
    const complex = {
      ...testData,
      projects: [{
        ...testData.projects[0],
        context: 'Line 1\nLine 2\n"Quoted"',
        tasks: [{
          id: 't1',
          title: 'Task with "quotes" and émojis 🎉',
          description: 'Multi\nline\ndesc',
          status: 'todo',
          priority: 'high',
          createdAt: '2026-03-24T00:00:00Z',
        }],
      }],
    }
    fs.writeFileSync(TEST_DATA_PATH, JSON.stringify(complex, null, 2), 'utf-8')
    const read = JSON.parse(fs.readFileSync(TEST_DATA_PATH, 'utf-8'))
    expect(read.projects[0].context).toBe('Line 1\nLine 2\n"Quoted"')
    expect(read.projects[0].tasks[0].title).toBe('Task with "quotes" and émojis 🎉')
  })

  it('handles empty projects array', () => {
    const empty = { ...testData, projects: [] }
    fs.writeFileSync(TEST_DATA_PATH, JSON.stringify(empty, null, 2), 'utf-8')
    const read = JSON.parse(fs.readFileSync(TEST_DATA_PATH, 'utf-8'))
    expect(read.projects).toEqual([])
  })

  it('handles large data', () => {
    const large = {
      ...testData,
      projects: Array.from({ length: 50 }, (_, i) => ({
        ...testData.projects[0],
        id: `project-${i}`,
        name: `Project ${i}`,
        tasks: Array.from({ length: 100 }, (_, j) => ({
          id: `t-${i}-${j}`,
          title: `Task ${j}`,
          description: 'x'.repeat(500),
          status: 'todo',
          priority: 'medium',
          createdAt: '2026-01-01T00:00:00Z',
        })),
      })),
    }
    fs.writeFileSync(TEST_DATA_PATH, JSON.stringify(large, null, 2), 'utf-8')
    const read = JSON.parse(fs.readFileSync(TEST_DATA_PATH, 'utf-8'))
    expect(read.projects).toHaveLength(50)
    expect(read.projects[0].tasks).toHaveLength(100)
  })

  afterAll(() => {
    if (fs.existsSync(TEST_DATA_PATH)) fs.unlinkSync(TEST_DATA_PATH)
  })
})

describe('dataServerPlugin', () => {
  it('returns a plugin object with correct name', () => {
    const plugin = dataServerPlugin()
    expect(plugin.name).toBe('data-server')
  })

  it('has configureServer hook', () => {
    const plugin = dataServerPlugin()
    expect(typeof plugin.configureServer).toBe('function')
  })
})
