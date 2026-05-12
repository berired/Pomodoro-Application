import { useState, useEffect } from 'react'
import type { ClassRow, CreateClassPayload, UpdateClassPayload } from '@/types'

export function useClasses() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  async function fetchClasses(): Promise<void> {
    try {
      setIsLoading(true)
      const res = await fetch('/api/classes')
      if (!res.ok) throw new Error('Failed to fetch classes')
      const data = await res.json()
      setClasses(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function addClass(payload: CreateClassPayload): Promise<void> {
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to add class')
      const newClass = await res.json()
      setClasses((prev) => [...prev, newClass])
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred')
    }
  }

  async function updateClass(id: string, payload: UpdateClassPayload): Promise<void> {
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update class')
      const updated = await res.json()
      setClasses((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred')
    }
  }

  async function deleteClass(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete class')
      setClasses((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred')
    }
  }

  return {
    classes,
    isLoading,
    error,
    fetchClasses,
    addClass,
    updateClass,
    deleteClass,
  }
}
