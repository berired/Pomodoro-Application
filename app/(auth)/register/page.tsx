'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
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

const inputClass = 'w-full rounded-2xl border border-border bg-transparent px-4 py-3 transition-colors focus:border-primary'

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
    defaultValues: {
      fullName: '',
      school: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  })

  const emailValue = watch('email')
  const usernameValue = watch('username')
  const passwordValue = watch('password')
  const passwordStrength = useMemo(() => getPasswordStrength(passwordValue ?? ''), [passwordValue])

  useEffect(() => {
    if (step !== 2) return

    const emailValueTrimmed = emailValue?.trim() ?? ''
    if (!emailValueTrimmed) {
      setEmailState('idle')
      setEmailMessage(null)
      return
    }

    const timer = window.setTimeout(() => {
      const validateEmail = async (): Promise<void> => {
        const localEmailCheck = z.string().email().safeParse(emailValueTrimmed)
        if (!localEmailCheck.success) {
          setEmailState('invalid')
          setEmailMessage('Enter a valid email address')
          return
        }

        setEmailState('checking')
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailValueTrimmed)}`)
        if (!response.ok) {
          setEmailState('invalid')
          setEmailMessage('Unable to verify email right now')
          return
        }

        const payload = await response.json() as { exists?: boolean }
        if (payload.exists) {
          setEmailState('taken')
          setEmailMessage('Email is already in use')
          return
        }

        setEmailState('available')
        setEmailMessage('Email is available')
      }

      void validateEmail()
    }, 400)

    return () => window.clearTimeout(timer)
  }, [emailValue, step])

  useEffect(() => {
    if (step !== 2) return

    const usernameValueTrimmed = usernameValue?.trim() ?? ''
    if (!usernameValueTrimmed) {
      setUsernameState('idle')
      setUsernameMessage(null)
      return
    }

    const timer = window.setTimeout(() => {
      const validateUsername = async (): Promise<void> => {
        const localUsernameCheck = z.string().min(3).regex(/^[a-zA-Z0-9_]+$/).safeParse(usernameValueTrimmed)
        if (!localUsernameCheck.success) {
          setUsernameState('invalid')
          setUsernameMessage('Use at least 3 characters: letters, numbers, underscores')
          return
        }

        setUsernameState('checking')
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(usernameValueTrimmed)}`)
        if (!response.ok) {
          setUsernameState('invalid')
          setUsernameMessage('Unable to verify username right now')
          return
        }

        const payload = await response.json() as { exists?: boolean }
        if (payload.exists) {
          setUsernameState('taken')
          setUsernameMessage('Username is already in use')
          return
        }

        setUsernameState('available')
        setUsernameMessage('Username is available')
      }

      void validateUsername()
    }, 400)

    return () => window.clearTimeout(timer)
  }, [step, usernameValue])

  async function goNext(): Promise<void> {
    setServerError(null)
    if (step === 1) {
      const stepIsValid = await trigger(['fullName', 'school'])
      if (stepIsValid) setStep(2)
      return
    }

    if (step === 2) {
      const stepIsValid = await trigger(['email', 'username'])
      if (!stepIsValid) return
      if (emailState !== 'available' || usernameState !== 'available') {
        setServerError('Please use available email and username values before continuing.')
        return
      }
      setStep(3)
    }
  }

  function goBack(): void {
    setServerError(null)
    setStep((currentStep) => Math.max(1, currentStep - 1))
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

  const stepLabels = ['Profile', 'Account', 'Password']

  const strengthLabels = ['', 'Weak', 'Fair', 'Strong', 'Very strong']
  const strengthColors = ['', 'bg-destructive', 'bg-yellow-500', 'bg-green-500', 'bg-green-600']

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-6 rounded-3xl border border-primary p-8 shadow-[0_24px_80px_rgba(0,0,0,0.07)]"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">Three quick steps to get started.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === step
            const isComplete = stepNumber < step
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isActive || isComplete
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isComplete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : stepNumber}
                </div>
                <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {index < stepLabels.length - 1 && (
                  <div className={`ml-auto h-px flex-1 transition-colors ${isComplete ? 'bg-primary/40' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Full name</span>
              <input
                {...register('fullName')}
                aria-label="Full name"
                autoComplete="name"
                className={inputClass}
              />
              {errors.fullName && (
                <p role="alert" className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">School</span>
              <input
                {...register('school')}
                aria-label="School"
                className={inputClass}
              />
              {errors.school && (
                <p role="alert" className="text-sm text-destructive">{errors.school.message}</p>
              )}
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Email</span>
              <input
                {...register('email')}
                aria-label="Email"
                type="email"
                autoComplete="email"
                className={inputClass}
              />
              {errors.email && (
                <p role="alert" className="text-sm text-destructive">{errors.email.message}</p>
              )}
              {emailMessage && (
                <p className={`text-sm ${emailState === 'available' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {emailMessage}
                </p>
              )}
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Username</span>
              <input
                {...register('username')}
                aria-label="Username"
                autoComplete="username"
                className={inputClass}
              />
              {errors.username && (
                <p role="alert" className="text-sm text-destructive">{errors.username.message}</p>
              )}
              {usernameMessage && (
                <p className={`text-sm ${usernameState === 'available' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {usernameMessage}
                </p>
              )}
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Password</span>
                <input
                  {...register('password')}
                  aria-label="Password"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                />
                {errors.password && (
                  <p role="alert" className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Confirm password</span>
                <input
                  {...register('confirmPassword')}
                  aria-label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                />
                {errors.confirmPassword && (
                  <p role="alert" className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </label>
            </div>

            <div className="rounded-2xl border border-primary/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Password strength</p>
                {passwordStrength > 0 && (
                  <p className="text-xs text-muted-foreground">{strengthLabels[passwordStrength]}</p>
                )}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted">
                <div
                  className={`h-1.5 rounded-full transition-all ${strengthColors[passwordStrength] ?? 'bg-primary'}`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
              <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
                <li>8–16 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
              </ul>
            </div>
          </div>
        )}

        {serverError && (
          <p role="alert" className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || isSubmitting}
            className="inline-flex items-center gap-2 rounded-full border border-primary/60 px-5 py-3 text-sm transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => void goNext()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || emailState !== 'available' || usernameState !== 'available'}
              className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </section>
  )
}
