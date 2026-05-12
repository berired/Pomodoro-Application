'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { ACCENT_COLOR, PASSWORD_REGEX } from '@/lib/constants'

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

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6 rounded-3xl border p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]" style={{ borderColor: ACCENT_COLOR }}>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Sign Up</h1>
          <p className="text-sm text-black/70 dark:text-white/70">Create your student account in three quick steps.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === step
            const isComplete = stepNumber < step
            return (
              <div key={label} className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: isActive ? ACCENT_COLOR : `${ACCENT_COLOR}33` }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: isActive || isComplete ? ACCENT_COLOR : `${ACCENT_COLOR}66` }}>
                  {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : stepNumber}
                </div>
                <div>
                  <p className="text-sm font-medium">Step {stepNumber}</p>
                  <p className="text-xs text-black/60 dark:text-white/60">{label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Full name</span>
              <input {...register('fullName')} aria-label="Full name" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
              {errors.fullName && <p role="alert" className="text-sm text-red-500">{errors.fullName.message}</p>}
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">School</span>
              <input {...register('school')} aria-label="School" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
              {errors.school && <p role="alert" className="text-sm text-red-500">{errors.school.message}</p>}
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Email</span>
              <input {...register('email')} aria-label="Email" type="email" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
              {errors.email && <p role="alert" className="text-sm text-red-500">{errors.email.message}</p>}
              {emailMessage ? <p className={`text-sm ${emailState === 'available' ? 'text-green-600' : 'text-black/60 dark:text-white/60'}`}>{emailMessage}</p> : null}
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Username</span>
              <input {...register('username')} aria-label="Username" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
              {errors.username && <p role="alert" className="text-sm text-red-500">{errors.username.message}</p>}
              {usernameMessage ? <p className={`text-sm ${usernameState === 'available' ? 'text-green-600' : 'text-black/60 dark:text-white/60'}`}>{usernameMessage}</p> : null}
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Password</span>
                <input {...register('password')} aria-label="Password" type="password" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
                {errors.password && <p role="alert" className="text-sm text-red-500">{errors.password.message}</p>}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Confirm password</span>
                <input {...register('confirmPassword')} aria-label="Confirm password" type="password" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
                {errors.confirmPassword && <p role="alert" className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </label>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: `${ACCENT_COLOR}33` }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Password strength</p>
                <p className="text-xs text-black/60 dark:text-white/60">{passwordStrength <= 1 ? 'Weak' : passwordStrength === 2 ? 'Fair' : passwordStrength === 3 ? 'Strong' : 'Very strong'}</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-2 rounded-full transition-all" style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: ACCENT_COLOR }} />
              </div>
              <ul className="mt-3 space-y-1 text-xs text-black/60 dark:text-white/60">
                <li>8-16 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
              </ul>
            </div>
          </div>
        ) : null}

        {serverError && <p role="alert" className="text-sm text-red-500">{serverError}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={goBack} disabled={step === 1 || isSubmitting} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm disabled:opacity-50" style={{ borderColor: ACCENT_COLOR }}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          {step < 3 ? (
            <button type="button" onClick={() => void goNext()} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm text-white disabled:opacity-60" style={{ backgroundColor: ACCENT_COLOR }}>
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting || emailState !== 'available' || usernameState !== 'available'} className="rounded-full px-5 py-3 text-sm text-white disabled:opacity-60" style={{ backgroundColor: ACCENT_COLOR }}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          )}
        </div>

        <p className="text-sm text-black/70 dark:text-white/70">
          Already have an account? <Link href="/login" className="underline" style={{ color: ACCENT_COLOR }}>Log in</Link>
        </p>
      </form>
    </section>
  )
}