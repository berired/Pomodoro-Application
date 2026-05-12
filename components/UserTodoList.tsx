'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { ACCENT_COLOR } from '@/lib/constants'
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
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Tasks</p>
          <h2 className="mt-2 text-2xl font-semibold">Your to-do list</h2>
        </div>
        <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white" style={{ backgroundColor: ACCENT_COLOR }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add task
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? <p className="text-sm text-black/70 dark:text-white/70">Loading tasks…</p> : null}
        {error ? <p role="alert" className="text-sm text-red-500">{error}</p> : null}

        {!isLoading && !error && tasks.length === 0 ? <p className="text-sm text-black/70 dark:text-white/70">No personal tasks yet.</p> : null}

        {!isLoading && !error
          ? tasks.map((taskItem) => (
              <article key={taskItem.id} className="flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: `${ACCENT_COLOR}33` }}>
                <button
                  type="button"
                  aria-label={taskItem.completed ? 'Mark task incomplete' : 'Mark task complete'}
                  onClick={() => void updateTask(taskItem.id, { completed: !taskItem.completed })}
                  className="mt-0.5 rounded-full border p-1"
                  style={{ borderColor: ACCENT_COLOR, backgroundColor: taskItem.completed ? ACCENT_COLOR : 'transparent' }}
                >
                  <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => setSelectedTask(taskItem)} className={`text-left text-base font-semibold ${taskItem.completed ? 'line-through opacity-60' : ''}`}>
                    {taskItem.title}
                  </button>
                  <p className="mt-1 text-sm text-black/70 dark:text-white/70">{taskItem.date}</p>
                </div>
              </article>
            ))
          : null}
      </div>

      <AddTaskModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onCreate={handleCreateTask} />
      <TaskDetailModal taskItem={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
    </section>
  )
}
