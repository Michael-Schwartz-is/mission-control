import { useState, useRef, useEffect } from 'react'
import type { Project, GlobalContext } from '@/types'
import { t } from '@/i18n'
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
  userImage?: string | null
  onSettingsClick: () => void
  onLogout?: () => void
  newProjectTrigger?: number
  inSettings?: boolean
}

function UserDropdown({ userName, userImage, onLogout }: {
  userName: string
  userImage?: string | null
  onLogout?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-sidebar-accent/50 rounded-md transition-colors"
      >
        {userImage ? (
          <img src={userImage} alt="" className="w-6 h-6 rounded-full shrink-0" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="text-xs text-sidebar-foreground truncate text-left">{userName}</span>
        <span className="text-xs text-sidebar-foreground/40">{open ? '▴' : '▾'}</span>
      </button>
      {open && onLogout && (
        <div className="absolute left-1 right-1 top-full mt-1 bg-popover border rounded-md shadow-md z-50 py-1">
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full text-left px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
          >
            {t('sign_out')}
          </button>
        </div>
      )}
    </div>
  )
}

export function Sidebar({ projects, selectedId, onSelect, onAddProject, onDeleteProject, userName, userImage, onSettingsClick, onLogout, newProjectTrigger, inSettings }: SidebarProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [lastTrigger, setLastTrigger] = useState(0)

  if (newProjectTrigger && newProjectTrigger !== lastTrigger) {
    setLastTrigger(newProjectTrigger)
    setAdding(true)
    setNewName('')
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    onAddProject(newName.trim())
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="w-48 shrink-0 bg-sidebar flex flex-col h-screen text-xs">
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <UserDropdown
            userName={userName}
            userImage={userImage}
            onLogout={onLogout}
          />
        </div>
        {!inSettings && (
          <button
            onClick={() => setAdding(true)}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground text-sm transition-colors px-2 py-2 shrink-0"
            title="New project"
          >
            +
          </button>
        )}
      </div>
      {inSettings ? (
        <>
          <div className="flex-1">
            <div className="p-2 space-y-0.5">
              {[
                { key: 'account', anchor: 'settings-account' },
                { key: 'interface', anchor: 'settings-interface' },
                { key: 'agent_context', anchor: 'settings-agent-context' },
                { key: 'api_keys', anchor: 'settings-api-keys' },
              ].map(({ key, anchor }) => (
                <button
                  key={key}
                  onClick={() => {
                    const el = document.getElementById(anchor)
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-md text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={() => onSelect(selectedId || projects[0]?.id || '')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <span className="text-sm">←</span> {t('back_to_projects')}
            </button>
          </div>
        </>
      ) : (
        <>
          <ScrollArea className="flex-1">
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
              <div className="px-2 pb-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
                  onBlur={() => { if (!newName.trim()) { setAdding(false); setNewName('') } }}
                  placeholder={t('new_project_placeholder')}
                  autoFocus
                  className="h-7 text-xs"
                />
              </div>
            )}

          </ScrollArea>
          <div className="p-2">
            <button
              onClick={onSettingsClick}
              className="w-full text-left px-3 py-1.5 rounded-md text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50 transition-colors"
            >
              {t('preferences')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
