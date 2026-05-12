'use client'

import { Fragment, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { ACCENT_COLOR, DAYS_OF_WEEK } from '@/lib/constants'
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
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Academics</p>
          <h2 className="mt-2 text-2xl font-semibold">Class schedule</h2>
        </div>
        <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white" style={{ backgroundColor: ACCENT_COLOR }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add class
        </button>
      </div>

      <div className="mt-6 overflow-auto rounded-3xl border" style={{ borderColor: `${ACCENT_COLOR}33` }}>
        {isLoading ? <div className="p-6 text-sm text-black/70 dark:text-white/70">Loading class schedule…</div> : null}
        {error ? <div className="p-6 text-sm text-red-500">{error}</div> : null}

        {!isLoading && !error && classes.length === 0 ? (
          <div className="p-6 text-sm text-black/70 dark:text-white/70">No classes yet. Add one to start building your schedule.</div>
        ) : null}

        {!isLoading && !error && classes.length > 0 ? (
        <div className="grid min-w-[900px] grid-cols-[72px_repeat(7,minmax(0,1fr))]">
          <div className="border-b border-r px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60" style={{ borderColor: `${ACCENT_COLOR}33` }}>
            Time
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60" style={{ borderColor: `${ACCENT_COLOR}33` }}>
              {day.slice(0, 3)}
            </div>
          ))}
          {gridRows.map((timeLabel) => (
            <Fragment key={timeLabel}>
              <div key={`${timeLabel}-label`} className="border-r px-3 py-1 text-xs text-black/60 dark:text-white/60" style={{ borderColor: `${ACCENT_COLOR}33`, minHeight: SLOT_HEIGHT }}>
                {timeLabel}
              </div>
              {DAYS_OF_WEEK.map((day) => (
                <div key={`${day}-${timeLabel}`} className="relative border-b border-r px-2 py-1" style={{ borderColor: `${ACCENT_COLOR}14`, minHeight: SLOT_HEIGHT }}>
                  {classes
                    .filter((classItem) => classItem.days.includes(day) && toMinutes(classItem.start_time) >= toMinutes(timeLabel))
                    .slice(0, 1)
                    .map((classItem) => {
                      const startMinutes = toMinutes(classItem.start_time)
                      const endMinutes = toMinutes(classItem.end_time)
                      const topOffset = ((startMinutes - START_MINUTES) / 30) * SLOT_HEIGHT
                      const height = Math.max(1, ((endMinutes - startMinutes) / 30) * SLOT_HEIGHT)

                      return (
                        <button
                          key={classItem.id}
                          type="button"
                          onClick={() => setSelectedClass(classItem)}
                          className="absolute left-1 right-1 z-10 rounded-2xl px-3 py-2 text-left text-xs text-white shadow-lg"
                          style={{ top: topOffset, height, backgroundColor: 'rgba(58, 10, 78, 0.85)' }}
                        >
                          <p className="font-semibold">{classItem.name}</p>
                          <p className="mt-1 opacity-90">{classItem.room}</p>
                        </button>
                      )
                    })}
                </div>
              ))}
              </Fragment>
          ))}
        </div>
        ) : null}
      </div>

      <AddClassModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onCreate={handleCreateClass} />
      <ClassDetailModal classItem={selectedClass} onClose={() => setSelectedClass(null)} onUpdate={handleUpdateClass} onDelete={handleDeleteClass} />
    </section>
  )
}
