import 'server-only'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { signState } from '@/lib/spotifyState'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    void req
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SPOTIFY_CLIENT_ID) {
      return NextResponse.json({ error: 'Spotify client ID not configured' }, { status: 500 })
    }

    const nonce = randomBytes(8).toString('hex')
    const sig = signState(nonce, user.id)
    const state = `${nonce}.${sig}`

    const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state'

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope,
      state,
      show_dialog: 'true',
    })

    return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
