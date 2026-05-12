'use client'

import { Fragment, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { DAYS_OF_WEEK } from '@/lib/constants'
import { useClasses } from '@/hooks/useClasses'
import type { ClassRow, CreateClassPayload, UpdateClassPayload } from '@/types'
import AddClassModal from '@/components/AddClassModal'
import ClassDetailModal from '@/components/ClassDetailModal'

const START_MINUTES = 7 * 60
const END_MINUTES = 24 * 60
const SLOT_HEIGHT = 28

function toMinutes(timeValue: string): number {
  const [hours, minutes] = timeValue.split(':').map(Number)
  return (hours * 60) + minutes
}

export default function ClassScheduleGrid(): React.JSX.Element {
  const { classes, isLoading, error, addClass, updateClass, deleteClass } = useClasses()
  const [selectedClass, setSelectedClass] = useState<ClassRow | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const gridRows = useMemo(() => {
    const rows: string[] = []
    for (let time = START_MINUTES; time <= END_MINUTES; time += 30) {
      const hours = Math.floor(time / 60)
      const minutes = time % 60
      rows.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    }
    return rows
  }, [])

  async function handleCreateClass(payload: CreateClassPayload): Promise<void> {
    await addClass(payload)
  }

  async function handleUpdateClass(id: string, payload: UpdateClassPayload): Promise<void> {
    await updateClass(id, payload)
  }

  async function handleDeleteClass(id: string): Promise<void> {
    await deleteClass(id)
    setSelectedClass(null)
  }

  return (
    <section className="rounded-3xl border border-primary p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Academics</p>
          <h2 className="mt-2 text-2xl font-semibold">Class schedule</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add class
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-primary/20">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading class schedule…</div>
        ) : null}
        {error ? (
          <div className="p-6 text-sm text-destructive">{error}</div>
        ) : null}

        {!isLoading && !error && classes.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No classes yet. Add one to start building your schedule.
          </div>
        ) : null}

        {!isLoading && !error ? (
          <>
            {/* Sticky day-header row */}
            <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-primary/15">
              <div className="border-r border-primary/15 px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Time
              </div>
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="border-r border-primary/15 px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground last:border-r-0"
                >
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Scrollable time rows */}
            <div className="max-h-105 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))]">
                {gridRows.map((timeLabel) => (
                  <Fragment key={timeLabel}>
                    <div
                      className="flex items-start border-b border-r border-primary/10 px-2 pt-1 text-[10px] leading-none text-muted-foreground"
                      style={{ minHeight: SLOT_HEIGHT }}
                    >
                      {timeLabel}
                    </div>
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={`${day}-${timeLabel}`}
                        className="relative border-b border-r border-primary/8 last:border-r-0"
                        style={{ minHeight: SLOT_HEIGHT }}
                      >
                        {classes
                          .filter((classItem) => classItem.days.includes(day) && toMinutes(classItem.start_time) === toMinutes(timeLabel))
                          .map((classItem) => {
                            const height = Math.max(SLOT_HEIGHT, ((toMinutes(classItem.end_time) - toMinutes(classItem.start_time)) / 30) * SLOT_HEIGHT)
                            return (
                              <button
                                key={classItem.id}
                                type="button"
                                onClick={() => setSelectedClass(classItem)}
                                className="absolute inset-x-0.5 top-0 z-10 overflow-hidden rounded-lg bg-primary px-1.5 py-1 text-left text-[10px] text-primary-foreground shadow-sm transition-opacity hover:opacity-85"
                                style={{ height }}
                              >
                                <p className="truncate font-semibold leading-tight">{classItem.name}</p>
                                <p className="truncate opacity-75">{classItem.start_time}–{classItem.end_time}</p>
                                <p className="truncate opacity-60">{classItem.room}</p>
                              </button>
                            )
                          })}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <AddClassModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onCreate={handleCreateClass} />
      <ClassDetailModal classItem={selectedClass} onClose={() => setSelectedClass(null)} onUpdate={handleUpdateClass} onDelete={handleDeleteClass} />
    </section>
  )
}
