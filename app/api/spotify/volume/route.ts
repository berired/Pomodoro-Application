import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const volumeSchema = z.object({
  volumePercent: z.number().int().min(0).max(100),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = volumeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { data: tokenRow, error } = await supabaseAdmin
      .from('spotify_tokens')
      .select('access_token')
      .eq('user_id', authSession.user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tokenRow?.access_token) {
      return NextResponse.json({ error: 'Not connected' }, { status: 404 })
    }

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/volume?volume_percent=${parsed.data.volumePercent}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenRow.access_token}` },
      }
    )

    if (!response.ok && response.status !== 204) {
      return NextResponse.json({ error: 'Spotify volume request failed' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
