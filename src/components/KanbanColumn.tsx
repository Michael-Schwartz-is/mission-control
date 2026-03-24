import { useDroppable } from '@dnd-kit/core'
import type { Task } from '@/types'
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
}

export function KanbanColumn({ id, label, tasks, onTaskClick, onTaskDelete, onColumnDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const sorted = [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

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
      </div>
    </div>
  )
}
