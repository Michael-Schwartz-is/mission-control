import { useEffect, useState } from 'react'
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

const priorities: Array<{ value: Task['priority']; label: string; shortcut: string }> = [
  { value: 'urgent', label: 'Urgent', shortcut: '1' },
  { value: 'high', label: 'High', shortcut: '2' },
  { value: 'medium', label: 'Med', shortcut: '3' },
  { value: 'low', label: 'Low', shortcut: '4' },
]

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

function actorLabel(task?: Task | null, event?: { actorName?: string; actorEmail?: string; createdVia?: string }) {
  const name = task ? task.createdByName || task.createdByEmail : event?.actorName || event?.actorEmail
  if (event?.createdVia === 'api' || task?.createdVia === 'api' || name?.toLowerCase().startsWith('api key:')) {
    return 'Agent'
  }
  return name || 'Legacy'
}

function TaskForm({ task, isNew, onSave, onClose, onDelete, columns, defaultStatus, projectId }: Omit<TaskDialogProps, 'open'>) {
  const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info')
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

  useEffect(() => {
    if (activeTab !== 'info') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey) return
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return
      const priority = priorities.find((item) => item.shortcut === event.key)
      if (!priority) return
      event.preventDefault()
      setForm((current) => ({ ...current, priority: priority.value }))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <div className="space-y-3">
      {!isNew && (
        <div className="inline-flex rounded-md bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-2.5 py-1 rounded-sm transition-colors ${activeTab === 'info' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Task Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1 rounded-sm transition-colors ${activeTab === 'activity' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Activity
          </button>
        </div>
      )}
      {activeTab === 'info' ? (
        <>
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
              <div className="grid grid-cols-4 h-9 rounded-md border bg-background p-0.5 gap-0.5">
                {priorities.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    title={`Shift+${priority.shortcut}`}
                    onClick={() => setForm({ ...form, priority: priority.value })}
                    className={`rounded-sm px-1 text-[11px] font-medium transition-colors ${
                      form.priority === priority.value
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {!isNew && task && (
            <div className="text-xs text-muted-foreground">
              Created {formatDateTime(task.createdAt)} by <span className="text-foreground">{actorLabel(task)}</span>
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
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border divide-y max-h-72 overflow-y-auto">
            {events.length > 0 ? events.map((event) => (
              <div key={event._id} className="p-3 text-xs leading-relaxed">
                <div className="text-foreground">{event.summary}</div>
                <div className="text-muted-foreground mt-0.5">
                  {actorLabel(null, event)} · {formatDateTime(event.createdAt)}
                </div>
              </div>
            )) : (
              <div className="p-3 text-xs text-muted-foreground">No activity yet</div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
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
