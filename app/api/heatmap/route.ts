import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabase'
import type { HeatmapEntry } from '@/types'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    void _req
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)

    const { data: activityRows, error } = await supabaseAdmin
      .from('login_activity')
      .select('login_at')
      .eq('user_id', user.id)
      .gte('login_at', cutoffDate.toISOString())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const countsByDate: Record<string, number> = {}
    for (const row of activityRows ?? []) {
      const dateKey = row.login_at.slice(0, 10)
      countsByDate[dateKey] = (countsByDate[dateKey] ?? 0) + 1
    }

    const heatmapEntries: HeatmapEntry[] = Object.entries(countsByDate).map(([date, count]) => ({
      date,
      count,
    }))

    return NextResponse.json(heatmapEntries)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
