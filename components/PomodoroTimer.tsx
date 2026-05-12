'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { ACCENT_COLOR } from '@/lib/constants'

export default function PomodoroTimer(): React.JSX.Element {
  const [mode, setMode] = useState<'focus' | 'rest'>('focus')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  const totalSeconds = useMemo(() => (mode === 'focus' ? 25 * 60 : 5 * 60), [mode])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          const nextMode = mode === 'focus' ? 'rest' : 'focus'
          setMode(nextMode)
          if (typeof window !== 'undefined') {
            new Audio('/sounds/ding.mp3').play().catch(() => undefined)
          }
          return nextMode === 'focus' ? 25 * 60 : 5 * 60
        }
        return currentSeconds - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning, mode])

  const progress = 1 - secondsLeft / totalSeconds
  const radius = 72
  const circumference = 2 * Math.PI * radius

  function toggleRunning(): void {
    setIsRunning((current) => !current)
  }

  function resetTimer(): void {
    setIsRunning(false)
    setMode('focus')
    setSecondsLeft(25 * 60)
  }

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Pomodoro</p>
          <h2 className="mt-2 text-2xl font-semibold">{mode === 'focus' ? 'Focus session' : 'Break session'}</h2>
        </div>
        <button type="button" onClick={() => setMode((currentMode) => (currentMode === 'focus' ? 'rest' : 'focus'))} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
          Switch mode
        </button>
      </div>
      <div className="mt-8 flex justify-center">
        <div className="relative h-56 w-56">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180" aria-hidden="true">
            <circle cx="90" cy="90" r={radius} className="fill-none stroke-black/10 dark:stroke-white/10" strokeWidth="12" />
            <circle
              cx="90"
              cy="90"
              r={radius}
              className="fill-none"
              stroke={ACCENT_COLOR}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * progress}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-semibold tabular-nums">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</p>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">{isRunning ? 'Running' : 'Paused'}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" aria-label={isRunning ? 'Pause timer' : 'Start timer'} onClick={toggleRunning} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-white" style={{ backgroundColor: ACCENT_COLOR }}>
          {isRunning ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button type="button" aria-label="Reset timer" onClick={resetTimer} className="inline-flex items-center gap-2 rounded-full border px-5 py-3" style={{ borderColor: ACCENT_COLOR }}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>
    </section>
  )
}