import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Task } from '@/types'
import { t } from '@/i18n'
import { TaskCard } from './TaskCard'
import { cn } from '@/lib/utils'
import { PRIORITY_ORDER } from '@/types'

interface KanbanColumnProps {
  id: string
  label: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onColumnDelete?: (columnId: string) => void
  onQuickAdd?: (title: string, status: string) => void
  showQuickAdd?: boolean
}

export function KanbanColumn({ id, label, tasks, onTaskClick, onTaskDelete, onColumnDelete, onQuickAdd, showQuickAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  const sorted = [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  // Auto-open when showQuickAdd triggers
  if (showQuickAdd && !adding) {
    setAdding(true)
    setTitle('')
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onQuickAdd?.(title.trim(), id)
    setTitle('')
    // Keep input open for rapid entry
  }

  const handleCancel = () => {
    setAdding(false)
    setTitle('')
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-[260px] shrink-0 bg-muted/30 rounded-lg p-2 flex flex-col gap-1.5 transition-colors',
        isOver && 'bg-accent/20 ring-2 ring-accent/30'
      )}
    >
      <div className="group/col flex items-center justify-between mb-1 px-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
          {onColumnDelete && (
            <button
              onClick={() => {
                if (tasks.length > 0) {
                  alert('Move or delete all tasks in this column first.')
                  return
                }
                if (confirm(`Delete "${label}" column?`)) onColumnDelete(id)
              }}
              className="text-[10px] text-muted-foreground/0 group-hover/col:text-muted-foreground/40 hover:!text-destructive transition-colors"
            >
              x
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-h-[100px]">
        {sorted.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onDelete={() => onTaskDelete(task.id)}
          />
        ))}
        {adding ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') handleCancel()
            }}
            onBlur={() => { if (!title.trim()) handleCancel() }}
            placeholder={t('task_placeholder')}
            autoFocus
            className="bg-card rounded-md p-3 text-sm shadow-sm border-0 outline-none ring-1 ring-primary/30 focus:ring-primary placeholder:text-muted-foreground/50"
          />
        ) : onQuickAdd ? (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-muted-foreground/40 hover:text-muted-foreground py-2 transition-colors"
          >
            {t('add_task')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
