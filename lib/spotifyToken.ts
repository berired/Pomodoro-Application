import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

// ── App-level token (Client Credentials) ──────────────────────────────────
// Used to read public Spotify data without user ownership restrictions.
let _clientToken: { token: string; expiresAt: number } | null = null

export async function getSpotifyClientToken(): Promise<string | null> {
  if (_clientToken && _clientToken.expiresAt > Date.now() + 60_000) {
    return _clientToken.token
  }
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token: string; expires_in: number }
    _clientToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
    return _clientToken.token
  } catch {
    return null
  }
}

/**
 * Returns a valid Spotify access token for the user, refreshing if expired.
 * Returns null if the user has no connected Spotify account.
 */
export async function getSpotifyToken(userId: string): Promise<string | null> {
  const { data: row } = await supabaseAdmin
    .from('spotify_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!row) return null

  const isExpired = new Date(row.expires_at).getTime() - Date.now() < 60_000

  if (!isExpired) return row.access_token

  // Token expired — refresh it
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: row.refresh_token,
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET,
    }).toString(),
  })

  if (!res.ok) return null

  const data = await res.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

  await supabaseAdmin.from('spotify_tokens').update({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? row.refresh_token,
    expires_at: expiresAt,
  }).eq('user_id', userId)

  return data.access_token
}
