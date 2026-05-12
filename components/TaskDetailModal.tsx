'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import type { TaskRow, UpdateTaskPayload } from '@/types'

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  all_day: z.boolean(),
  completed: z.boolean(),
})

type EditTaskValues = z.infer<typeof editTaskSchema>

interface TaskDetailModalProps {
  taskItem: TaskRow | null
  onClose: () => void
  onUpdate: (id: string, payload: UpdateTaskPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TaskDetailModal({ taskItem, onClose, onUpdate, onDelete }: TaskDetailModalProps): React.JSX.Element | null {
  const form = useForm<EditTaskValues>({
    resolver: zodResolver(editTaskSchema),
  })

  useEffect(() => {
    if (taskItem) {
      form.reset({
        title: taskItem.title,
        date: taskItem.date,
        start_time: taskItem.start_time ?? '',
        end_time: taskItem.end_time ?? '',
        all_day: taskItem.all_day,
        completed: taskItem.completed,
      })
    }
  }, [form, taskItem])

  useEffect(() => {
    const dialog = document.getElementById('task-detail-dialog') as HTMLDialogElement | null
    if (!dialog) return
    if (taskItem && !dialog.open) dialog.showModal()
    if (!taskItem && dialog.open) dialog.close()
  }, [taskItem])

  if (!taskItem) {
    return null
  }

  const taskId = taskItem.id

  async function onSubmit(values: EditTaskValues): Promise<void> {
    await onUpdate(taskId, values)
    onClose()
  }

  return (
    <dialog
      id="task-detail-dialog"
      className="fixed inset-0 m-auto h-fit w-full max-w-xl rounded-3xl border border-primary bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
      onCancel={onClose}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Task details</h3>
            <p className="mt-1 text-sm text-muted-foreground">Edit, complete, or delete this task.</p>
          </div>
          <button
            type="button"
            aria-label="Close task details dialog"
            onClick={onClose}
            className="rounded-full border border-primary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Title</span>
          <input
            {...form.register('title')}
            aria-label="Task title"
            className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Date</span>
            <input
              {...form.register('date')}
              type="date"
              aria-label="Task date"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-primary/20 px-4 py-3">
            <input {...form.register('completed')} type="checkbox" aria-label="Completed" className="accent-primary" />
            <span className="text-sm font-medium">Completed</span>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Start time</span>
            <input
              {...form.register('start_time')}
              type="time"
              aria-label="Start time"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">End time</span>
            <input
              {...form.register('end_time')}
              type="time"
              aria-label="End time"
              className="w-full rounded-2xl border border-primary bg-transparent px-4 py-3"
            />
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-primary/20 px-4 py-3 md:col-span-2">
            <input {...form.register('all_day')} type="checkbox" aria-label="All day" className="accent-primary" />
            <span className="text-sm font-medium">All day</span>
          </label>
        </div>

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => void onDelete(taskId)}
            className="rounded-full border border-destructive/30 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete task
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
