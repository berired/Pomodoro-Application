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

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${tokenRow.access_token}` },
    })

    if (response.status === 204) {
      return NextResponse.json({ isPlaying: false, item: null })
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch current playback' }, { status: 502 })
    }

    const currentPlayback = await response.json()
    return NextResponse.json(currentPlayback)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
