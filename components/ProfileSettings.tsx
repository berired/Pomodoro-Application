'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { ACCENT_COLOR } from '@/lib/constants'

interface ProfileSettingsProps {
  initialProfile: {
    name: string
    username: string
    email: string
    school: string | null
    canvas_domain: string | null
    created_at: string
  }
}

const editProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  school: z.string().optional(),
  canvasToken: z.string().optional(),
  canvasDomain: z.string().optional(),
})

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type EditProfileValues = z.infer<typeof editProfileSchema>
type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export default function ProfileSettings({ initialProfile }: ProfileSettingsProps): React.JSX.Element {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const editDialogRef = useRef<HTMLDialogElement>(null)
  const passwordDialogRef = useRef<HTMLDialogElement>(null)

  const editForm = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: initialProfile.name,
      username: initialProfile.username,
      school: initialProfile.school ?? '',
      canvasToken: '',
      canvasDomain: initialProfile.canvas_domain ?? '',
    },
  })

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  function openEditDialog(): void {
    setStatusMessage(null)
    editDialogRef.current?.showModal()
  }

  function openPasswordDialog(): void {
    setStatusMessage(null)
    passwordDialogRef.current?.showModal()
  }

  async function submitEditProfile(values: EditProfileValues): Promise<void> {
    setStatusMessage(null)
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const responseBody = await response.json() as { error?: string }
    if (!response.ok) {
      setStatusMessage(responseBody.error ?? 'Failed to update profile')
      return
    }

    setStatusMessage('Profile updated successfully')
    editDialogRef.current?.close()
  }

  async function submitPasswordChange(values: ChangePasswordValues): Promise<void> {
    setStatusMessage(null)
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const responseBody = await response.json() as { error?: string }
    if (!response.ok) {
      setStatusMessage(responseBody.error ?? 'Failed to change password')
      return
    }

    setStatusMessage('Password updated successfully')
    passwordDialogRef.current?.close()
    passwordForm.reset()
  }

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Profile settings</h2>
          <p className="mt-1 text-sm text-black/70 dark:text-white/70">Update your school info, username, Canvas token, and password.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={openEditDialog} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
            Edit profile
          </button>
          <button type="button" onClick={openPasswordDialog} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
            Change password
          </button>
        </div>
      </div>

      {statusMessage && <p className="mt-4 text-sm text-black/70 dark:text-white/70">{statusMessage}</p>}

      <dialog ref={editDialogRef} className="w-full max-w-2xl rounded-3xl border bg-white p-0 text-black backdrop:bg-black/60 dark:bg-black dark:text-white" style={{ borderColor: ACCENT_COLOR }}>
        <form onSubmit={editForm.handleSubmit(submitEditProfile)} className="space-y-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Edit profile</h3>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">Your Canvas token is encrypted before being saved.</p>
            </div>
            <button type="button" aria-label="Close edit profile dialog" onClick={() => editDialogRef.current?.close()} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Full name</span>
              <input {...editForm.register('fullName')} aria-label="Full name" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
              {editForm.formState.errors.fullName && <p role="alert" className="text-sm text-red-500">{editForm.formState.errors.fullName.message}</p>}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Username</span>
              <input {...editForm.register('username')} aria-label="Username" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
              {editForm.formState.errors.username && <p role="alert" className="text-sm text-red-500">{editForm.formState.errors.username.message}</p>}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">School</span>
              <input {...editForm.register('school')} aria-label="School" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Canvas domain</span>
              <input {...editForm.register('canvasDomain')} aria-label="Canvas domain" placeholder="school.instructure.com" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Canvas token</span>
              <input {...editForm.register('canvasToken')} aria-label="Canvas token" type="password" placeholder="Paste a personal access token" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => editDialogRef.current?.close()} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
              Cancel
            </button>
            <button type="submit" disabled={editForm.formState.isSubmitting} className="rounded-full px-4 py-2 text-sm text-white disabled:opacity-60" style={{ backgroundColor: ACCENT_COLOR }}>
              Save changes
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={passwordDialogRef} className="w-full max-w-xl rounded-3xl border bg-white p-0 text-black backdrop:bg-black/60 dark:bg-black dark:text-white" style={{ borderColor: ACCENT_COLOR }}>
        <form onSubmit={passwordForm.handleSubmit(submitPasswordChange)} className="space-y-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Change password</h3>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">Confirm your current password before setting a new one.</p>
            </div>
            <button type="button" aria-label="Close password dialog" onClick={() => passwordDialogRef.current?.close()} className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Current password</span>
            <input {...passwordForm.register('oldPassword')} type="password" aria-label="Current password" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {passwordForm.formState.errors.oldPassword && <p role="alert" className="text-sm text-red-500">{passwordForm.formState.errors.oldPassword.message}</p>}
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">New password</span>
            <input {...passwordForm.register('newPassword')} type="password" aria-label="New password" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {passwordForm.formState.errors.newPassword && <p role="alert" className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>}
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Confirm new password</span>
            <input {...passwordForm.register('confirmPassword')} type="password" aria-label="Confirm new password" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
            {passwordForm.formState.errors.confirmPassword && <p role="alert" className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>}
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => passwordDialogRef.current?.close()} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
              Cancel
            </button>
            <button type="submit" disabled={passwordForm.formState.isSubmitting} className="rounded-full px-4 py-2 text-sm text-white disabled:opacity-60" style={{ backgroundColor: ACCENT_COLOR }}>
              Update password
            </button>
          </div>
        </form>
      </dialog>
    </section>
  )
}