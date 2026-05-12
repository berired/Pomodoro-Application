import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { TaskRow } from '@/types'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  all_day: z.boolean().default(false),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
})

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: taskRows, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', authSession.user.id)
      .order('date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(taskRows satisfies TaskRow[])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { data: newTask, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        user_id: authSession.user.id,
        ...parsed.data,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(newTask satisfies TaskRow, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
