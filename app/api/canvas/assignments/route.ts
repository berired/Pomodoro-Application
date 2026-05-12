import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabase'
import { decryptToken } from '@/lib/crypto'
import type { CanvasAssignment } from '@/types'

async function fetchPlanner(domain: string, token: string): Promise<CanvasAssignment[] | null> {
  const today = new Date().toISOString().slice(0, 10)
  const url = `https://${domain}/api/v1/planner/items?start_date=${today}&per_page=50`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    console.error('[canvas] planner/items failed', res.status, await res.text())
    return null
  }

  const items = (await res.json()) as unknown[]

  return items
    .filter((item) => {
      const i = item as Record<string, unknown>
      return i.plannable_type === 'assignment' || i.plannable_type === 'quiz'
    })
    .map((item) => {
      const i = item as Record<string, unknown>
      const plannable = (i.plannable ?? {}) as Record<string, unknown>
      return {
        id: (plannable.id as number) ?? 0,
        title: String(plannable.title ?? plannable.name ?? 'Untitled'),
        courseName: String((i.context_name as string | undefined) ?? 'Unknown Course'),
        dueAt: (plannable.due_at as string | null) ?? null,
      } satisfies CanvasAssignment
    })
}

async function fetchTodoItems(domain: string, token: string): Promise<CanvasAssignment[] | null> {
  const url = `https://${domain}/api/v1/users/self/todo_items?per_page=50`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    console.error('[canvas] todo_items failed', res.status, await res.text())
    return null
  }

  const items = (await res.json()) as unknown[]

  return items
    .filter((item) => {
      const i = item as Record<string, unknown>
      return i.type === 'submitting'
    })
    .map((item) => {
      const i = item as Record<string, unknown>
      const assignment = (i.assignment ?? {}) as Record<string, unknown>
      return {
        id: (assignment.id as number) ?? 0,
        title: String(assignment.name ?? 'Untitled'),
        courseName: String((i.context_name as string | undefined) ?? 'Unknown Course'),
        dueAt: (assignment.due_at as string | null) ?? null,
      } satisfies CanvasAssignment
    })
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('canvas_token, canvas_domain')
      .eq('id', user.id)
      .single()

    if (!userRow?.canvas_token || !userRow?.canvas_domain) {
      return NextResponse.json({ error: 'NO_CANVAS_TOKEN' }, { status: 403 })
    }

    let decryptedToken: string
    try {
      decryptedToken = decryptToken(userRow.canvas_token)
    } catch {
      return NextResponse.json({ error: 'NO_CANVAS_TOKEN' }, { status: 403 })
    }

    const domain = userRow.canvas_domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .trim()

    // Verify the token is valid with a lightweight /users/self call
    const selfRes = await fetch(`https://${domain}/api/v1/users/self`, {
      headers: { Authorization: `Bearer ${decryptedToken}` },
      next: { revalidate: 0 },
    })

    if (selfRes.status === 401 || selfRes.status === 403) {
      return NextResponse.json({ error: 'INVALID_CANVAS_TOKEN' }, { status: 403 })
    }

    if (!selfRes.ok) {
      console.error('[canvas] /users/self failed', selfRes.status)
      return NextResponse.json({ error: 'Failed to reach Canvas' }, { status: 502 })
    }

    // Try planner/items first, fall back to todo_items
    let assignments = await fetchPlanner(domain, decryptedToken)
    if (assignments === null) {
      assignments = await fetchTodoItems(domain, decryptedToken) ?? []
    }

    return NextResponse.json(assignments)
  } catch (err) {
    console.error('[canvas] route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
