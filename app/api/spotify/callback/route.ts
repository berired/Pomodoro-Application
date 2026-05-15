import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabase'
import { signState } from '@/lib/spotifyState'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
    }

    const [nonce, sig] = (state ?? '').split('.')
    if (!nonce || !sig || signState(nonce, user.id) !== sig) {
      return NextResponse.redirect(new URL('/?error=state_mismatch', req.url))
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return NextResponse.redirect(new URL('/?error=config_error', req.url))
    }

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }).toString(),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', req.url))
    }

    const tokenData = await tokenRes.json()
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    const { error } = await supabaseAdmin.from('spotify_tokens').upsert(
      {
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      return NextResponse.redirect(new URL('/?error=storage_failed', req.url))
    }

    return NextResponse.redirect(new URL('/spotify/connected', req.url))
  } catch {
    return NextResponse.redirect(new URL('/?error=server_error', req.url))
  }
}
