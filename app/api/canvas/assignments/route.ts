import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { decryptToken } from '@/lib/crypto'
import type { CanvasAssignment } from '@/types'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('canvas_token, canvas_domain')
      .eq('id', authSession.user.id)
      .single()

    if (!userRow?.canvas_token || !userRow?.canvas_domain) {
      return NextResponse.json({ error: 'NO_CANVAS_TOKEN' }, { status: 403 })
    }

    const decryptedToken = decryptToken(userRow.canvas_token)

    const res = await fetch(
      `https://${userRow.canvas_domain}/api/v1/users/self/upcoming_events`,
      {
        headers: { Authorization: `Bearer ${decryptedToken}` },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Canvas' }, { status: 502 })
    }

    const events = await res.json()

    const assignments: CanvasAssignment[] = events
      .filter((event: unknown) => {
        const e = event as Record<string, unknown>
        return e.type === 'assignment'
      })
      .map((event: unknown) => {
        const e = event as Record<string, unknown>
        return {
          id: e.id,
          title: e.title,
          courseName: e.course_name || 'Unknown Course',
          dueAt: e.due_at || null,
        }
      })

    return NextResponse.json(assignments satisfies CanvasAssignment[])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
