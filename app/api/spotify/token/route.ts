import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSpotifyToken } from '@/lib/spotifyToken'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ connected: false })

    const accessToken = await getSpotifyToken(user.id)
    if (!accessToken) return NextResponse.json({ connected: false })

    return NextResponse.json({ connected: true, accessToken })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
