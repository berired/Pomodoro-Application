'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react'
import { ACCENT_COLOR, DAYS_OF_WEEK } from '@/lib/constants'
import type { TaskRow } from '@/types'

interface CalendarViewProps {
  taskRows: TaskRow[]
}

type CalendarItem = { id: string; title: string; timeLabel: string; completed: boolean }

interface CalendarDayDetails {
  dateKey: string
  weekdayName: string
  items: CalendarItem[]
}

function getWeekdayName(dateValue: Date): (typeof DAYS_OF_WEEK)[number] {
  return DAYS_OF_WEEK[(dateValue.getDay() + 6) % 7]
}

function getMonthLabel(dateValue: Date): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(dateValue)
}

function toDateKey(dateValue: Date): string {
  return dateValue.toISOString().slice(0, 10)
}

function addMonths(dateValue: Date, monthsToAdd: number): Date {
  const nextDate = new Date(dateValue)
  nextDate.setMonth(nextDate.getMonth() + monthsToAdd)
  return nextDate
}

export default function CalendarView({ taskRows }: CalendarViewProps): React.JSX.Element {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<CalendarDayDetails | null>(null)

  const monthData = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const leadingDays = (monthStart.getDay() + 6) % 7
    const totalGridDays = Math.ceil((leadingDays + monthEnd.getDate()) / 7) * 7
    const firstGridDate = new Date(monthStart)
    firstGridDate.setDate(monthStart.getDate() - leadingDays)

    const dayCells = Array.from({ length: totalGridDays }, (_, index) => {
      const cellDate = new Date(firstGridDate)
      cellDate.setDate(firstGridDate.getDate() + index)
      const dateKey = toDateKey(cellDate)

      const items = taskRows
        .filter((t) => t.date === dateKey)
        .map<CalendarItem>((t) => ({
          id: t.id,
          title: t.title,
          timeLabel: t.all_day ? 'All day' : [t.start_time, t.end_time].filter(Boolean).join(' – '),
          completed: t.completed,
        }))

      return {
        dateKey,
        dayNumber: cellDate.getMonth() === currentMonth.getMonth() ? cellDate.getDate() : null,
        isToday: dateKey === toDateKey(new Date()),
        weekdayName: getWeekdayName(cellDate),
        items,
      }
    })

    return { dayCells }
  }, [currentMonth, taskRows])

  useEffect(() => {
    const dialog = document.getElementById('calendar-detail-dialog') as HTMLDialogElement | null
    if (!dialog) return
    if (selectedDay && !dialog.open) dialog.showModal()
    if (!selectedDay && dialog.open) dialog.close()
  }, [selectedDay])

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Calendar</p>
          <h2 className="mt-2 text-2xl font-semibold">{getMonthLabel(currentMonth)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous month" onClick={() => setCurrentMonth((m) => addMonths(m, -1))} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next month" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="px-3 py-2 text-center">{d.slice(0, 3)}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {monthData.dayCells.map((cell) => (
          <button
            key={cell.dateKey}
            type="button"
            onClick={() => setSelectedDay({ dateKey: cell.dateKey, weekdayName: cell.weekdayName, items: cell.items })}
            className="min-h-36 rounded-2xl border p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              borderColor: `${ACCENT_COLOR}33`,
              backgroundColor: cell.isToday ? ACCENT_COLOR : undefined,
              color: cell.isToday ? '#ffffff' : undefined,
              opacity: cell.dayNumber === null ? 0.45 : 1,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold">{cell.dateKey.slice(8, 10)}</span>
              {cell.items.length > 0 && (
                <span className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: cell.isToday ? 'rgba(255,255,255,0.15)' : `${ACCENT_COLOR}14` }}>
                  {cell.items.length}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {cell.items.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border px-2 py-1 text-xs" style={{ borderColor: cell.isToday ? 'rgba(255,255,255,0.25)' : `${ACCENT_COLOR}26` }}>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">{item.title}</span>
                  </div>
                  <p className="mt-1 truncate opacity-75">{item.timeLabel}</p>
                </div>
              ))}
              {cell.items.length > 3 && <p className="text-[11px] opacity-75">+{cell.items.length - 3} more</p>}
            </div>
          </button>
        ))}
      </div>

      <dialog
        id="calendar-detail-dialog"
        className="fixed inset-0 m-auto h-fit w-full max-w-lg rounded-3xl border bg-white p-0 text-black shadow-2xl backdrop:bg-black/60 dark:bg-black dark:text-white"
        style={{ borderColor: ACCENT_COLOR }}
        onCancel={() => setSelectedDay(null)}
      >
        {selectedDay && (
          <div className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedDay.dateKey}</h3>
                <p className="mt-1 text-sm text-black/60 dark:text-white/50">{selectedDay.weekdayName}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSelectedDay(null)} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {selectedDay.items.length === 0 ? (
              <p className="text-sm text-black/60 dark:text-white/50">No tasks scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedDay.items.map((item) => (
                  <article key={item.id} className="rounded-2xl border p-4" style={{ borderColor: `${ACCENT_COLOR}33` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-black/60 dark:text-white/50">{item.timeLabel}</p>
                      </div>
                      {item.completed && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium text-green-600" style={{ backgroundColor: '#dcfce7' }}>
                          Done
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </dialog>
    </section>
  )
}
