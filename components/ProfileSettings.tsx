'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, ChevronRight, Loader2, X } from 'lucide-react'

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
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  school: z.string().optional(),
})

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((v) => v.newPassword === v.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const canvasSchema = z.object({
  domain: z.string().min(1, 'Canvas domain is required'),
  token: z.string().min(1, 'Access token is required'),
})

type EditProfileValues = z.infer<typeof editProfileSchema>
type ChangePasswordValues = z.infer<typeof changePasswordSchema>
type CanvasValues = z.infer<typeof canvasSchema>

const CANVAS_STEPS = [
  { step: 1, label: 'Log in to Canvas', detail: 'Open your school\'s Canvas site in your browser.' },
  { step: 2, label: 'Go to Account → Settings', detail: 'Click your profile picture (top-left) → Settings.' },
  { step: 3, label: 'Scroll to Approved Integrations', detail: 'Find the "Approved Integrations" section near the bottom of the page.' },
  { step: 4, label: 'Click "+ New Access Token"', detail: 'Enter a purpose like "Pomodoro App" and leave expiry blank for permanent access.' },
  { step: 5, label: 'Copy the token', detail: 'Canvas shows the token once — copy it now and paste it below.' },
]

const inputClass = 'w-full rounded-xl border border-primary bg-transparent px-4 py-2.5 text-sm'

export default function ProfileSettings({ initialProfile }: ProfileSettingsProps): React.JSX.Element {
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [canvasDomain, setCanvasDomain] = useState(initialProfile.canvas_domain)
  const [verifiedUser, setVerifiedUser] = useState<{ name: string; email: string } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const editRef = useRef<HTMLDialogElement>(null)
  const passwordRef = useRef<HTMLDialogElement>(null)
  const canvasRef = useRef<HTMLDialogElement>(null)

  const editForm = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: initialProfile.name,
      username: initialProfile.username,
      school: initialProfile.school ?? '',
    },
  })

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const canvasForm = useForm<CanvasValues>({
    resolver: zodResolver(canvasSchema),
    defaultValues: { domain: initialProfile.canvas_domain ?? '', token: '' },
  })

  function openCanvas(): void {
    setVerifiedUser(null)
    setVerifyError(null)
    canvasForm.reset({ domain: canvasDomain ?? '', token: '' })
    canvasRef.current?.showModal()
  }

  async function handleVerify(): Promise<void> {
    const values = canvasForm.getValues()
    if (!values.domain || !values.token) {
      canvasForm.trigger()
      return
    }
    setVerifying(true)
    setVerifyError(null)
    setVerifiedUser(null)
    try {
      const res = await fetch('/api/canvas/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: values.domain, token: values.token }),
      })
      const body = await res.json() as { name?: string; email?: string; error?: string }
      if (!res.ok) {
        setVerifyError(body.error ?? 'Verification failed.')
      } else {
        setVerifiedUser({ name: body.name ?? '', email: body.email ?? '' })
      }
    } catch {
      setVerifyError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleSaveCanvas(): Promise<void> {
    if (!verifiedUser) return
    const { domain, token } = canvasForm.getValues()
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasDomain: domain, canvasToken: token }),
      })
      if (res.ok) {
        setCanvasDomain(domain)
        canvasRef.current?.close()
      } else {
        const body = await res.json() as { error?: string }
        setVerifyError(body.error ?? 'Failed to save.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnectCanvas(): Promise<void> {
    await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasDomain: '', canvasToken: 'DISCONNECT' }),
    })
    setCanvasDomain(null)
    canvasRef.current?.close()
  }

  async function submitEditProfile(values: EditProfileValues): Promise<void> {
    setProfileMsg(null)
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const body = await res.json() as { error?: string }
    if (!res.ok) {
      setProfileMsg({ text: body.error ?? 'Failed to update profile', ok: false })
    } else {
      setProfileMsg({ text: 'Profile updated.', ok: true })
      editRef.current?.close()
    }
  }

  async function submitPasswordChange(values: ChangePasswordValues): Promise<void> {
    setPasswordMsg(null)
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const body = await res.json() as { error?: string }
    if (!res.ok) {
      setPasswordMsg({ text: body.error ?? 'Failed to change password', ok: false })
    } else {
      setPasswordMsg({ text: 'Password updated.', ok: true })
      passwordRef.current?.close()
      passwordForm.reset()
    }
  }

  return (
    <section className="rounded-3xl border border-primary p-6">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account, Canvas connection, and password.</p>

      {profileMsg && (
        <p className={`mt-3 text-sm ${profileMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {profileMsg.text}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => { setProfileMsg(null); editRef.current?.showModal() }}
          className="flex items-center justify-between rounded-2xl border border-primary/40 px-4 py-3 text-sm transition-colors hover:bg-primary/8"
        >
          Edit profile
          <ChevronRight className="h-4 w-4 opacity-40" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={openCanvas}
          className="flex items-center justify-between rounded-2xl border border-primary/40 px-4 py-3 text-sm transition-colors hover:bg-primary/8"
        >
          <span className="flex items-center gap-2">
            {canvasDomain
              ? <><CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" /> Canvas connected</>
              : 'Connect Canvas'}
          </span>
          <ChevronRight className="h-4 w-4 opacity-40" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => { setPasswordMsg(null); passwordRef.current?.showModal() }}
          className="flex items-center justify-between rounded-2xl border border-primary/40 px-4 py-3 text-sm transition-colors hover:bg-primary/8"
        >
          Change password
          <ChevronRight className="h-4 w-4 opacity-40" aria-hidden="true" />
        </button>
      </div>

      {canvasDomain && (
        <p className="mt-3 text-xs text-muted-foreground">
          Connected to <span className="font-medium">{canvasDomain}</span>
        </p>
      )}

      {/* ── Edit profile dialog ── */}
      <dialog
        ref={editRef}
        className="fixed inset-0 m-auto h-fit w-full max-w-lg rounded-3xl border border-primary bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
        onCancel={() => editRef.current?.close()}
      >
        <form onSubmit={editForm.handleSubmit(submitEditProfile)} className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Edit profile</h3>
              <p className="mt-1 text-sm text-muted-foreground">Update your name, username, and school.</p>
            </div>
            <button
              type="button"
              onClick={() => editRef.current?.close()}
              className="rounded-full border border-primary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Full name</span>
              <input {...editForm.register('fullName')} className={inputClass} />
              {editForm.formState.errors.fullName && (
                <p className="text-xs text-destructive">{editForm.formState.errors.fullName.message}</p>
              )}
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Username</span>
              <input {...editForm.register('username')} className={inputClass} />
              {editForm.formState.errors.username && (
                <p className="text-xs text-destructive">{editForm.formState.errors.username.message}</p>
              )}
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">School</span>
              <input {...editForm.register('school')} className={inputClass} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => editRef.current?.close()}
              className="rounded-full border border-primary/60 px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editForm.formState.isSubmitting}
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {editForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </dialog>

      {/* ── Canvas connection dialog ── */}
      <dialog
        ref={canvasRef}
        className="fixed inset-0 m-auto h-fit w-full max-w-xl rounded-3xl border border-primary bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
        onCancel={() => canvasRef.current?.close()}
      >
        <div className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Connect Canvas</h3>
              <p className="mt-1 text-sm text-muted-foreground">Use a personal access token to link your Canvas account.</p>
            </div>
            <button
              type="button"
              onClick={() => canvasRef.current?.close()}
              className="rounded-full border border-primary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="rounded-2xl border border-primary/25 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How to get your token</p>
            {CANVAS_STEPS.map(({ step, label, detail }) => (
              <div key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void handleVerify() }} className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Canvas domain</span>
              <input
                {...canvasForm.register('domain')}
                placeholder="myschool.instructure.com"
                className={inputClass}
              />
              {canvasForm.formState.errors.domain && (
                <p className="text-xs text-destructive">{canvasForm.formState.errors.domain.message}</p>
              )}
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Personal access token</span>
              <input
                {...canvasForm.register('token')}
                type="password"
                placeholder="Paste token here"
                className={inputClass}
              />
              {canvasForm.formState.errors.token && (
                <p className="text-xs text-destructive">{canvasForm.formState.errors.token.message}</p>
              )}
            </label>

            {verifyError && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-2.5 text-sm text-destructive">
                {verifyError}
              </p>
            )}

            {verifiedUser && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/8 px-4 py-2.5 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                <span>Verified as <strong>{verifiedUser.name}</strong></span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {canvasDomain && (
                <button
                  type="button"
                  onClick={() => void handleDisconnectCanvas()}
                  className="text-sm text-destructive hover:underline"
                >
                  Disconnect Canvas
                </button>
              )}
              <div className="ml-auto flex gap-3">
                {!verifiedUser ? (
                  <button
                    type="submit"
                    disabled={verifying}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    {verifying ? 'Verifying…' : 'Verify token'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSaveCanvas()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    {saving ? 'Saving…' : 'Save & connect'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </dialog>

      {/* ── Change password dialog ── */}
      <dialog
        ref={passwordRef}
        className="fixed inset-0 m-auto h-fit w-full max-w-lg rounded-3xl border border-primary bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
        onCancel={() => passwordRef.current?.close()}
      >
        <form onSubmit={passwordForm.handleSubmit(submitPasswordChange)} className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Change password</h3>
              <p className="mt-1 text-sm text-muted-foreground">Confirm your current password before setting a new one.</p>
            </div>
            <button
              type="button"
              onClick={() => passwordRef.current?.close()}
              className="rounded-full border border-primary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {passwordMsg.text}
            </p>
          )}
          {(['oldPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
            <label key={field} className="block space-y-1.5">
              <span className="text-sm font-medium">
                {field === 'oldPassword' ? 'Current password' : field === 'newPassword' ? 'New password' : 'Confirm new password'}
              </span>
              <input {...passwordForm.register(field)} type="password" className={inputClass} />
              {passwordForm.formState.errors[field] && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors[field]?.message}</p>
              )}
            </label>
          ))}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => passwordRef.current?.close()}
              className="rounded-full border border-primary/60 px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {passwordForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  )
}
