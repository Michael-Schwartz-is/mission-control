import { useState } from 'react'
import type { Project } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface ProjectDetailsProps {
  project: Project
  onSave: (updates: Partial<Project>) => void
}

function Field({ value, editing, onChange, multiline }: {
  value: string
  editing: boolean
  onChange: (v: string) => void
  multiline?: boolean
}) {
  if (editing) {
    return multiline ? (
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="text-sm" />
    ) : (
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm h-9" />
    )
  }
  if (!value) return <span className="text-sm text-muted-foreground/50">—</span>
  return <span className="text-sm text-foreground whitespace-pre-wrap">{value}</span>
}

export function ProjectDetails({ project, onSave }: ProjectDetailsProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    description: project.description,
    repo: project.repo,
    stack: project.stack,
    status: project.status,
    context: project.context,
  })

  const startEdit = () => {
    setForm({
      description: project.description,
      repo: project.repo,
      stack: project.stack,
      status: project.status,
      context: project.context,
    })
    setEditing(true)
  }

  const save = () => {
    onSave(form)
    setEditing(false)
  }

  const taskCount = project.tasks.length
  const openTasks = project.tasks.filter((t) => t.status !== 'done').length

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
          {(project.description || editing) && (
            <div>
              <Field
                value={editing ? form.description : project.description}
                editing={editing}
                onChange={(v) => setForm({ ...form, description: v })}
              />
            </div>
          )}
        </div>

        {/* Properties row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {project.status && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-xs">{project.status}</Badge>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Tasks</span>
            <span className="text-foreground font-medium">{openTasks} open / {taskCount} total</span>
          </div>
          {project.stack && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Stack</span>
              <span className="text-foreground">{project.stack}</span>
            </div>
          )}
        </div>

        {/* Info sections */}
        <div className="space-y-5 pt-2">
          {(project.repo || editing) && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Repository / Path</label>
              {editing ? (
                <Field value={form.repo} editing={true} onChange={(v) => setForm({ ...form, repo: v })} />
              ) : (
                <div className="text-sm font-mono text-foreground">{project.repo || '—'}</div>
              )}
            </div>
          )}

          {editing && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Field value={form.status} editing={true} onChange={(v) => setForm({ ...form, status: v })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Stack</label>
                <Field value={form.stack} editing={true} onChange={(v) => setForm({ ...form, stack: v })} />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Context</label>
            <Field
              value={editing ? form.context : project.context}
              editing={editing}
              onChange={(v) => setForm({ ...form, context: v })}
              multiline
            />
          </div>
        </div>

        {/* Edit actions */}
        <div className="flex gap-2 pt-2">
          {editing ? (
            <>
              <button onClick={save} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Edit details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
