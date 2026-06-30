export interface KeyboardShortcut {
  keys: string[]
  action: string
  context?: string
}

export const keyboardShortcuts: KeyboardShortcut[] = [
  { keys: ['N'], action: 'New task', context: 'When a project is selected' },
  { keys: ['P'], action: 'New project' },
  { keys: ['B'], action: 'Go to board', context: 'When a project is selected' },
  { keys: ['D'], action: 'Go to project details', context: 'When a project is selected' },
  { keys: ['S'], action: 'Toggle sidebar' },
  { keys: [','], action: 'Open preferences' },
  { keys: ['Shift', '/'], action: 'Open keyboard shortcuts' },
]
