import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Task, Column } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface TaskDialogProps {
  task: Task | null
  isNew: boolean
  open: boolean
  onClose: () => void
  onSave: (task: Partial<Task> & { title: string }) => void
  onDelete?: () => void
  columns: Column[]
  defaultStatus?: string
  projectId?: string
}

function formatDateTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TaskForm({ task, isNew, onSave, onClose, onDelete, columns, defaultStatus, projectId }: Omit<TaskDialogProps, 'open'>) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus ?? 'todo',
    priority: task?.priority ?? 'medium' as Task['priority'],
  })
  const events = useQuery(
    api.taskEvents.listByTask,
    !isNew && task && projectId ? { projectId, taskId: task.id } : 'skip'
  ) ?? []

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Title</label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter' && form.title.trim()) handleSave() }}
          placeholder="Task title"
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Details..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full h-9 rounded-md border bg-background px-3 text-sm text-foreground"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>{col.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
            className="w-full h-9 rounded-md border bg-background px-3 text-sm text-foreground"
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      {!isNew && task && (
        <div className="rounded-md border bg-muted/20 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Created</div>
              <div className="text-foreground">{formatDateTime(task.createdAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">By</div>
              <div className="text-foreground truncate">{task.createdByName || task.createdByEmail || 'Legacy'}</div>
            </div>
            {task.updatedAt && (
              <div>
                <div className="text-muted-foreground">Updated</div>
                <div className="text-foreground">{formatDateTime(task.updatedAt)}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground">Source</div>
              <div className="text-foreground">{task.createdVia || 'legacy'}</div>
            </div>
          </div>
          {events.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Activity</div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {events.map((event) => (
                  <div key={event._id} className="text-xs leading-relaxed">
                    <span className="text-foreground">{event.summary}</span>
                    <span className="text-muted-foreground"> · {event.actorName || event.actorEmail || event.createdVia} · {formatDateTime(event.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-between pt-2">
        <div>
          {!isNew && onDelete && (
            <Button variant="destructive" size="sm" onClick={() => { onDelete(); onClose() }}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{isNew ? 'Create' : 'Save'}</Button>
        </div>
      </div>
    </div>
  )
}

export function TaskDialog({ task, isNew, open, onClose, onSave, onDelete, columns, defaultStatus, projectId }: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>
        {open && (
          <TaskForm
            key={task?.id ?? `new-${defaultStatus}`}
            task={task}
            isNew={isNew}
            onSave={onSave}
            onClose={onClose}
            onDelete={onDelete}
            columns={columns}
            defaultStatus={defaultStatus}
            projectId={projectId}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
