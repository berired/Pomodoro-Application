'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { ACCENT_COLOR } from '@/lib/constants'
import type { CreateTaskPayload } from '@/types'

const addTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  all_day: z.boolean(),
})

type AddTaskValues = z.infer<typeof addTaskSchema>

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateTaskPayload) => Promise<void>
}

export default function AddTaskModal({ open, onClose, onCreate }: AddTaskModalProps): React.JSX.Element {
  const form = useForm<AddTaskValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: '',
      date: new Date().toISOString().slice(0, 10),
      start_time: '',
      end_time: '',
      all_day: false,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: '',
        date: new Date().toISOString().slice(0, 10),
        start_time: '',
        end_time: '',
        all_day: false,
      })
    }
  }, [form, open])

  useEffect(() => {
    const dialog = document.getElementById('add-task-dialog') as HTMLDialogElement | null
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function onSubmit(values: AddTaskValues): Promise<void> {
    await onCreate({
      ...values,
      start_time: values.start_time?.trim() ? values.start_time : null,
      end_time: values.end_time?.trim() ? values.end_time : null,
    })
    onClose()
  }

  return (
    <dialog id="add-task-dialog" className="fixed inset-0 m-auto h-fit w-full max-w-xl rounded-3xl border bg-white p-0 text-black shadow-2xl backdrop:bg-black/60 dark:bg-black dark:text-white" style={{ borderColor: ACCENT_COLOR }} onCancel={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Add task</h3>
            <p className="mt-1 text-sm text-black/70 dark:text-white/70">Create a personal task or assignment reminder.</p>
          </div>
          <button type="button" aria-label="Close add task dialog" onClick={onClose} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Title</span>
          <input {...form.register('title')} aria-label="Task title" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
          {form.formState.errors.title && <p role="alert" className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Date</span>
            <input {...form.register('date')} type="date" aria-label="Task date" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {form.formState.errors.date && <p role="alert" className="text-sm text-red-500">{form.formState.errors.date.message}</p>}
          </label>
          <label className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: `${ACCENT_COLOR}33` }}>
            <input {...form.register('all_day')} type="checkbox" aria-label="All day task" />
            <span className="text-sm font-medium">All day</span>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Start time</span>
            <input {...form.register('start_time')} type="time" aria-label="Start time" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">End time</span>
            <input {...form.register('end_time')} type="time" aria-label="End time" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
            Cancel
          </button>
          <button type="submit" disabled={form.formState.isSubmitting} className="rounded-full px-4 py-2 text-sm text-white disabled:opacity-60" style={{ backgroundColor: ACCENT_COLOR }}>
            Save task
          </button>
        </div>
      </form>
    </dialog>
  )
}
