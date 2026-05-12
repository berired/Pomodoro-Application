import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSpotifyToken } from '@/lib/spotifyToken'
import type { SpotifyPlaylist } from '@/types'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accessToken = await getSpotifyToken(user.id)
    if (!accessToken) return NextResponse.json({ error: 'Not connected' }, { status: 404 })

    // Fetch current Spotify user ID and playlists in parallel
    const [meRes, plRes] = await Promise.all([
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ])

    if (!plRes.ok) return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 502 })

    const spotifyUserId: string = meRes.ok
      ? ((await meRes.json()) as { id: string }).id
      : ''

    const spotifyData = await plRes.json()
    const playlists: SpotifyPlaylist[] = (
      spotifyData.items as Array<Record<string, unknown>>
    ).map((pl) => {
      const owner = pl.owner as Record<string, unknown> | undefined
      return {
        id: String(pl.id ?? ''),
        name: String(pl.name ?? ''),
        imageUrl: String(
          (pl.images as Array<Record<string, unknown>> | undefined)?.[0]?.url ?? '',
        ),
        trackCount: Number(
          (pl.tracks as Record<string, unknown> | undefined)?.total ??
          (pl.items as Record<string, unknown> | undefined)?.total ??
          0,
        ),
        isOwned: !!spotifyUserId && owner?.id === spotifyUserId,
      }
    })

    return NextResponse.json(playlists)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
