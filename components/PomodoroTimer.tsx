'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Pencil, Play, RotateCcw } from 'lucide-react'
import { ACCENT_COLOR } from '@/lib/constants'

const DEFAULT_FOCUS_MINS = 25
const DEFAULT_BREAK_MINS = 5
const RADIUS = 72
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function PomodoroTimer(): React.JSX.Element {
  const [mode, setMode] = useState<'focus' | 'rest'>('focus')
  const [focusMins, setFocusMins] = useState(DEFAULT_FOCUS_MINS)
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK_MINS)
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MINS * 60)
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_FOCUS_MINS * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [editing, setEditing] = useState<'focus' | 'rest' | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep refs in sync so interval closure always reads latest values
  const focusMinsRef = useRef(focusMins)
  const breakMinsRef = useRef(breakMins)
  useEffect(() => { focusMinsRef.current = focusMins }, [focusMins])
  useEffect(() => { breakMinsRef.current = breakMins }, [breakMins])

  useEffect(() => {
    if (!isRunning) return

    const interval = window.setInterval(() => {
      setSecondsLeft((cur) => {
        if (cur <= 1) {
          setMode((currentMode) => {
            const nextMode = currentMode === 'focus' ? 'rest' : 'focus'
            const nextTotal = nextMode === 'focus'
              ? focusMinsRef.current * 60
              : breakMinsRef.current * 60
            setTotalSeconds(nextTotal)
            return nextMode
          })
          if (typeof window !== 'undefined') {
            new Audio('/sounds/ding.mp3').play().catch(() => undefined)
          }
          const nextMode = mode === 'focus' ? 'rest' : 'focus'
          return nextMode === 'focus' ? focusMinsRef.current * 60 : breakMinsRef.current * 60
        }
        return cur - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning, mode])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0
  const dashOffset = CIRCUMFERENCE * progress

  function toggleRunning(): void {
    setIsRunning((cur) => !cur)
  }

  function resetTimer(): void {
    setIsRunning(false)
    setMode('focus')
    const secs = focusMins * 60
    setSecondsLeft(secs)
    setTotalSeconds(secs)
  }

  function openEdit(target: 'focus' | 'rest'): void {
    setIsRunning(false)
    setEditing(target)
    setDraftValue(String(target === 'focus' ? focusMins : breakMins))
  }

  function commitEdit(): void {
    const parsed = parseInt(draftValue, 10)
    const clamped = Math.min(99, Math.max(1, isNaN(parsed) ? 1 : parsed))

    if (editing === 'focus') {
      setFocusMins(clamped)
      focusMinsRef.current = clamped
      if (mode === 'focus') {
        const secs = clamped * 60
        setSecondsLeft(secs)
        setTotalSeconds(secs)
      }
    } else if (editing === 'rest') {
      setBreakMins(clamped)
      breakMinsRef.current = clamped
      if (mode === 'rest') {
        const secs = clamped * 60
        setSecondsLeft(secs)
        setTotalSeconds(secs)
      }
    }
    setEditing(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(null)
  }

  function switchMode(): void {
    const nextMode = mode === 'focus' ? 'rest' : 'focus'
    const secs = nextMode === 'focus' ? focusMins * 60 : breakMins * 60
    setIsRunning(false)
    setMode(nextMode)
    setSecondsLeft(secs)
    setTotalSeconds(secs)
  }

  return (
    <section className="rounded-3xl border p-6" style={{ borderColor: ACCENT_COLOR }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Pomodoro</p>
          <h2 className="mt-2 text-2xl font-semibold">{mode === 'focus' ? 'Focus session' : 'Break session'}</h2>
        </div>
        <button
          type="button"
          onClick={switchMode}
          className="rounded-full border px-4 py-2 text-sm"
          style={{ borderColor: ACCENT_COLOR }}
        >
          Switch mode
        </button>
      </div>

      {/* Duration editors */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {(['focus', 'rest'] as const).map((target) => {
          const mins = target === 'focus' ? focusMins : breakMins
          const label = target === 'focus' ? 'Focus' : 'Break'
          const isActive = editing === target

          return (
            <div
              key={target}
              className="flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 text-center"
              style={{ borderColor: `${ACCENT_COLOR}99` }}
            >
              <span className="w-full text-center text-xs uppercase tracking-widest text-black/50 dark:text-white/40">
                {label}
              </span>
              {isActive ? (
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={99}
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-center text-2xl font-semibold tabular-nums outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openEdit(target)}
                  className="group flex w-full items-center justify-center gap-2 text-2xl font-semibold tabular-nums"
                >
                  {String(mins).padStart(2, '0')}m
                  <Pencil className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-50" aria-hidden="true" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress ring */}
      <div className="mt-6 flex justify-center">
        <div className="relative h-56 w-56">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180" aria-hidden="true">
            {/* Track */}
            <circle
              cx="90" cy="90" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-black/10 dark:text-white/10"
            />
            {/* Progress arc */}
            <circle
              cx="90" cy="90" r={RADIUS}
              fill="none"
              stroke={ACCENT_COLOR}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-semibold tabular-nums">
              {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
            </p>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">{isRunning ? 'Running' : 'Paused'}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          onClick={toggleRunning}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-white"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          {isRunning ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          aria-label="Reset timer"
          onClick={resetTimer}
          className="inline-flex items-center gap-2 rounded-full border px-5 py-3"
          style={{ borderColor: ACCENT_COLOR }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>
    </section>
  )
}
