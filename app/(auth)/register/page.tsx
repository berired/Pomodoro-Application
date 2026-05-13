'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PASSWORD_REGEX } from '@/lib/constants'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  school: z.string().min(1, 'School is required'),
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  password: z.string().regex(PASSWORD_REGEX, 'Password must include an uppercase letter and a number'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterValues = z.infer<typeof registerSchema>
type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function getPasswordStrength(passwordValue: string): number {
  let score = 0
  if (passwordValue.length >= 8) score += 1
  if (/[A-Z]/.test(passwordValue)) score += 1
  if (/\d/.test(passwordValue)) score += 1
  if (/[^A-Za-z0-9]/.test(passwordValue)) score += 1
  return score
}

const STRENGTH_LABELS = ['', 'WEAK', 'FAIR', 'STRONG', 'SECURE']
const STRENGTH_BAR = ['', '██░░░░░░', '████░░░░', '██████░░', '████████']
const STRENGTH_COLORS = ['', 'text-destructive', 'text-yellow-400', 'text-primary', 'text-primary']

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailState, setEmailState] = useState<AvailabilityState>('idle')
  const [usernameState, setUsernameState] = useState<AvailabilityState>('idle')
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { fullName: '', school: '', email: '', username: '', password: '', confirmPassword: '' },
  })

  const emailValue = watch('email')
  const usernameValue = watch('username')
  const passwordValue = watch('password')
  const passwordStrength = useMemo(() => getPasswordStrength(passwordValue ?? ''), [passwordValue])

  useEffect(() => {
    if (step !== 2) return
    const emailValueTrimmed = emailValue?.trim() ?? ''
    if (!emailValueTrimmed) { setEmailState('idle'); setEmailMessage(null); return }
    const timer = window.setTimeout(() => {
      const validateEmail = async (): Promise<void> => {
        const localCheck = z.string().email().safeParse(emailValueTrimmed)
        if (!localCheck.success) { setEmailState('invalid'); setEmailMessage('Enter a valid email address'); return }
        setEmailState('checking')
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailValueTrimmed)}`)
        if (!response.ok) { setEmailState('invalid'); setEmailMessage('Unable to verify email right now'); return }
        const payload = await response.json() as { exists?: boolean }
        if (payload.exists) { setEmailState('taken'); setEmailMessage('Email is already in use'); return }
        setEmailState('available'); setEmailMessage('Email is available')
      }
      void validateEmail()
    }, 400)
    return () => window.clearTimeout(timer)
  }, [emailValue, step])

  useEffect(() => {
    if (step !== 2) return
    const usernameValueTrimmed = usernameValue?.trim() ?? ''
    if (!usernameValueTrimmed) { setUsernameState('idle'); setUsernameMessage(null); return }
    const timer = window.setTimeout(() => {
      const validateUsername = async (): Promise<void> => {
        const localCheck = z.string().min(3).regex(/^[a-zA-Z0-9_]+$/).safeParse(usernameValueTrimmed)
        if (!localCheck.success) { setUsernameState('invalid'); setUsernameMessage('Use at least 3 chars: letters, numbers, underscores'); return }
        setUsernameState('checking')
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(usernameValueTrimmed)}`)
        if (!response.ok) { setUsernameState('invalid'); setUsernameMessage('Unable to verify username right now'); return }
        const payload = await response.json() as { exists?: boolean }
        if (payload.exists) { setUsernameState('taken'); setUsernameMessage('Username is already in use'); return }
        setUsernameState('available'); setUsernameMessage('Username is available')
      }
      void validateUsername()
    }, 400)
    return () => window.clearTimeout(timer)
  }, [step, usernameValue])

  async function goNext(): Promise<void> {
    setServerError(null)
    if (step === 1) {
      const valid = await trigger(['fullName', 'school'])
      if (valid) setStep(2)
      return
    }
    if (step === 2) {
      const valid = await trigger(['email', 'username'])
      if (!valid) return
      if (emailState !== 'available' || usernameState !== 'available') {
        setServerError('Please use available email and username values before continuing.')
        return
      }
      setStep(3)
    }
  }

  function goBack(): void {
    setServerError(null)
    setStep((s) => Math.max(1, s - 1))
  }

  async function onSubmit(values: RegisterValues): Promise<void> {
    setServerError(null)
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!response.ok) {
      const body = await response.json() as { error?: string }
      setServerError(body.error ?? 'Registration failed')
      return
    }
    router.push('/login')
  }

  const stepLabels = ['PROFILE', 'ACCOUNT', 'PASSWORD']

  function getFieldStatus(state: AvailabilityState, message: string | null) {
    if (!message) return null
    const prefix = state === 'available' ? '[OK]' : state === 'checking' ? '[...]' : '[ERR]'
    const colorClass = state === 'available' ? 'text-primary' : state === 'checking' ? 'text-muted-foreground' : 'text-destructive'
    return <p className={`mt-1 text-xs ${colorClass}`}>{prefix} {message}</p>
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
      <div className="w-full term-window" style={{ animation: 'boot-on 0.5s ease-out both' }}>

        {/* Title bar */}
        <div className="term-titlebar">
          <div className="term-titlebar-dots">
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </div>
          <span>REGISTER.EXE</span>
          <span className="ml-auto">STEP {step}/3</span>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary" style={{ textShadow: 'var(--phosphor-glow)' }}>C:\STUDY&gt; </span>
              register --new-user
            </p>
            <h1 className="mt-2 text-3xl" style={{ textShadow: 'var(--phosphor-glow-strong)' }}>
              CREATE ACCOUNT
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Three-step setup process. All fields required.
            </p>
          </div>

          {/* Step indicators */}
          <div className="mb-6 flex items-center gap-1 text-xs">
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1
              const isActive = stepNum === step
              const isDone = stepNum < step
              return (
                <div key={label} className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 text-[10px] tracking-wider ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                        ? 'border border-primary text-primary'
                        : 'border border-border text-muted-foreground'
                  }`}>
                    {isDone ? '✓' : stepNum} {label}
                  </span>
                  {idx < stepLabels.length - 1 && (
                    <span className={`text-[10px] ${isDone ? 'text-primary' : 'text-border'}`}>──</span>
                  )}
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {step === 1 && (
              <div className="space-y-4">
                <label className="term-label block">
                  <span className="term-label-text">FULL NAME</span>
                  <input
                    {...register('fullName')}
                    aria-label="Full name"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className="term-input mt-1"
                  />
                  {errors.fullName && (
                    <p role="alert" className="mt-1 text-xs text-destructive">[ERR] {errors.fullName.message}</p>
                  )}
                </label>
                <label className="term-label block">
                  <span className="term-label-text">SCHOOL / INSTITUTION</span>
                  <input
                    {...register('school')}
                    aria-label="School"
                    placeholder="Enter your school name"
                    className="term-input mt-1"
                  />
                  {errors.school && (
                    <p role="alert" className="mt-1 text-xs text-destructive">[ERR] {errors.school.message}</p>
                  )}
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <label className="term-label block">
                  <span className="term-label-text">EMAIL ADDRESS</span>
                  <input
                    {...register('email')}
                    aria-label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="term-input mt-1"
                  />
                  {errors.email && (
                    <p role="alert" className="mt-1 text-xs text-destructive">[ERR] {errors.email.message}</p>
                  )}
                  {getFieldStatus(emailState, emailMessage)}
                </label>
                <label className="term-label block">
                  <span className="term-label-text">USERNAME</span>
                  <input
                    {...register('username')}
                    aria-label="Username"
                    autoComplete="username"
                    placeholder="your_username"
                    className="term-input mt-1"
                  />
                  {errors.username && (
                    <p role="alert" className="mt-1 text-xs text-destructive">[ERR] {errors.username.message}</p>
                  )}
                  {getFieldStatus(usernameState, usernameMessage)}
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="term-label block">
                    <span className="term-label-text">PASSWORD</span>
                    <input
                      {...register('password')}
                      aria-label="Password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Min 8 characters"
                      className="term-input mt-1"
                    />
                    {errors.password && (
                      <p role="alert" className="mt-1 text-xs text-destructive">[ERR] {errors.password.message}</p>
                    )}
                  </label>
                  <label className="term-label block">
                    <span className="term-label-text">CONFIRM PASSWORD</span>
                    <input
                      {...register('confirmPassword')}
                      aria-label="Confirm password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      className="term-input mt-1"
                    />
                    {errors.confirmPassword && (
                      <p role="alert" className="mt-1 text-xs text-destructive">[ERR] {errors.confirmPassword.message}</p>
                    )}
                  </label>
                </div>

                {/* Password strength meter */}
                <div className="border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Password strength
                    </p>
                    {passwordStrength > 0 && (
                      <p className={`text-xs font-mono ${STRENGTH_COLORS[passwordStrength]}`}
                        style={passwordStrength >= 3 ? { textShadow: 'var(--phosphor-glow)' } : {}}>
                        {STRENGTH_LABELS[passwordStrength]}
                      </p>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm font-mono tracking-tight ${STRENGTH_COLORS[passwordStrength] ?? 'text-border'}`}
                    style={passwordStrength >= 3 ? { textShadow: 'var(--phosphor-glow)' } : {}}
                    aria-hidden="true"
                  >
                    [{STRENGTH_BAR[passwordStrength] ?? '░░░░░░░░'}]
                  </p>
                  <ul className="mt-3 space-y-0.5 text-[10px] text-muted-foreground">
                    <li>· 8–16 characters</li>
                    <li>· At least one uppercase letter</li>
                    <li>· At least one number</li>
                  </ul>
                </div>
              </div>
            )}

            {serverError && (
              <p role="alert" className="text-xs text-destructive">[ERR] {serverError}</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || isSubmitting}
                className="term-btn term-btn-ghost text-xs"
              >
                [ ← BACK ]
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => void goNext()}
                  disabled={isSubmitting}
                  className="term-btn text-xs"
                >
                  [ NEXT → ]
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || emailState !== 'available' || usernameState !== 'available'}
                  className="term-btn text-xs"
                >
                  {isSubmitting ? '[ CREATING... ]' : '[ CREATE ACCOUNT ]'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              ALREADY REGISTERED?{' '}
              <Link
                href="/login"
                className="text-primary underline-offset-2 hover:underline"
                style={{ textShadow: 'var(--phosphor-glow)' }}
              >
                RUN LOGIN.EXE
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
