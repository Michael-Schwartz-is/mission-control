import { useState } from 'react'
import type { Project, GlobalContext } from '@/types'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface SidebarProps {
  projects: Project[]
  global: GlobalContext
  selectedId: string | null
  onSelect: (id: string) => void
  onAddProject: (name: string) => void
  onDeleteProject: (id: string) => void
  userName: string
  onSettingsClick: () => void
}

export function Sidebar({ projects, global, selectedId, onSelect, onAddProject, onDeleteProject, userName, onSettingsClick }: SidebarProps) {
  const [showGlobal, setShowGlobal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) return
    onAddProject(newName.trim())
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="w-48 shrink-0 bg-sidebar flex flex-col h-screen text-xs">
      <div className="px-3 py-3 flex items-center gap-2">
        <button
          onClick={onSettingsClick}
          className="w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 hover:opacity-80 transition-opacity"
          title="Settings"
        >
          {userName.charAt(0).toUpperCase()}
        </button>
        <span className="text-xs text-sidebar-foreground truncate flex-1">{userName}</span>
        <button
          onClick={() => setAdding(true)}
          className="text-sidebar-foreground/40 hover:text-sidebar-foreground text-sm transition-colors"
          title="New project (N)"
        >
          +
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">Projects</div>
        <div className="p-2 space-y-0.5">
          {projects.map((project) => {
            const taskCount = project.tasks.filter((t) => t.status !== 'done').length
            return (
              <div key={project.id} className="group relative">
                <button
                  onClick={() => onSelect(project.id)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between',
                    selectedId === project.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                  )}
                >
                  <span className="truncate">{project.name}</span>
                  {taskCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs h-5 min-w-5 justify-center">
                      {taskCount}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete "${project.name}"?`)) onDeleteProject(project.id)
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-sidebar-foreground/0 group-hover:text-sidebar-foreground/30 hover:!text-destructive transition-colors text-[10px]"
                >
                  x
                </button>
              </div>
            )
          })}
        </div>

        {adding && (
          <div className="px-2 pb-2 flex gap-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Project name"
              autoFocus
              className="h-7 text-xs"
            />
            <button onClick={handleAdd} className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground px-1">+</button>
            <button onClick={() => setAdding(false)} className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground px-1">x</button>
          </div>
        )}

      </ScrollArea>
      <div className="p-2">
        <button
          onClick={() => setShowGlobal((v) => !v)}
          className="w-full text-left px-3 py-1.5 rounded-md text-xs font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50 transition-colors"
        >
          {showGlobal ? '▾' : '▸'} Global Context
        </button>
        {showGlobal && (
          <div className="px-3 py-2 space-y-1.5 text-[10px] max-h-48 overflow-y-auto">
            {Object.entries(global).map(([key, value]) => (
              <div key={key}>
                <span className="text-sidebar-foreground/40">{key}: </span>
                <span className="text-sidebar-foreground/70 break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
