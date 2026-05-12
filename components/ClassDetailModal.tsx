'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import type { ClassRow, UpdateClassPayload } from '@/types'
import { DAYS_OF_WEEK } from '@/lib/constants'

const editClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  days: z.array(z.string()).min(1, 'Select at least one day'),
  room: z.string().min(1, 'Room is required'),
  professor: z.string().optional(),
})

type EditClassValues = z.infer<typeof editClassSchema>

interface ClassDetailModalProps {
  classItem: ClassRow | null
  onClose: () => void
  onUpdate: (id: string, payload: UpdateClassPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function ClassDetailModal({ classItem, onClose, onUpdate, onDelete }: ClassDetailModalProps): React.JSX.Element | null {
  const form = useForm<EditClassValues>({
    resolver: zodResolver(editClassSchema),
  })

  useEffect(() => {
    if (classItem) {
      form.reset({
        name: classItem.name,
        start_time: classItem.start_time,
        end_time: classItem.end_time,
        days: classItem.days,
        room: classItem.room,
        professor: classItem.professor ?? '',
      })
    }
  }, [classItem, form])

  useEffect(() => {
    const dialog = document.getElementById('class-detail-dialog') as HTMLDialogElement | null
    if (!dialog) return
    if (classItem && !dialog.open) dialog.showModal()
    if (!classItem && dialog.open) dialog.close()
  }, [classItem])

  if (!classItem) {
    return null
  }

  const classId = classItem.id

  async function onSubmit(values: EditClassValues): Promise<void> {
    await onUpdate(classId, {
      ...values,
      professor: values.professor?.trim() ? values.professor : null,
    })
    onClose()
  }

  return (
    <dialog
      id="class-detail-dialog"
      className="fixed inset-0 m-auto h-fit w-full max-w-2xl rounded-3xl border border-primary bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
      onCancel={onClose}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Class details</h3>
            <p className="mt-1 text-sm text-muted-foreground">Edit or remove this class block.</p>
          </div>
          <button
            type="button"
            aria-label="Close class details dialog"
            onClick={onClose}
            className="rounded-full border border-primary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Class name</span>
            <input
              {...form.register('name')}
              aria-label="Class name"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Start time</span>
            <input
              {...form.register('start_time')}
              type="time"
              aria-label="Start time"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">End time</span>
            <input
              {...form.register('end_time')}
              type="time"
              aria-label="End time"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Room</span>
            <input
              {...form.register('room')}
              aria-label="Room"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Professor</span>
            <input
              {...form.register('professor')}
              aria-label="Professor"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Days</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {DAYS_OF_WEEK.map((day) => {
              const selectedDays = form.watch('days') ?? []
              const isSelected = selectedDays.includes(day)
              return (
                <label
                  key={day}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-colors ${
                    isSelected ? 'border-primary bg-primary/8' : 'border-primary/20 hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) => {
                      const currentDays = form.getValues('days') ?? []
                      const nextDays = event.target.checked ? [...currentDays, day] : currentDays.filter((currentDay) => currentDay !== day)
                      form.setValue('days', nextDays, { shouldValidate: true })
                    }}
                    aria-label={day}
                    className="accent-primary"
                  />
                  {day.slice(0, 3)}
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => void onDelete(classId)}
            className="rounded-full border border-destructive/30 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete class
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-primary/60 px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Save changes
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
