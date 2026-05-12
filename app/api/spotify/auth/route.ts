import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    void req
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SPOTIFY_CLIENT_ID) {
      return NextResponse.json({ error: 'Spotify client ID not configured' }, { status: 500 })
    }

    const state = Math.random().toString(36).substring(7)
    const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state'

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope,
      state,
    })

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    const response = NextResponse.redirect(spotifyAuthUrl)
    response.cookies.set('spotify_auth_state', state, { httpOnly: true, maxAge: 600 })
    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
