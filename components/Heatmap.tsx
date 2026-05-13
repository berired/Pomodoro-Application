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

function getHeatChar(count: number): string {
  if (count === 0) return '░'
  if (count === 1) return '▒'
  if (count === 2) return '▓'
  return '█'
}

export default function Heatmap(): React.JSX.Element {
  const [entries, setEntries] = useState<HeatmapEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadHeatmap(): Promise<void> {
      try {
        const response = await fetch('/api/heatmap')
        if (!response.ok) { setEntries([]); return }
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
    <section className="term-window flex flex-col">
      <div className="term-titlebar">
        <div className="term-titlebar-dots">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        <span>ACTIVITY_LOG.DAT</span>
        <span className="ml-auto text-[10px]">
          {isLoading ? 'LOADING...' : `${entries.length} ACTIVE DAYS`}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-primary text-xs" style={{ textShadow: 'var(--phosphor-glow)' }}>&gt; </span>
          <h2 className="text-sm">LOGIN HEATMAP</h2>
        </div>

        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-px">
            {/* Day labels */}
            <div className="mr-1 flex flex-col gap-px">
              <div className="h-4" />
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex h-2.5 w-7 items-center text-[9px] text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => {
              const showMonth = wi === 0 || week[0].month !== weeks[wi - 1][0].month
              return (
                <div key={wi} className="flex flex-col gap-px">
                  <div className="h-4 whitespace-nowrap text-[9px] text-muted-foreground">
                    {showMonth ? new Date(week[0].dateKey).toLocaleString('default', { month: 'short' }).toUpperCase() : ''}
                  </div>
                  {week.map(({ dateKey, count }) => (
                    <div
                      key={dateKey}
                      title={`${dateKey}: ${count} login${count !== 1 ? 's' : ''}`}
                      className="h-2.5 w-2.5 text-[8px] leading-none"
                      style={{ backgroundColor: getHeatColor(count) }}
                      aria-label={`${dateKey}: ${count} logins`}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>LESS</span>
          {[0, 1, 2, 3].map((level) => (
            <span
              key={level}
              className="font-mono text-xs"
              style={{ color: getHeatColor(level), textShadow: level > 1 ? 'var(--phosphor-glow)' : 'none' }}
              aria-hidden="true"
            >
              {getHeatChar(level)}
            </span>
          ))}
          <span>MORE</span>
        </div>
      </div>
    </section>
  )
}
