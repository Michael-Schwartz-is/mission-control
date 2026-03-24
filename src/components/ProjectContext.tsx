import { useState } from 'react'
import type { Project } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProjectContextProps {
  project: Project
  onSave: (updates: Partial<Project>) => void
}

export function ProjectContext({ project, onSave }: ProjectContextProps) {
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

  return (
    <div className="px-6 py-4 bg-card space-y-3 shrink-0 overflow-hidden">
      <div className="flex items-start justify-end">
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button>
        )}
      </div>

      {editing ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Description</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Repo / Path</label>
            <Input value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Stack</label>
            <Input value={form.stack} onChange={(e) => setForm({ ...form, stack: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Status</label>
            <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Context / Architecture Notes</label>
            <Textarea value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} rows={4} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Description: </span>
            <span className="text-foreground">{project.description || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Repo: </span>
            <span className="font-mono text-xs text-foreground">{project.repo || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Stack: </span>
            <span className="text-foreground">{project.stack || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Status: </span>
            {project.status ? <Badge variant="outline">{project.status}</Badge> : '—'}
          </div>
          {project.context && (
            <div className="col-span-2 mt-1">
              <span className="text-muted-foreground">Context: </span>
              <span className="text-foreground whitespace-pre-wrap">{project.context}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
