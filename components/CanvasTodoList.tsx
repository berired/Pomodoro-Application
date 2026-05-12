'use client'

import { useEffect, useState } from 'react'
import type { CanvasAssignment } from '@/types'
import { ACCENT_COLOR } from '@/lib/constants'

export default function CanvasTodoList(): React.JSX.Element {
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadAssignments(): Promise<void> {
      try {
        setIsLoading(true)
        const response = await fetch('/api/canvas/assignments')
        const body = await response.json() as CanvasAssignment[] | { error?: string }

        if (response.status === 403 && body && 'error' in body && body.error === 'NO_CANVAS_TOKEN') {
          setAssignments([])
          setErrorMessage('Connect Canvas in your profile settings.')
          return
        }

        if (!response.ok) {
          setAssignments([])
          setErrorMessage('Unable to load Canvas assignments.')
          return
        }

        setAssignments(Array.isArray(body) ? body : [])
        setErrorMessage(null)
      } catch {
        setAssignments([])
        setErrorMessage('Unable to load Canvas assignments.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadAssignments()
  }, [])

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Canvas</p>
          <h2 className="mt-2 text-2xl font-semibold">Upcoming assignments</h2>
        </div>
        <span className="text-sm text-black/60 dark:text-white/60">{isLoading ? 'Loading…' : `${assignments.length} items`}</span>
      </div>

      {errorMessage ? (
        <p className="mt-6 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: `${ACCENT_COLOR}33` }}>
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !errorMessage && assignments.length === 0 ? (
        <p className="mt-6 text-sm text-black/70 dark:text-white/70">No upcoming Canvas assignments were returned.</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-2xl border p-4" style={{ borderColor: `${ACCENT_COLOR}33` }}>
            <p className="text-base font-semibold">{assignment.title}</p>
            <p className="mt-1 text-sm text-black/70 dark:text-white/70">{assignment.courseName}</p>
            <p className="mt-2 text-xs text-black/60 dark:text-white/60">{assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleString()}` : 'No due date provided'}</p>
          </article>
        ))}
      </div>
    </section>
  )
}