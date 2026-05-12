import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { PASSWORD_REGEX } from '@/lib/constants'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  school: z.string().min(1, 'School is required'),
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().regex(PASSWORD_REGEX, 'Password must be 8-16 characters with at least one uppercase letter and one number'),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { fullName, school, email, username, password } = parsed.data

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    })

    if (authError) {
      if (authError.status === 422 || authError.message.toLowerCase().includes('already')) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      name: fullName,
      school,
      email,
      username,
    })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (profileError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: profileError.message }, { status: 409 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
