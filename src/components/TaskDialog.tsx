import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Task, Column } from '@/types'
import { Check, Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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

const priorities: Array<{ value: Task['priority']; label: string; shortcut: string; code: string }> = [
  { value: 'urgent', label: 'Urgent', shortcut: '1', code: 'Digit1' },
  { value: 'high', label: 'High', shortcut: '2', code: 'Digit2' },
  { value: 'medium', label: 'Med', shortcut: '3', code: 'Digit3' },
  { value: 'low', label: 'Low', shortcut: '4', code: 'Digit4' },
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
    checklist: task?.checklist ?? [],
  })
  const [showChecklist, setShowChecklist] = useState((task?.checklist?.length ?? 0) > 0)
  const [newChecklistText, setNewChecklistText] = useState('')
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
      const priority = priorities.find((item) => item.code === event.code)
      if (!priority) return
      event.preventDefault()
      setForm((current) => ({ ...current, priority: priority.value }))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({
      ...form,
      checklist: form.checklist.filter((item) => item.text.trim()),
    })
    onClose()
  }

  const addChecklistItem = () => {
    const text = newChecklistText.trim()
    if (!text) return
    setForm((current) => ({
      ...current,
      checklist: [...current.checklist, { id: crypto.randomUUID(), text, done: false }],
    }))
    setNewChecklistText('')
  }

  const updateChecklistItem = (id: string, updates: Partial<NonNullable<Task['checklist']>[number]>) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.map((item) => item.id === id ? { ...item, ...updates } : item),
    }))
  }

  const removeChecklistItem = (id: string) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.filter((item) => item.id !== id),
    }))
  }

  return (
    <div className="space-y-3">
      {!isNew && (
        <div className="inline-flex rounded-sm bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-2.5 py-1 rounded-sm transition-colors ${activeTab === 'info' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Edit Task
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
      <div className="min-h-[310px]">
      {activeTab === 'info' ? (
        <div className="min-h-[310px] flex flex-col gap-3">
          <div>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter' && form.title.trim()) handleSave() }}
              placeholder="Untitled task"
              autoFocus
              aria-label="Task title"
              className="!h-auto !rounded-none !border-0 !border-b !border-transparent !bg-transparent !px-0 !py-1 !text-lg !font-semibold !shadow-none placeholder:text-muted-foreground/50 hover:!border-muted-foreground/30 focus-visible:!border-foreground focus-visible:!ring-0 dark:!bg-transparent"
            />
          </div>
          <div className="flex-1 min-h-0">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details..."
              aria-label="Task description"
              className="h-full min-h-[130px] resize-none rounded-sm [field-sizing:fixed]"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            {!showChecklist && form.checklist.length === 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-fit rounded-sm px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowChecklist(true)}
              >
                <Plus className="mr-1 size-3.5" />
                Add Checklist
              </Button>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground font-medium">Checklist</label>
                  {form.checklist.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {form.checklist.filter((item) => item.done).length}/{form.checklist.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {form.checklist.map((item) => (
                    <div key={item.id} className="group flex min-h-10 items-center gap-3 rounded-sm px-1 transition-colors hover:bg-muted/20">
                      <button
                        type="button"
                        onClick={() => updateChecklistItem(item.id, { done: !item.done })}
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          item.done
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30 bg-transparent text-transparent hover:border-muted-foreground/60'
                        }`}
                        aria-label={item.done ? 'Mark checklist item incomplete' : 'Mark checklist item complete'}
                        aria-pressed={item.done}
                      >
                        <Check className="size-3 stroke-[3]" />
                      </button>
                      <Input
                        value={item.text}
                        onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                        aria-label="Checklist item"
                        className={`h-9 flex-1 rounded-none border-0 border-b border-transparent bg-transparent px-0 text-sm shadow-none transition-colors placeholder:text-muted-foreground/50 hover:border-muted-foreground/20 focus-visible:border-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent ${
                          item.done ? 'text-muted-foreground' : 'text-foreground/85'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/0 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:text-muted-foreground/60"
                        aria-label="Remove checklist item"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="group flex min-h-10 items-center gap-3 rounded-sm px-1 transition-colors hover:bg-muted/20">
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/25 text-muted-foreground/55 transition-colors hover:border-muted-foreground/50 hover:text-foreground"
                      aria-label="Add checklist item"
                    >
                      <Plus className="size-3" />
                    </button>
                    <Input
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                      placeholder="Add checklist item"
                      aria-label="New checklist item"
                      className="h-9 flex-1 rounded-none border-0 border-b border-transparent bg-transparent px-0 text-sm text-foreground/85 shadow-none transition-colors placeholder:text-muted-foreground/45 hover:border-muted-foreground/20 focus-visible:border-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent"
                    />
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={addChecklistItem}>
                      Add
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-9 rounded-sm border bg-background px-3 text-sm text-foreground"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Priority</label>
              <div className="grid grid-cols-4 h-9 rounded-sm border bg-background p-0.5 gap-0.5">
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
                <Button variant="destructive" size="sm" onClick={onDelete}>
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
      ) : (
        <div className="space-y-3">
          <div className="rounded-sm border divide-y h-[262px] overflow-y-auto">
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
    </div>
  )
}

export function TaskDialog({ task, isNew, open, onClose, onSave, onDelete, columns, defaultStatus, projectId }: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-lg sm:max-w-lg">
        <DialogTitle className="sr-only">{isNew ? 'New Task' : 'Edit Task'}</DialogTitle>
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
