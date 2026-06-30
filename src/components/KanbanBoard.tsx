import { useCallback, useState } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { Project, Task, Column } from '@/types'
import { KanbanColumn } from './KanbanColumn'
import { TaskDialog } from './TaskDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { t } from '@/i18n'

interface KanbanBoardProps {
  project: Project
  columns: Column[]
  onMoveTask: (taskId: string, newStatus: string) => void
  onAddTask: (task: { title: string; description?: string; status?: string; priority?: string; checklist?: Task['checklist'] }) => void
  onUpdateTask: (taskId: string, updates: { title?: string; description?: string; status?: string; priority?: string; checklist?: Task['checklist'] }) => void
  onDeleteTask: (taskId: string) => void
  onAddColumn: (label: string) => void
  onDeleteColumn: (columnId: string) => void
  newTaskTrigger?: number
}

export function KanbanBoard({ project, columns, onMoveTask, onAddTask, onUpdateTask, onDeleteTask, onAddColumn, onDeleteColumn, newTaskTrigger }: KanbanBoardProps) {
  const { confirm, confirmationDialog } = useConfirmDialog()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('todo')
  const [lastTrigger, setLastTrigger] = useState(0)

  if (newTaskTrigger && newTaskTrigger !== lastTrigger) {
    setLastTrigger(newTaskTrigger)
    setSelectedTask(null)
    setIsNew(true)
    setDialogOpen(true)
  }
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as string
    const task = project.tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return
    onMoveTask(taskId, newStatus)
  }

  const openEdit = (task: Task) => {
    setSelectedTask(task)
    setIsNew(false)
    setDialogOpen(true)
  }

  const handleSave = (form: Partial<Task> & { title: string }) => {
    if (isNew) {
      onAddTask({
        title: form.title,
        description: form.description || '',
        status: form.status || 'todo',
        priority: form.priority || 'medium',
        checklist: form.checklist,
      })
    } else if (selectedTask) {
      onUpdateTask(selectedTask.id, form)
    }
  }

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return
    onAddColumn(newColumnName.trim())
    setNewColumnName('')
    setAddingColumn(false)
  }

  const requestDeleteTask = useCallback((task: Task) => {
    confirm({
      title: 'Delete task?',
      description: `"${task.title}" will be permanently deleted.`,
      confirmLabel: 'Delete task',
      onConfirm: () => {
        onDeleteTask(task.id)
        if (selectedTask?.id === task.id) {
          setDialogOpen(false)
          setSelectedTask(null)
        }
      },
    })
  }, [confirm, onDeleteTask, selectedTask])

  const requestDeleteColumn = useCallback((column: Column) => {
    confirm({
      title: 'Delete column?',
      description: `"${column.label}" will be permanently deleted.`,
      confirmLabel: 'Delete column',
      onConfirm: () => onDeleteColumn(column.id),
    })
  }, [confirm, onDeleteColumn])

  const tasksByStatus = (status: string) =>
    project.tasks.filter((t) => t.status === status)

  if (project.tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-xs">
            <div className="text-sm font-medium text-foreground">{t('no_tasks')}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{t('no_tasks_desc')}</div>
            <button
              onClick={() => { setSelectedTask(null); setIsNew(true); setDialogOpen(true) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              {t('new_task_btn')}
            </button>
            <div className="text-[10px] text-muted-foreground/60">
              {t('or_press')} <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">N</kbd>
            </div>
          </div>
        </div>
        <TaskDialog
          task={null}
          isNew={true}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
          columns={columns}
          defaultStatus={defaultStatus}
          projectId={project.id}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 pt-4 pl-4 pb-6 pr-6 overflow-x-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-2 min-h-full w-max items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                tasks={tasksByStatus(col.id)}
                onTaskClick={openEdit}
                onTaskDelete={requestDeleteTask}
                onColumnDelete={() => requestDeleteColumn(col)}
                onQuickAdd={(title, status) => onAddTask({ title, status })}
                onAddTaskClick={(status) => {
                  setSelectedTask(null)
                  setIsNew(true)
                  setDefaultStatus(status)
                  setDialogOpen(true)
                }}
              />
            ))}
            {/* Add column */}
            <div className="w-[260px] shrink-0 flex flex-col items-center justify-start pt-2">
              {addingColumn ? (
                <div className="flex gap-1 w-full">
                  <Input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                    placeholder="Column name"
                    autoFocus
                    className="h-8 text-xs"
                  />
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleAddColumn}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setAddingColumn(false)}>x</Button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full h-10 rounded-lg bg-muted/20 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/40 transition-colors text-sm"
                >
                  + Column
                </button>
              )}
            </div>
          </div>
        </DndContext>
      </div>
      <TaskDialog
        task={selectedTask}
        isNew={isNew}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={selectedTask ? () => requestDeleteTask(selectedTask) : undefined}
        columns={columns}
        defaultStatus={defaultStatus}
        projectId={project.id}
      />
      {confirmationDialog}
    </div>
  )
}
