import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { z } from 'zod'

const schema = z.object({
  domain: z.string().min(1),
  token: z.string().min(1),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

    const domain = parsed.data.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim()
    const token = parsed.data.token.trim()

    const res = await fetch(`https://${domain}/api/v1/users/self`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: 'Invalid token — check that it was copied correctly.' }, { status: 400 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Could not reach Canvas at "${domain}". Check the domain.` }, { status: 400 })
    }

    const self = await res.json() as { name?: string; email?: string }
    return NextResponse.json({ name: self.name ?? 'Canvas User', email: self.email ?? '' })
  } catch {
    return NextResponse.json({ error: 'Could not connect. Check the domain and try again.' }, { status: 500 })
  }
}
