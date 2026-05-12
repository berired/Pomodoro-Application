import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { SpotifyPlaylist } from '@/types'

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

    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
      headers: { Authorization: `Bearer ${tokenRow.access_token}` },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 502 })
    }

    const spotifyData = await response.json()
    const playlists: SpotifyPlaylist[] = (spotifyData.items as Array<Record<string, unknown>>).map((playlist) => ({
      id: String(playlist.id ?? ''),
      name: String(playlist.name ?? ''),
      imageUrl: String((playlist.images as Array<Record<string, unknown>> | undefined)?.[0]?.url ?? ''),
      trackCount: Number((playlist.tracks as Record<string, unknown> | undefined)?.total ?? 0),
    }))

    return NextResponse.json(playlists)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}