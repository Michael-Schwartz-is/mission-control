import { useState, useCallback, use } from 'react'
import type { AppData, Project } from '@/types'
import { loadData, saveData, updateProject, addProject, deleteProject } from '@/store'
import { Sidebar } from '@/components/Sidebar'
import { ProjectContext } from '@/components/ProjectContext'
import { KanbanBoard } from '@/components/KanbanBoard'
import { SettingsDialog, loadSettings, type AppSettings } from '@/components/SettingsDialog'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function readPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`mc:${key}`)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function writePref(key: string, value: unknown) {
  localStorage.setItem(`mc:${key}`, JSON.stringify(value))
}

const dataPromise = loadData()

export default function App() {
  const initialData = use(dataPromise)

  const [data, setData] = useState<AppData>(initialData)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const saved = readPref<string | null>('selectedId', null)
    if (saved && initialData.projects.some((p) => p.id === saved)) return saved
    return initialData.projects[0]?.id ?? null
  })
  const [showContext, setShowContext] = useState(() => readPref('showContext', true))
  const [showBoard, setShowBoard] = useState(() => readPref('showBoard', true))
  const [showSidebar, setShowSidebar] = useState(() => readPref('showSidebar', true))
  const [newTaskTrigger, setNewTaskTrigger] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const handleSelectProject = useCallback((id: string) => {
    setSelectedId(id)
    writePref('selectedId', id)
  }, [])

  const toggleContext = useCallback(() => {
    setShowContext((v) => { writePref('showContext', !v); return !v })
  }, [])

  const toggleBoard = useCallback(() => {
    setShowBoard((v) => { writePref('showBoard', !v); return !v })
  }, [])

  const toggleSidebar = useCallback(() => {
    setShowSidebar((v) => { writePref('showSidebar', !v); return !v })
  }, [])

  const triggerNewTask = useCallback(() => {
    setShowBoard(true)
    writePref('showBoard', true)
    setNewTaskTrigger((n) => n + 1)
  }, [])

  const handleChange = useCallback(async (newData: AppData) => {
    setData(newData)
    await saveData(newData)
  }, [])

  const handleProjectUpdate = useCallback(
    (updates: Partial<Project>) => {
      if (!selectedId) return
      const newData = updateProject(data, selectedId, updates)
      handleChange(newData)
    },
    [data, selectedId, handleChange]
  )

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'n': triggerNewTask,
    'b': toggleBoard,
    'd': toggleContext,
    's': toggleSidebar,
    ',': () => setSettingsOpen(true),
  })

  const selected = data.projects.find((p) => p.id === selectedId) ?? null

  return (
    <div className="flex h-screen relative" dir={settings.rtl ? 'rtl' : 'ltr'}>
      <div
        className={`shrink-0 transition-all duration-200 ease-in-out overflow-hidden ${showSidebar ? 'w-48' : 'w-0'}`}
      >
        <Sidebar
          projects={data.projects}
          global={data.global}
          selectedId={selectedId}
          onSelect={handleSelectProject}
          onAddProject={(name) => {
            const newData = addProject(data, name)
            handleChange(newData)
            const newProject = newData.projects[newData.projects.length - 1]
            handleSelectProject(newProject.id)
          }}
          onDeleteProject={(id) => {
            const newData = deleteProject(data, id)
            handleChange(newData)
            if (selectedId === id) {
              handleSelectProject(newData.projects[0]?.id ?? '')
            }
          }}
          userName={settings.userName}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>
      <button
        onClick={toggleSidebar}
        className={`absolute top-1/2 -translate-y-1/2 z-10 w-4 h-8 bg-border hover:bg-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 ${settings.rtl ? 'rounded-l-md' : 'rounded-r-md'}`}
        style={settings.rtl
          ? { right: showSidebar ? '192px' : '0px' }
          : { left: showSidebar ? '192px' : '0px' }
        }
      >
        <span className="text-[10px]">
          {settings.rtl
            ? (showSidebar ? '▸' : '◂')
            : (showSidebar ? '◂' : '▸')
          }
        </span>
      </button>
      <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-background">
        {selected ? (
          <>
            <div className="px-6 pt-6 pb-2 flex items-center gap-2 shrink-0">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">{selected.name}</h2>
              <button
                onClick={toggleContext}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                {showContext ? 'Hide Details' : 'Show Details'}
              </button>
              <button
                onClick={toggleBoard}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                {showBoard ? 'Hide Board' : 'Show Board'}
              </button>
              <button
                onClick={triggerNewTask}
                className="text-xs text-primary-foreground bg-primary hover:bg-primary/80 px-2 py-1 rounded transition-colors"
              >
                + Task
              </button>
            </div>
            {showContext && <ProjectContext project={selected} onSave={handleProjectUpdate} />}
            {showBoard && <KanbanBoard project={selected} data={data} onChange={handleChange} newTaskTrigger={newTaskTrigger} />}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a project
          </div>
        )}
      </div>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        data={data}
        onChange={handleChange}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  )
}
