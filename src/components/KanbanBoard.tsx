import { useState } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { AppData, Project, Task, Column } from '@/types'
import { getColumns } from '@/types'
import { KanbanColumn } from './KanbanColumn'
import { TaskDialog } from './TaskDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { moveTask, addTask, updateTask, deleteTask, addColumn } from '@/store'

interface KanbanBoardProps {
  project: Project
  data: AppData
  onChange: (data: AppData) => void
  newTaskTrigger?: number
}

export function KanbanBoard({ project, data, onChange, newTaskTrigger }: KanbanBoardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [lastTrigger, setLastTrigger] = useState(0)

  if (newTaskTrigger && newTaskTrigger !== lastTrigger) {
    setLastTrigger(newTaskTrigger)
    setSelectedTask(null)
    setIsNew(true)
    setDialogOpen(true)
  }
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const columns: Column[] = getColumns(data, project)

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
    onChange(moveTask(data, project.id, taskId, newStatus))
  }

  const openNew = () => {
    setSelectedTask(null)
    setIsNew(true)
    setDialogOpen(true)
  }

  const openEdit = (task: Task) => {
    setSelectedTask(task)
    setIsNew(false)
    setDialogOpen(true)
  }

  const handleSave = (form: Partial<Task> & { title: string }) => {
    if (isNew) {
      onChange(addTask(data, project.id, {
        title: form.title,
        description: form.description || '',
        status: form.status || 'todo',
        priority: form.priority || 'medium',
      }))
    } else if (selectedTask) {
      onChange(updateTask(data, project.id, selectedTask.id, form))
    }
  }

  const handleDeleteTask = (taskId: string) => {
    onChange(deleteTask(data, project.id, taskId))
  }

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return
    onChange(addColumn(data, newColumnName.trim()))
    setNewColumnName('')
    setAddingColumn(false)
  }

  const tasksByStatus = (status: string) =>
    project.tasks.filter((t) => t.status === status)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 pt-4 pl-4 pb-6 pr-6 overflow-x-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-2 h-full w-max">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                tasks={tasksByStatus(col.id)}
                onTaskClick={openEdit}
                onTaskDelete={handleDeleteTask}
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
        onDelete={selectedTask ? () => handleDeleteTask(selectedTask.id) : undefined}
        columns={columns}
      />
    </div>
  )
}
