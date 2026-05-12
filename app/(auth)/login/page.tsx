'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ACCENT_COLOR } from '@/lib/constants'

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
    const result = await signIn('credentials', {
      redirect: false,
      identifier: values.identifier,
      password: values.password,
      callbackUrl: '/',
    })

    if (result?.error) {
      setServerError('Invalid credentials')
      return
    }

    router.push('/')
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6 rounded-3xl border p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]" style={{ borderColor: ACCENT_COLOR }}>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Log In</h1>
          <p className="text-sm text-black/70 dark:text-white/70">Access your study dashboard.</p>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Username or email</span>
          <input {...register('identifier')} aria-label="Username or email" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
          {errors.identifier && <p role="alert" className="text-sm text-red-500">{errors.identifier.message}</p>}
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input {...register('password')} type="password" aria-label="Password" className="w-full rounded-2xl border bg-transparent px-4 py-3 outline-none" style={{ borderColor: ACCENT_COLOR }} />
          {errors.password && <p role="alert" className="text-sm text-red-500">{errors.password.message}</p>}
        </label>
        {serverError && <p role="alert" className="text-sm text-red-500">{serverError}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full rounded-full px-6 py-3 font-medium text-white disabled:opacity-60" style={{ backgroundColor: ACCENT_COLOR }}>
          {isSubmitting ? 'Signing in...' : 'Log In'}
        </button>
      </form>
    </section>
  )
}