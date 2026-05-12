import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { auth } from '@/lib/auth'
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
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRow, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, username, school, canvas_domain, created_at')
      .eq('id', authSession.user.id)
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
    const authSession = await auth()
    if (!authSession?.user?.id) {
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
    if (canvasDomain !== undefined) updatePayload.canvas_domain = canvasDomain?.trim() ? canvasDomain : null
    if (canvasToken !== undefined) updatePayload.canvas_token = canvasToken?.trim() ? encryptToken(canvasToken) : null

    if (newPassword !== undefined) {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      }

      const { data: currentUser, error: currentUserError } = await supabaseAdmin
        .from('users')
        .select('password')
        .eq('id', authSession.user.id)
        .maybeSingle()

      if (currentUserError) {
        return NextResponse.json({ error: currentUserError.message }, { status: 500 })
      }

      if (!currentUser) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const passwordMatches = await bcrypt.compare(oldPassword, currentUser.password)
      if (!passwordMatches) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      updatePayload.password = await bcrypt.hash(newPassword, 12)
    }

    if (username) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', authSession.user.id)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', authSession.user.id)
      .select('id, name, email, username, school, canvas_domain, created_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}