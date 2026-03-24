import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '../data.json')
let originalData: string

test.beforeAll(() => {
  originalData = fs.readFileSync(DATA_PATH, 'utf-8')
})

test.afterAll(() => {
  fs.writeFileSync(DATA_PATH, originalData, 'utf-8')
})

test.beforeEach(() => {
  const data = {
    global: {
      apiKeys: '~/Documents/code/template/.env',
      vault: '~/Documents/Gushon/',
      skills: '~/Documents/Gushon/claw/',
      codeRoot: '~/Documents/code/',
      linkedin: '~/Documents/Gushon/linkedin/',
      claudeMemory: '~/.claude/memory/',
      notes: 'Test data',
    },
    columns: [
      { id: 'backlog', label: 'Backlog' },
      { id: 'todo', label: 'Todo' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'blocked', label: 'Blocked' },
      { id: 'done', label: 'Done' },
    ],
    projects: [
      {
        id: 'alpha',
        name: 'Alpha',
        description: 'First project',
        repo: '~/code/alpha',
        stack: 'TypeScript',
        status: 'Active',
        context: 'Alpha context notes',
        tasks: [
          { id: 't1', title: 'Task One', description: 'First task desc', status: 'todo', priority: 'high', createdAt: '2026-01-01T00:00:00Z' },
          { id: 't2', title: 'Task Two', description: 'Second task desc', status: 'backlog', priority: 'medium', createdAt: '2026-01-01T00:00:00Z' },
          { id: 't3', title: 'Task Three', description: '', status: 'in_progress', priority: 'urgent', createdAt: '2026-01-01T00:00:00Z' },
        ],
      },
      {
        id: 'beta',
        name: 'Beta',
        description: 'Second project',
        repo: '',
        stack: 'Python',
        status: 'Idea',
        context: '',
        tasks: [
          { id: 't4', title: 'Beta Task', description: 'Only task', status: 'todo', priority: 'low', createdAt: '2026-01-01T00:00:00Z' },
        ],
      },
    ],
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
})

// ─── Page loads ───

test('page loads with projects in sidebar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Alpha' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Beta/ })).toBeVisible()
})

test('first project is selected by default', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Alpha' })).toBeVisible()
})

test('kanban columns are visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Backlog')).toBeVisible()
  await expect(page.getByText('Todo')).toBeVisible()
  await expect(page.getByText('In Progress')).toBeVisible()
  await expect(page.getByText('Done')).toBeVisible()
})

test('tasks appear on the board', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Task One')).toBeVisible()
  await expect(page.getByText('Task Two')).toBeVisible()
  await expect(page.getByText('Task Three')).toBeVisible()
})

// ─── Project switching ───

test('clicking a project in sidebar switches view', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Beta/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Beta' })).toBeVisible()
  await expect(page.getByText('Beta Task')).toBeVisible()
  await expect(page.getByText('Task One')).not.toBeVisible()
})

// ─── Project details ───

test('project details panel shows metadata', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('First project')).toBeVisible()
  await expect(page.getByText('~/code/alpha')).toBeVisible()
  await expect(page.getByText('TypeScript')).toBeVisible()
})

test('hide details button hides the details panel', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('First project')).toBeVisible()
  await page.getByRole('button', { name: 'Hide Details' }).click()
  await expect(page.getByText('First project')).not.toBeVisible()
  await page.getByRole('button', { name: 'Show Details' }).click()
  await expect(page.getByText('First project')).toBeVisible()
})

test('hide board button hides the kanban', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Task One')).toBeVisible()
  await page.getByRole('button', { name: 'Hide Board' }).click()
  await expect(page.getByText('Task One')).not.toBeVisible()
  await page.getByRole('button', { name: 'Show Board' }).click()
  await expect(page.getByText('Task One')).toBeVisible()
})

// ─── Edit project ───

test('can edit project details', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Edit' }).click()

  const descInput = page.locator('input').first()
  await descInput.clear()
  await descInput.fill('Updated description')

  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Updated description')).toBeVisible()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  expect(data.projects[0].description).toBe('Updated description')
})

// ─── Create task ───

test('can create a new task', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '+ Task' }).click()

  await page.getByPlaceholder('Task title').fill('Brand New Task')
  await page.getByPlaceholder('Details...').fill('Some details here')

  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText('Brand New Task')).toBeVisible()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const task = data.projects[0].tasks.find((t: { title: string }) => t.title === 'Brand New Task')
  expect(task).toBeTruthy()
  expect(task.description).toBe('Some details here')
})

