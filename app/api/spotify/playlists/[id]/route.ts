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

type RawItem = {
  track?: RawTrack | null
  item?: RawTrack | null
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

async function spFetch<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw Object.assign(new Error('spotify_error'), { status: res.status })
  return res.json() as Promise<T>
}

// Strategy A: paginated /playlists/{id}/tracks endpoint
async function fetchViaTracks(playlistId: string, token: string): Promise<SpotifyTrack[]> {
  type Page = { items: RawItem[]; next: string | null }
  const first = await spFetch<Page>(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
    token,
  )
  const items: RawItem[] = first.items ?? []
  let nextUrl: string | null = first.next ?? null
  while (nextUrl && items.length < 500) {
    try {
      const page = await spFetch<Page>(nextUrl, token)
      items.push(...(page.items ?? []))
      nextUrl = page.next ?? null
    } catch {
      break
    }
  }
  return items.map(mapItem).filter((t): t is SpotifyTrack => t !== null)
}

// Strategy B: full playlist object — embeds up to 100 tracks in one call.
// Works for some playlists where the /tracks sub-endpoint is blocked.
async function fetchViaPlaylist(playlistId: string, token: string): Promise<SpotifyTrack[]> {
  type PlaylistResp = {
    tracks: { items: RawItem[]; next: string | null }
  }
  const fields = 'tracks(items(is_local,track(id,name,duration_ms,type,artists(name),album(images))),next)'
  const data = await spFetch<PlaylistResp>(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=${encodeURIComponent(fields)}`,
    token,
  )
  const items: RawItem[] = data.tracks?.items ?? []
  let nextUrl: string | null = data.tracks?.next ?? null
  while (nextUrl && items.length < 500) {
    try {
      type Page = { items: RawItem[]; next: string | null }
      const page = await spFetch<Page>(nextUrl, token)
      items.push(...(page.items ?? []))
      nextUrl = page.next ?? null
    } catch {
      break
    }
  }
  return items.map(mapItem).filter((t): t is SpotifyTrack => t !== null)
}

async function fetchTracks(playlistId: string, token: string): Promise<SpotifyTrack[]> {
  try {
    return await fetchViaTracks(playlistId, token)
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    // Only try the fallback strategy on 403/404 — other errors propagate up
    if (status !== 403 && status !== 404) throw err
    return await fetchViaPlaylist(playlistId, token)
  }
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

    // 1. Try with user token (both strategies)
    try {
      const tracks = await fetchTracks(id, userToken)
      return NextResponse.json({ tracks })
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 401) return fail('unauthorized')
      if (status !== 403 && status !== 404) return fail('failed')
    }

    // 2. Client Credentials fallback — for public playlists only
    const clientToken = await getSpotifyClientToken()
    if (!clientToken) return fail('failed')

    try {
      const tracks = await fetchTracks(id, clientToken)
      return NextResponse.json({ tracks })
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 403) return fail('inaccessible')
      return fail('failed')
    }
  } catch {
    return fail('failed')
  }
}
