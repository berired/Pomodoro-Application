import { useState, useEffect } from 'react'
import type { TaskRow, CreateTaskPayload, UpdateTaskPayload } from '@/types'

export function useTasks() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks(): Promise<void> {
    try {
      setIsLoading(true)
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function addTask(payload: CreateTaskPayload): Promise<void> {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to add task')
      const newTask = await res.json()
      setTasks((prev) => [...prev, newTask])
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred')
    }
  }

  async function updateTask(id: string, payload: UpdateTaskPayload): Promise<void> {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update task')
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred')
    }
  }

  async function deleteTask(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred')
    }
  }

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
  }
}
