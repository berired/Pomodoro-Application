import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const controlSchema = z.object({
  action: z.enum(['play', 'pause', 'next', 'previous']),
  uris: z.array(z.string()).optional(),
  contextUri: z.string().optional(),
  positionMs: z.number().int().nonnegative().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = controlSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
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

    const requestInit: RequestInit = {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRow.access_token}` },
    }

    let endpoint = ''
    if (parsed.data.action === 'play') {
      endpoint = 'https://api.spotify.com/v1/me/player/play'
      requestInit.body = JSON.stringify({
        context_uri: parsed.data.contextUri,
        uris: parsed.data.uris,
        position_ms: parsed.data.positionMs,
      })
      requestInit.headers = { ...requestInit.headers, 'Content-Type': 'application/json' }
    } else if (parsed.data.action === 'pause') {
      endpoint = 'https://api.spotify.com/v1/me/player/pause'
    } else if (parsed.data.action === 'next') {
      endpoint = 'https://api.spotify.com/v1/me/player/next'
      requestInit.method = 'POST'
    } else if (parsed.data.action === 'previous') {
      endpoint = 'https://api.spotify.com/v1/me/player/previous'
      requestInit.method = 'POST'
    }

    const response = await fetch(endpoint, requestInit)
    if (!response.ok && response.status !== 204) {
      return NextResponse.json({ error: 'Spotify request failed' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
