import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Spotify client not configured' }, { status: 500 })
    }

    const { data: tokenRow, error } = await supabaseAdmin
      .from('spotify_tokens')
      .select('refresh_token')
      .eq('user_id', authSession.user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tokenRow?.refresh_token) {
      return NextResponse.json({ error: 'Not connected' }, { status: 404 })
    }

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenRow.refresh_token,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }).toString(),
    })

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Failed to refresh Spotify token' }, { status: 502 })
    }

    const tokenData = await tokenRes.json()
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    const { error: updateError } = await supabaseAdmin
      .from('spotify_tokens')
      .upsert(
        {
          user_id: authSession.user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token ?? tokenRow.refresh_token,
          expires_at: expiresAt,
        },
        { onConflict: 'user_id' }
      )

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}