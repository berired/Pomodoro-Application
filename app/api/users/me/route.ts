import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { encryptToken } from '@/lib/crypto'
import { supabaseAdmin } from '@/lib/supabase'
import type { Database } from '@/types/database'

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  school: z.string().optional().nullable(),
  canvasToken: z.string().optional().nullable(),
  canvasDomain: z.string().optional().nullable(),
  oldPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional(),
})

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRow, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, username, school, canvas_domain, created_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!userRow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(userRow)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { fullName, username, school, canvasToken, canvasDomain, oldPassword, newPassword } = parsed.data
    const updatePayload: Database['public']['Tables']['users']['Update'] = {}

    if (fullName !== undefined) updatePayload.name = fullName
    if (username !== undefined) updatePayload.username = username
    if (school !== undefined) updatePayload.school = school?.trim() ? school : null
    if (canvasDomain !== undefined) updatePayload.canvas_domain = canvasDomain?.trim() ? canvasDomain.trim() : null
    if (canvasToken !== undefined) {
      if (canvasToken === 'DISCONNECT') {
        // Explicit disconnect — clear both token and domain
        updatePayload.canvas_token = null
        updatePayload.canvas_domain = null
      } else if (canvasToken?.trim() !== '') {
        // New token provided — encrypt and store
        updatePayload.canvas_token = encryptToken(canvasToken!.trim())
      }
      // Empty string = leave existing token unchanged
    }

    if (newPassword !== undefined) {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      }

      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', user.id)
        .maybeSingle()

      if (!userRow?.email) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      // Verify old password by attempting sign-in without persisting session
      const tempClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      )
      const { error: verifyError } = await tempClient.auth.signInWithPassword({
        email: userRow.email,
        password: oldPassword,
      })
      if (verifyError) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
      })
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 500 })
      }
    }

    if (username) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
    }

    if (Object.keys(updatePayload).length === 0 && newPassword === undefined) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    if (Object.keys(updatePayload).length > 0) {
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', user.id)
        .select('id, name, email, username, school, canvas_domain, created_at')
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(updatedUser)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
