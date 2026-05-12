'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock3, School, X } from 'lucide-react'
import { ACCENT_COLOR, DAYS_OF_WEEK } from '@/lib/constants'
import type { ClassRow, TaskRow } from '@/types'

interface CalendarViewProps {
  taskRows: TaskRow[]
  classRows: ClassRow[]
}

type CalendarItem =
  | { kind: 'task'; id: string; title: string; timeLabel: string; completed: boolean }
  | { kind: 'class'; id: string; title: string; timeLabel: string; room: string }

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

export default function CalendarView({ taskRows, classRows }: CalendarViewProps): React.JSX.Element {
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
      const weekdayName = getWeekdayName(cellDate)
      const taskItems = taskRows
        .filter((taskRow) => taskRow.date === dateKey)
        .map<CalendarItem>((taskRow) => ({
          kind: 'task',
          id: taskRow.id,
          title: taskRow.title,
          timeLabel: taskRow.all_day ? 'All day' : [taskRow.start_time, taskRow.end_time].filter(Boolean).join(' - '),
          completed: taskRow.completed,
        }))
      const classItems = classRows
        .filter((classRow) => classRow.days.includes(weekdayName))
        .map<CalendarItem>((classRow) => ({
          kind: 'class',
          id: classRow.id,
          title: classRow.name,
          timeLabel: `${classRow.start_time} - ${classRow.end_time}`,
          room: classRow.room,
        }))

      return {
        dateKey,
        dayNumber: cellDate.getMonth() === currentMonth.getMonth() ? cellDate.getDate() : null,
        isToday: dateKey === toDateKey(new Date()),
        weekdayName,
        items: [...taskItems, ...classItems],
      }
    })

    return { monthStart, monthEnd, dayCells }
  }, [classRows, currentMonth, taskRows])

  useEffect(() => {
    const dialogElement = document.getElementById('calendar-detail-dialog') as HTMLDialogElement | null
    if (!dialogElement) return
    if (selectedDay && !dialogElement.open) dialogElement.showModal()
    if (!selectedDay && dialogElement.open) dialogElement.close()
  }, [selectedDay])

  const weekdayHeaders = DAYS_OF_WEEK.map((dayName) => dayName.slice(0, 3))

  function openDayDetails(dateKey: string, weekdayName: string, items: CalendarItem[]): void {
    setSelectedDay({ dateKey, weekdayName, items })
  }

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Calendar</p>
          <h2 className="mt-2 text-2xl font-semibold">{getMonthLabel(currentMonth)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous month" onClick={() => setCurrentMonth((monthValue) => addMonths(monthValue, -1))} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next month" onClick={() => setCurrentMonth((monthValue) => addMonths(monthValue, 1))} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
        {weekdayHeaders.map((weekdayLabel) => (
          <div key={weekdayLabel} className="px-3 py-2 text-center">
            {weekdayLabel}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {monthData.dayCells.map((dayCell) => (
          <button
            key={dayCell.dateKey}
            type="button"
            onClick={() => openDayDetails(dayCell.dateKey, dayCell.weekdayName, dayCell.items)}
            className="min-h-36 rounded-2xl border p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              borderColor: `${ACCENT_COLOR}33`,
              backgroundColor: dayCell.isToday ? ACCENT_COLOR : undefined,
              color: dayCell.isToday ? '#ffffff' : undefined,
              opacity: dayCell.dayNumber === null ? 0.45 : 1,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold">{dayCell.dateKey.slice(8, 10)}</span>
              {dayCell.items.length > 0 ? <span className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: dayCell.isToday ? 'rgba(255,255,255,0.15)' : `${ACCENT_COLOR}14` }}>{dayCell.items.length}</span> : null}
            </div>
            <div className="mt-3 space-y-2">
              {dayCell.items.slice(0, 3).map((calendarItem) => (
                <div key={`${dayCell.dateKey}-${calendarItem.kind}-${calendarItem.id}`} className="rounded-xl border px-2 py-1 text-xs" style={{ borderColor: dayCell.isToday ? 'rgba(255,255,255,0.25)' : `${ACCENT_COLOR}26` }}>
                  <div className="flex items-center gap-2">
                    {calendarItem.kind === 'task' ? <Clock3 className="h-3 w-3" aria-hidden="true" /> : <School className="h-3 w-3" aria-hidden="true" />}
                    <span className="truncate font-medium">{calendarItem.title}</span>
                  </div>
                  <p className="mt-1 truncate opacity-75">{calendarItem.kind === 'class' ? `${calendarItem.timeLabel} · ${calendarItem.room}` : calendarItem.timeLabel}</p>
                </div>
              ))}
              {dayCell.items.length > 3 ? <p className="text-[11px] opacity-75">+{dayCell.items.length - 3} more</p> : null}
            </div>
          </button>
        ))}
      </div>

      <dialog id="calendar-detail-dialog" className="w-full max-w-2xl rounded-3xl border bg-white p-0 text-black backdrop:bg-black/60 dark:bg-black dark:text-white" style={{ borderColor: ACCENT_COLOR }} onCancel={() => setSelectedDay(null)}>
        {selectedDay ? (
          <div className="space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedDay.dateKey}</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">{selectedDay.weekdayName}</p>
              </div>
              <button type="button" aria-label="Close calendar day details" onClick={() => setSelectedDay(null)} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedDay.items.length > 0 ? selectedDay.items.map((calendarItem) => (
                <article key={`${selectedDay.dateKey}-${calendarItem.kind}-${calendarItem.id}`} className="rounded-2xl border p-4" style={{ borderColor: `${ACCENT_COLOR}33` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{calendarItem.title}</p>
                      <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                        {calendarItem.kind === 'class' ? `${calendarItem.timeLabel} · ${calendarItem.room}` : calendarItem.timeLabel}
                      </p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${ACCENT_COLOR}14` }}>
                      {calendarItem.kind}
                    </span>
                  </div>
                  {calendarItem.kind === 'task' && calendarItem.completed ? <p className="mt-3 text-sm text-green-600">Completed</p> : null}
                </article>
              )) : (
                <p className="text-sm text-black/70 dark:text-white/70">No tasks or classes scheduled for this day.</p>
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  )
}
