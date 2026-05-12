import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: tokenRow } = await supabaseAdmin
      .from('spotify_tokens')
      .select('access_token, expires_at')
      .eq('user_id', authSession.user.id)
      .maybeSingle()

    if (!tokenRow) {
      return NextResponse.json({ error: 'Not connected' }, { status: 404 })
    }

    return NextResponse.json({ accessToken: tokenRow.access_token, expiresAt: tokenRow.expires_at })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
