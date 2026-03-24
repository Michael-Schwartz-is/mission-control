import { useState } from 'react'
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
}

function TaskForm({ task, isNew, onSave, onClose, onDelete, columns }: Omit<TaskDialogProps, 'open'>) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium' as Task['priority'],
  })

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

export function TaskDialog({ task, isNew, open, onClose, onSave, onDelete, columns }: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>
        {open && (
          <TaskForm
            key={task?.id ?? 'new'}
            task={task}
            isNew={isNew}
            onSave={onSave}
            onClose={onClose}
            onDelete={onDelete}
            columns={columns}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
