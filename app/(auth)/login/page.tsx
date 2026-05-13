'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage(): React.JSX.Element {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginValues): Promise<void> {
    setServerError(null)
    const supabase = createSupabaseBrowserClient()

    let email = values.identifier
    if (!email.includes('@')) {
      const res = await fetch(`/api/auth/lookup-email?username=${encodeURIComponent(values.identifier)}`)
      const data = await res.json() as { email: string | null }
      if (!data.email) { setServerError('Invalid credentials'); return }
      email = data.email
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: values.password })
    if (error) { setServerError('Invalid credentials'); return }

    void fetch('/api/auth/record-login', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-16">
      <div className="w-full term-window" style={{ animation: 'boot-on 0.5s ease-out both' }}>

        {/* Title bar */}
        <div className="term-titlebar">
          <div className="term-titlebar-dots">
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </div>
          <span>LOGIN.EXE</span>
          <span className="ml-auto">STUDYTERM v2.0</span>
        </div>

        <div className="p-6">
          {/* Boot sequence header */}
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary" style={{ textShadow: 'var(--phosphor-glow)' }}>C:\STUDY&gt; </span>
              authenticate --user
            </p>
            <h1
              className="mt-2 text-3xl"
              style={{ textShadow: 'var(--phosphor-glow-strong)' }}
            >
              USER LOGIN
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter credentials to access your study dashboard.
              <span
                className="ml-1 inline-block text-primary"
                style={{ animation: 'blink 1s step-end infinite', textShadow: 'var(--phosphor-glow)' }}
                aria-hidden="true"
              >
                █
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <label className="term-label block">
              <span className="term-label-text">USERNAME OR EMAIL</span>
              <input
                {...register('identifier')}
                aria-label="Username or email"
                autoComplete="username"
                placeholder="user@example.com"
                className="term-input mt-1"
              />
              {errors.identifier && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  [ERR] {errors.identifier.message}
                </p>
              )}
            </label>

            <label className="term-label block">
              <span className="term-label-text">PASSWORD</span>
              <input
                {...register('password')}
                type="password"
                aria-label="Password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="term-input mt-1"
              />
              {errors.password && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  [ERR] {errors.password.message}
                </p>
              )}
            </label>

            {serverError && (
              <p role="alert" className="text-xs text-destructive">
                [AUTH_FAIL] {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="term-btn w-full justify-center py-3 text-sm"
            >
              {isSubmitting ? '[ AUTHENTICATING... ]' : '[ EXECUTE LOGIN ]'}
            </button>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              NO ACCOUNT?{' '}
              <Link
                href="/register"
                className="text-primary underline-offset-2 hover:underline"
                style={{ textShadow: 'var(--phosphor-glow)' }}
              >
                RUN REGISTER.EXE
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
