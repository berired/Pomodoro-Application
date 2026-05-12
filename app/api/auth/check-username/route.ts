import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const username = req.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    return NextResponse.json({ exists: !!userRow }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
