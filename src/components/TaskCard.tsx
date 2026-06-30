import { useDraggable } from '@dnd-kit/core'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

const priorityColors: Record<Task['priority'], string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

function formatShortDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function actorLabel(task: Task) {
  const name = task.createdByName || task.createdByEmail
  if (task.createdVia === 'api' || name?.toLowerCase().startsWith('api key:')) return 'Agent'
  return name || 'Legacy'
}

interface TaskCardProps {
  task: Task
  onClick: () => void
  onDelete: () => void
}

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
  const checklist = task.checklist ?? []
  const doneCount = checklist.filter((item) => item.done).length
  const checklistProgress = checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'group bg-card rounded-md p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow space-y-2 relative',
        isDragging && 'opacity-50'
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-destructive hover:!bg-destructive/10 transition-colors text-xs"
      >
        x
      </button>
      <div className="pr-4">
        <span className="text-base font-medium leading-tight">
          <span className={cn('inline-block w-2 h-2 rounded-full mr-1.5 align-middle', priorityColors[task.priority])} />
          {task.title}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}
      {checklist.length > 0 && (
        <div className="space-y-1">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${checklistProgress}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground/70">{doneCount}/{checklist.length}</div>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
        <span>{formatShortDate(task.createdAt)}</span>
        <span>·</span>
        <span className="truncate">{actorLabel(task)}</span>
      </div>
    </div>
  )
}
