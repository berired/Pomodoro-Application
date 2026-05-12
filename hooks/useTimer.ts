import { useState, useEffect } from 'react'

export interface UseTimerReturn {
  secondsLeft: number
  isRunning: boolean
  mode: 'focus' | 'rest'
  focusDuration: number
  restDuration: number
  start: () => void
  pause: () => void
  reset: () => void
  switchMode: () => void
  setFocusDuration: (minutes: number) => void
  setRestDuration: (minutes: number) => void
}

export function useTimer(): UseTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'focus' | 'rest'>('focus')
  const [focusDuration, setFocusDuration] = useState(25)
  const [restDuration, setRestDuration] = useState(5)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          // Play sound
          if (typeof window !== 'undefined') {
            const audio = new Audio('/sounds/ding.mp3')
            audio.play().catch(() => {
              // Sound might not exist or fail
            })
          }
          // Switch mode
          if (mode === 'focus') {
            setMode('rest')
            return restDuration * 60
          } else {
            setMode('focus')
            return focusDuration * 60
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, mode, focusDuration, restDuration])

  return {
    secondsLeft,
    isRunning,
    mode,
    focusDuration,
    restDuration,
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    reset: () => {
      setIsRunning(false)
      setSecondsLeft(focusDuration * 60)
      setMode('focus')
    },
    switchMode: () => {
      setIsRunning(false)
      if (mode === 'focus') {
        setMode('rest')
        setSecondsLeft(restDuration * 60)
      } else {
        setMode('focus')
        setSecondsLeft(focusDuration * 60)
      }
    },
    setFocusDuration: (minutes) => {
      setFocusDuration(minutes)
      if (mode === 'focus' && !isRunning) {
        setSecondsLeft(minutes * 60)
      }
    },
    setRestDuration: (minutes) => {
      setRestDuration(minutes)
      if (mode === 'rest' && !isRunning) {
        setSecondsLeft(minutes * 60)
      }
    },
  }
}
