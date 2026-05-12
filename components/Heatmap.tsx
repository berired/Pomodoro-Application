'use client'

import { useEffect, useMemo, useState } from 'react'
import type { HeatmapEntry } from '@/types'

const WEEKS = 52
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function getHeatColor(count: number): string {
  if (count === 0) return 'var(--heat-0)'
  if (count === 1) return 'var(--heat-1)'
  if (count === 2) return 'var(--heat-2)'
  return 'var(--heat-3)'
}

export default function Heatmap(): React.JSX.Element {
  const [entries, setEntries] = useState<HeatmapEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadHeatmap(): Promise<void> {
      try {
        const response = await fetch('/api/heatmap')
        if (!response.ok) {
          setEntries([])
          return
        }
        const payload = (await response.json()) as HeatmapEntry[]
        setEntries(payload)
      } finally {
        setIsLoading(false)
      }
    }

    void loadHeatmap()
  }, [])

  const entryMap = useMemo(() => new Map(entries.map((e) => [e.date, e.count])), [entries])

  const weeks = useMemo(() => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - WEEKS * 7)
    start.setDate(start.getDate() - start.getDay())

    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        const dateKey = date.toISOString().slice(0, 10)
        return { dateKey, count: entryMap.get(dateKey) ?? 0, month: date.getMonth() }
      })
    )
  }, [entryMap])

  return (
    <section className="rounded-3xl border border-primary px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Activity</p>
          <h2 className="mt-0.5 text-base font-semibold">Login heatmap</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading…' : `${entries.length} active days`}
        </div>
      </div>

      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-1">
          {/* Day labels */}
          <div className="mr-1 flex flex-col gap-0.5">
            <div className="h-4" />
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="flex h-2.5 w-6 items-center text-[10px] text-muted-foreground">
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => {
            const showMonth = wi === 0 || week[0].month !== weeks[wi - 1][0].month
            return (
              <div key={wi} className="flex flex-col gap-0.5">
                <div className="h-4 whitespace-nowrap text-[10px] text-muted-foreground">
                  {showMonth ? new Date(week[0].dateKey).toLocaleString('default', { month: 'short' }) : ''}
                </div>
                {week.map(({ dateKey, count }) => (
                  <div
                    key={dateKey}
                    title={`${dateKey}: ${count} login${count !== 1 ? 's' : ''}`}
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: getHeatColor(count) }}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3].map((level) => (
          <span
            key={level}
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: getHeatColor(level) }}
          />
        ))}
        <span>More</span>
      </div>
    </section>
  )
}
