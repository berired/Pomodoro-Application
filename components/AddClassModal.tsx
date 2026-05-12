'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { DAYS_OF_WEEK, ACCENT_COLOR } from '@/lib/constants'
import type { CreateClassPayload } from '@/types'

const addClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  days: z.array(z.string()).min(1, 'Select at least one day'),
  room: z.string().min(1, 'Room is required'),
  professor: z.string().optional(),
})

type AddClassValues = z.infer<typeof addClassSchema>

interface AddClassModalProps {
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateClassPayload) => Promise<void>
}

export default function AddClassModal({ open, onClose, onCreate }: AddClassModalProps): React.JSX.Element {
  const form = useForm<AddClassValues>({
    resolver: zodResolver(addClassSchema),
    defaultValues: {
      name: '',
      start_time: '09:00',
      end_time: '09:50',
      days: ['Monday'],
      room: '',
      professor: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        start_time: '09:00',
        end_time: '09:50',
        days: ['Monday'],
        room: '',
        professor: '',
      })
    }
  }, [form, open])

  useEffect(() => {
    const dialog = document.getElementById('add-class-dialog') as HTMLDialogElement | null
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function onSubmit(values: AddClassValues): Promise<void> {
    await onCreate({
      ...values,
      professor: values.professor?.trim() ? values.professor : null,
    })
    onClose()
  }

  return (
    <dialog id="add-class-dialog" className="w-full max-w-2xl rounded-3xl border bg-white p-0 text-black backdrop:bg-black/60 dark:bg-black dark:text-white" style={{ borderColor: ACCENT_COLOR }} onCancel={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Add class</h3>
            <p className="mt-1 text-sm text-black/70 dark:text-white/70">Schedule a recurring class block.</p>
          </div>
          <button type="button" aria-label="Close add class dialog" onClick={onClose} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Class name</span>
            <input {...form.register('name')} aria-label="Class name" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {form.formState.errors.name && <p role="alert" className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Start time</span>
            <input {...form.register('start_time')} type="time" aria-label="Start time" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {form.formState.errors.start_time && <p role="alert" className="text-sm text-red-500">{form.formState.errors.start_time.message}</p>}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">End time</span>
            <input {...form.register('end_time')} type="time" aria-label="End time" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {form.formState.errors.end_time && <p role="alert" className="text-sm text-red-500">{form.formState.errors.end_time.message}</p>}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Room</span>
            <input {...form.register('room')} aria-label="Room" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {form.formState.errors.room && <p role="alert" className="text-sm text-red-500">{form.formState.errors.room.message}</p>}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Professor</span>
            <input {...form.register('professor')} aria-label="Professor" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Days</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {DAYS_OF_WEEK.map((day) => {
              const selectedDays = form.watch('days') ?? []
              const isSelected = selectedDays.includes(day)
              return (
                <label key={day} className="flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: isSelected ? ACCENT_COLOR : `${ACCENT_COLOR}33` }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) => {
                      const currentDays = form.getValues('days') ?? []
                      const nextDays = event.target.checked ? [...currentDays, day] : currentDays.filter((currentDay) => currentDay !== day)
                      form.setValue('days', nextDays, { shouldValidate: true })
                    }}
                    aria-label={day}
                  />
                  {day.slice(0, 3)}
                </label>
              )
            })}
          </div>
          {form.formState.errors.days && <p role="alert" className="text-sm text-red-500">{form.formState.errors.days.message}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
            Cancel
          </button>
          <button type="submit" disabled={form.formState.isSubmitting} className="rounded-full px-4 py-2 text-sm text-white disabled:opacity-60" style={{ backgroundColor: ACCENT_COLOR }}>
            Save class
          </button>
        </div>
      </form>
    </dialog>
  )
}
