'use client'

import { useEffect, useMemo, useState } from 'react'
import { ACCENT_COLOR } from '@/lib/constants'
import type { HeatmapEntry } from '@/types'

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

  const entryMap = useMemo(() => new Map(entries.map((entry) => [entry.date, entry.count])), [entries])

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 364)

  const squares = Array.from({ length: 365 }, (_, index) => {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + index)
    const dateKey = currentDate.toISOString().slice(0, 10)
    const count = entryMap.get(dateKey) ?? 0

    return (
      <div
        key={dateKey}
        title={`${dateKey}: ${count} logins`}
        className="h-3.5 w-3.5 rounded-sm"
        style={{
          backgroundColor:
            count === 0
              ? 'rgb(229 231 235)'
              : count === 1
                ? `${ACCENT_COLOR}66`
                : count === 2
                  ? `${ACCENT_COLOR}99`
                  : ACCENT_COLOR,
        }}
      />
    )
  })

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Activity</p>
          <h2 className="mt-2 text-2xl font-semibold">Login heatmap</h2>
        </div>
        <div className="text-sm text-black/60 dark:text-white/60">{isLoading ? 'Loading…' : `${entries.length} active days`}</div>
      </div>
      <div className="mt-6 grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 overflow-x-auto pb-1">{squares}</div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-black/60 dark:text-white/60">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-gray-300" />
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: `${ACCENT_COLOR}66` }} />
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: `${ACCENT_COLOR}99` }} />
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: ACCENT_COLOR }} />
        <span>More</span>
      </div>
    </section>
  )
}