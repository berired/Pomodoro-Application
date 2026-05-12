'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { CanvasAssignment } from '@/types'

type FetchState = 'loading' | 'no_token' | 'invalid_token' | 'error' | 'ok'

function formatDue(dueAt: string | null): string {
  if (!dueAt) return 'No due date'
  const date = new Date(dueAt)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `Overdue · ${date.toLocaleDateString()}`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays} days`
  return `Due ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false
  return new Date(dueAt) < new Date()
}

export default function CanvasTodoList(): React.JSX.Element {
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([])
  const [state, setState] = useState<FetchState>('loading')

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setState('loading')
        const response = await fetch('/api/canvas/assignments')
        const body = await response.json() as CanvasAssignment[] | { error?: string }

        if (response.status === 403) {
          const errorCode = (body as { error?: string }).error
          setState(errorCode === 'INVALID_CANVAS_TOKEN' ? 'invalid_token' : 'no_token')
          return
        }

        if (!response.ok) {
          setState('error')
          return
        }

        setAssignments(Array.isArray(body) ? body : [])
        setState('ok')
      } catch {
        setState('error')
      }
    }

    void load()
  }, [])

  return (
    <section className="rounded-3xl border border-primary p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Canvas</p>
          <h2 className="mt-2 text-2xl font-semibold">Upcoming assignments</h2>
        </div>
        {state === 'ok' && (
          <span className="text-sm text-muted-foreground">
            {assignments.length} {assignments.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {state === 'loading' && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-primary/10" />
          ))}
        </div>
      )}

      {state === 'no_token' && (
        <div className="mt-6 rounded-2xl border border-primary/25 p-4">
          <p className="text-sm font-medium">Canvas not connected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your Canvas domain and personal access token to see your upcoming assignments.
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Connect Canvas
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      )}

      {state === 'invalid_token' && (
        <div className="mt-6 rounded-2xl border border-primary/25 p-4">
          <p className="text-sm font-medium">Canvas token is invalid or expired</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a new personal access token in Canvas and update it in your profile.
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Update token
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      )}

      {state === 'error' && (
        <p className="mt-6 text-sm text-destructive">
          Failed to load Canvas assignments. Check your Canvas domain in profile settings.
        </p>
      )}

      {state === 'ok' && assignments.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No upcoming assignments — you&apos;re all caught up!
        </p>
      )}

      {state === 'ok' && assignments.length > 0 && (
        <div className="mt-6 space-y-3">
          {assignments.map((assignment) => (
            <article
              key={assignment.id}
              className="rounded-2xl border border-primary/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{assignment.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{assignment.courseName}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    isOverdue(assignment.dueAt)
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {formatDue(assignment.dueAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
