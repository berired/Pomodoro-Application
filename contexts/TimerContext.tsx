'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { playAlarm } from '@/lib/alarmSound'

const DEFAULT_FOCUS_MINS = 25
const DEFAULT_BREAK_MINS = 5

interface TimerContextValue {
  mode: 'focus' | 'rest'
  focusMins: number
  breakMins: number
  secondsLeft: number
  totalSeconds: number
  isRunning: boolean
  editing: 'focus' | 'rest' | null
  draftValue: string
  setDraftValue: (v: string) => void
  toggleRunning: () => void
  resetTimer: () => void
  switchMode: () => void
  openEdit: (target: 'focus' | 'rest') => void
  commitEdit: () => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider')
  return ctx
}

export function TimerProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [mode, setMode] = useState<'focus' | 'rest'>('focus')
  const [focusMins, setFocusMins] = useState(DEFAULT_FOCUS_MINS)
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK_MINS)
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MINS * 60)
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_FOCUS_MINS * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [editing, setEditing] = useState<'focus' | 'rest' | null>(null)
  const [draftValue, setDraftValue] = useState('')

  // Refs so the interval always reads current values without re-subscribing
  const focusMinsRef = useRef(focusMins)
  const breakMinsRef = useRef(breakMins)
  const modeRef = useRef(mode)
  useEffect(() => { focusMinsRef.current = focusMins }, [focusMins])
  useEffect(() => { breakMinsRef.current = breakMins }, [breakMins])
  useEffect(() => { modeRef.current = mode }, [mode])

  useEffect(() => {
    if (!isRunning) return
    const interval = window.setInterval(() => {
      setSecondsLeft((cur) => {
        if (cur > 1) return cur - 1

        // Session ended
        const finishedMode = modeRef.current
        playAlarm(finishedMode)

        const nextMode = finishedMode === 'focus' ? 'rest' : 'focus'
        const nextSecs = nextMode === 'focus'
          ? focusMinsRef.current * 60
          : breakMinsRef.current * 60

        setMode(nextMode)
        setTotalSeconds(nextSecs)
        return nextSecs
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [isRunning])

  function toggleRunning(): void { setIsRunning((c) => !c) }

  function resetTimer(): void {
    setIsRunning(false)
    setMode('focus')
    const secs = focusMinsRef.current * 60
    setSecondsLeft(secs)
    setTotalSeconds(secs)
  }

  function switchMode(): void {
    const next = mode === 'focus' ? 'rest' : 'focus'
    const secs = next === 'focus' ? focusMins * 60 : breakMins * 60
    setIsRunning(false)
    setMode(next)
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
      if (mode === 'focus') { setSecondsLeft(clamped * 60); setTotalSeconds(clamped * 60) }
    } else if (editing === 'rest') {
      setBreakMins(clamped)
      breakMinsRef.current = clamped
      if (mode === 'rest') { setSecondsLeft(clamped * 60); setTotalSeconds(clamped * 60) }
    }
    setEditing(null)
  }

  return (
    <TimerContext.Provider value={{
      mode, focusMins, breakMins, secondsLeft, totalSeconds, isRunning,
      editing, draftValue, setDraftValue,
      toggleRunning, resetTimer, switchMode, openEdit, commitEdit,
    }}>
      {children}
    </TimerContext.Provider>
  )
}