// ─── Edit task ───

test('can edit an existing task', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Task One').click()

  const titleInput = page.getByPlaceholder('Task title')
  await titleInput.clear()
  await titleInput.fill('Task One Edited')

  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Task One Edited')).toBeVisible()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  expect(data.projects[0].tasks[0].title).toBe('Task One Edited')
})

// ─── Delete task from card ───

test('can delete a task from the card', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Task One')).toBeVisible()

  // Open the task dialog and delete from there
  await page.getByText('Task One').click()
  await page.getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByText('Task One')).not.toBeVisible()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  expect(data.projects[0].tasks.find((t: { id: string }) => t.id === 't1')).toBeUndefined()
})

// ─── Add project ───

test('can add a new project', async ({ page }) => {
  await page.goto('/')
  await page.locator('button[title="New project"]').click()
  await page.getByPlaceholder('Project name').fill('Gamma')
  await page.getByPlaceholder('Project name').press('Enter')

  // New project should appear in sidebar
  await expect(page.getByRole('button', { name: 'Gamma' })).toBeVisible()
  // And be auto-selected
  await expect(page.getByRole('heading', { name: 'Gamma' })).toBeVisible()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  expect(data.projects.find((p: { name: string }) => p.name === 'Gamma')).toBeTruthy()
})

// ─── Delete project ───

test('can delete a project', async ({ page }) => {
  await page.goto('/')
  page.on('dialog', (dialog) => dialog.accept())

  const betaItem = page.getByRole('button', { name: /Beta/ }).first().locator('..')
  await betaItem.hover()
  await betaItem.locator('button:has-text("x")').click()

  await expect(page.getByRole('button', { name: /Beta/ })).not.toBeVisible()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  expect(data.projects.find((p: { id: string }) => p.id === 'beta')).toBeUndefined()
})

// ─── Sidebar collapse ───

test('sidebar collapses and expands with arrow', async ({ page }) => {
  await page.goto('/')
  const collapseBtn = page.getByRole('button', { name: '◂', exact: true })
  const expandBtn = page.getByRole('button', { name: '▸', exact: true })

  await expect(collapseBtn).toBeVisible()
  await collapseBtn.click()
  await expect(expandBtn).toBeVisible()

  await expandBtn.click()
  await expect(collapseBtn).toBeVisible()
})

// ─── Global context ───

test('global context expands in sidebar', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Global Context').click()
  await expect(page.getByText('~/Documents/code/template/.env')).toBeVisible()
  await expect(page.getByText('~/Documents/Gushon/', { exact: true })).toBeVisible()
})

// ─── Persistence ───

test('selected project persists across page reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Beta/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Beta' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Beta' })).toBeVisible()
})

test('hidden panels persist across page reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Hide Details' }).click()
  await page.getByRole('button', { name: 'Hide Board' }).click()

  await page.reload()
  await expect(page.getByText('First project')).not.toBeVisible()
  await expect(page.getByText('Task One')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Show Details' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show Board' })).toBeVisible()
})

// ─── Add column ───

test('can add a new column', async ({ page }) => {
  await page.goto('/')
  await page.getByText('+ Column').click()
  await page.getByPlaceholder('Column name').fill('Waiting')
  await page.getByPlaceholder('Column name').press('Enter')

  await expect(page.getByText('Waiting')).toBeVisible()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  expect(data.columns.find((c: { id: string }) => c.id === 'waiting')).toBeTruthy()
})

// ─── Task dialog ───

test('can change task priority in dialog', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Task Two').click()

  await page.locator('select').last().selectOption('urgent')
  await page.getByRole('button', { name: 'Save' }).click()

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const task = data.projects[0].tasks.find((t: { id: string }) => t.id === 't2')
  expect(task.priority).toBe('urgent')
})

test('can change task status in dialog', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Task One').click()

  await page.locator('select').first().selectOption('done')
  await page.getByRole('button', { name: 'Save' }).click()

  // Wait for save to persist
  await page.waitForTimeout(300)

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const task = data.projects[0].tasks.find((t: { id: string }) => t.id === 't1')
  expect(task.status).toBe('done')
})

test('cancel in task dialog does not save changes', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Task One').click()

  const titleInput = page.getByPlaceholder('Task title')
  await titleInput.clear()
  await titleInput.fill('Should Not Save')

  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText('Task One')).toBeVisible()
  await expect(page.getByText('Should Not Save')).not.toBeVisible()
})
