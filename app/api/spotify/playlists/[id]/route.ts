import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSpotifyToken, getSpotifyClientToken } from '@/lib/spotifyToken'
import type { SpotifyTrack } from '@/types'

type RawTrack = {
  id: string
  name: string
  duration_ms: number
  type?: string
  artists: Array<{ name: string }>
  album: { images: Array<{ url: string }> }
}

// Spotify's /items endpoint wraps each entry in a field called either "track"
// (legacy /tracks endpoint) or the same "track" key (some versions also use "item").
// We read both so we work regardless of which the server returns.
type RawItem = {
  track?: RawTrack | null   // /playlists/{id}/tracks  AND  /playlists/{id}/items
  item?: RawTrack | null    // some API versions of /playlists/{id}/items
  is_local?: boolean
}

function mapItem(raw: RawItem): SpotifyTrack | null {
  if (raw.is_local) return null
  const t = raw.track ?? raw.item
  if (!t || t.type === 'episode' || !t.album || !t.id) return null
  return {
    id: t.id,
    trackName: t.name,
    artistName: (t.artists ?? []).map((a) => a.name).join(', '),
    albumArt: t.album.images?.[0]?.url ?? '',
    durationMs: t.duration_ms,
  }
}

async function fetchPage(
  url: string,
  token: string,
): Promise<{ items: RawItem[]; next: string | null }> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw Object.assign(new Error('spotify_error'), { status: res.status })
  return res.json()
}

async function fetchAllTracks(playlistId: string, token: string): Promise<SpotifyTrack[]> {
  const first = await fetchPage(
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks?limit=50`,
    token,
  )
  const items: RawItem[] = first.items ?? []
  let nextUrl: string | null = first.next ?? null

  while (nextUrl && items.length < 500) {
    try {
      const page = await fetchPage(nextUrl, token)
      items.push(...(page.items ?? []))
      nextUrl = page.next ?? null
    } catch {
      break
    }
  }

  return items.map(mapItem).filter((t): t is SpotifyTrack => t !== null)
}

// Always returns HTTP 200 — errors go in the body so the browser console stays clean.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const fail = (reason: string) => NextResponse.json({ tracks: [], reason })

  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail('unauthorized')

    const userToken = await getSpotifyToken(user.id)
    if (!userToken) return fail('not_connected')

    // 1. Try with user token (own + collaborative playlists)
    try {
      const tracks = await fetchAllTracks(id, userToken)
      return NextResponse.json({ tracks })
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 401) return fail('unauthorized')
      if (status !== 403 && status !== 404) return fail('failed')
    }

    // 2. Client Credentials fallback — reads any public playlist
    const clientToken = await getSpotifyClientToken()
    if (!clientToken) return fail('failed')

    try {
      const tracks = await fetchAllTracks(id, clientToken)
      return NextResponse.json({ tracks })
    } catch {
      return fail('failed')
    }
  } catch {
    return fail('failed')
  }
}
