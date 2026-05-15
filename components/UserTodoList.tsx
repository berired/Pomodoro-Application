'use client'

import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import type { TaskRow, CreateTaskPayload, UpdateTaskPayload } from '@/types'
import AddTaskModal from '@/components/AddTaskModal'
import TaskDetailModal from '@/components/TaskDetailModal'

export default function UserTodoList(): React.JSX.Element {
  const { tasks, isLoading, error, addTask, updateTask, deleteTask } = useTasks()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null)

  async function handleCreateTask(payload: CreateTaskPayload): Promise<void> {
    await addTask(payload)
  }

  async function handleUpdateTask(id: string, payload: UpdateTaskPayload): Promise<void> {
    await updateTask(id, payload)
  }

  async function handleDeleteTask(id: string): Promise<void> {
    await deleteTask(id)
    setSelectedTask(null)
  }

  return (
    <section className="rounded-3xl border border-primary p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tasks</p>
          <h2 className="mt-2 text-2xl font-semibold">Your to-do list</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add task
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading tasks…</p> : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

        {!isLoading && !error && tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personal tasks yet.</p>
        ) : null}

        {!isLoading && !error
          ? tasks.map((taskItem) => (
              <article key={taskItem.id} className="flex items-start gap-3 rounded-2xl border border-primary/20 p-4">
                <button
                  type="button"
                  aria-label={taskItem.completed ? 'Mark task incomplete' : 'Mark task complete'}
                  onClick={() => void updateTask(taskItem.id, { completed: !taskItem.completed })}
                  className={`mt-0.5 rounded-full border border-primary p-1 transition-colors ${taskItem.completed ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-primary/10'}`}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(taskItem)}
                    className={`text-left text-base font-semibold transition-opacity ${taskItem.completed ? 'line-through opacity-50' : ''}`}
                  >
                    {taskItem.title}
                  </button>
                  <p className="mt-1 text-sm text-muted-foreground">{taskItem.date}</p>
                </div>
                <button
                  type="button"
                  aria-label="Delete task"
                  onClick={() => void handleDeleteTask(taskItem.id)}
                  className="mt-0.5 rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </article>
            ))
          : null}
      </div>

      <AddTaskModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onCreate={handleCreateTask} />
      <TaskDetailModal taskItem={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
    </section>
  )
}
