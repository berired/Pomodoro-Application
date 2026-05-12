import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const username = req.nextUrl.searchParams.get('username')
    if (!username) {
      return NextResponse.json({ email: null }, { status: 400 })
    }

    const { data } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('username', username)
      .maybeSingle()

    return NextResponse.json({ email: data?.email ?? null })
  } catch {
    return NextResponse.json({ email: null }, { status: 500 })
  }
}
