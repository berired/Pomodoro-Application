'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

const REDIRECT_DELAY = 4

export default function SpotifyConnectedPage(): React.JSX.Element {
  const router = useRouter()
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(dotsInterval)
  }, [])

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/')
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg border border-border p-8 font-mono">

        {/* Header bar */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
          <span className="text-primary text-xs opacity-50">┌──</span>
          <span className="font-[family-name:var(--font-display)] text-primary text-lg tracking-widest">
            SPOTIFY_LINK.EXE
          </span>
          <span className="text-primary text-xs opacity-50">──┐</span>
        </div>

        {/* Terminal output lines */}
        <div className="space-y-2 text-sm">
          <div className="text-muted-foreground">
            <span className="text-primary opacity-60">{'>'}</span> Verifying OAuth token{dots}
          </div>
          <div className="text-primary opacity-70">
            <span className="opacity-60">{'>'}</span> Token exchange{' '}
            <span className="text-green-400 dark:text-green-400">[OK]</span>
          </div>
          <div className="text-primary opacity-70">
            <span className="opacity-60">{'>'}</span> Credentials stored{' '}
            <span className="text-green-400">[OK]</span>
          </div>
        </div>

        {/* Success block */}
        <div className="mt-6 border border-primary/30 bg-primary/5 p-4">
          <div className="font-[family-name:var(--font-display)] text-primary text-2xl tracking-widest mb-1">
            CONNECTION ESTABLISHED
          </div>
          <div className="text-muted-foreground text-xs tracking-wider">
            SPOTIFY ACCOUNT SUCCESSFULLY LINKED TO SESSION
          </div>
        </div>

        {/* Redirect notice */}
        <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-primary animate-pulse" />
          Redirecting to dashboard in{' '}
          <span className="text-primary font-bold">{countdown}</span>
          {countdown === 1 ? ' second' : ' seconds'}
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-border flex justify-between text-xs text-primary opacity-30">
          <span>EXIT CODE: 0</span>
          <span>STATUS: CONNECTED</span>
        </div>

      </div>
      </div>
      <Footer />
    </div>
  )
}
