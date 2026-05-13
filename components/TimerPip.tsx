'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTimer } from '@/contexts/TimerContext'

const BAR_W = 14
const SIZE = 168

export default function TimerPip(): React.JSX.Element | null {
  const pathname = usePathname()
  const { mode, secondsLeft, totalSeconds, isRunning, toggleRunning, resetTimer } = useTimer()

  const [pos, setPos] = useState({ right: 20, bottom: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const pipRef = useRef<HTMLDivElement>(null)

  const visible = isRunning && pathname !== '/'

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    setIsDragging(true)
    const rect = pipRef.current!.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    pipRef.current!.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !pipRef.current) return
    const left = Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth - SIZE)
    const top  = Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - SIZE)
    setPos({ right: window.innerWidth - left - SIZE, bottom: window.innerHeight - top - SIZE })
  }, [isDragging])

  const onPointerUp = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') resetTimer() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, resetTimer])

  if (!visible) return null

  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0
  const filled   = Math.min(BAR_W, Math.max(0, Math.round(progress * BAR_W)))
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div
      ref={pipRef}
      role="region"
      aria-label="Floating Pomodoro timer"
      className="fixed z-[9996] flex flex-col border border-primary bg-card"
      style={{
        right: pos.right,
        bottom: pos.bottom,
        width: SIZE,
        height: SIZE,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        boxShadow: 'var(--phosphor-glow-strong), 0 8px 28px rgba(0,0,0,0.65)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Top: mode label */}
      <div className="flex items-center justify-center pt-3">
        <span
          className="text-[9px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--primary)', textShadow: 'var(--phosphor-glow)' }}
        >
          {mode === 'focus' ? 'FOCUS' : 'BREAK'}
        </span>
      </div>

      {/* Time — centred, fills the middle */}
      <div className="flex flex-1 items-center justify-center">
        <span
          aria-live="polite"
          aria-label={`${mm} minutes ${ss} seconds remaining`}
          style={{
            fontFamily: 'var(--font-display), monospace',
            fontSize: '3.1rem',
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: 'var(--primary)',
            textShadow: 'var(--phosphor-glow-strong)',
          }}
        >
          {mm}:{ss}
        </span>
      </div>

      {/* ASCII progress bar */}
      <div className="flex items-center justify-center">
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-mono-terminal), monospace',
            fontSize: '0.75rem',
            letterSpacing: '-0.5px',
            color: 'var(--primary)',
            textShadow: 'var(--phosphor-glow)',
          }}
        >
          {'['}{'█'.repeat(filled)}{'░'.repeat(BAR_W - filled)}{']'}
        </span>
      </div>

      {/* Controls — below the progress bar */}
      <div className="flex items-center justify-center gap-2 pb-3 pt-1.5">
        <button
          type="button"
          onClick={toggleRunning}
          aria-label="Pause timer"
          className="w-6 h-6 flex items-center justify-center border border-transparent text-primary text-sm hover:border-primary transition-colors leading-none"
          style={{ textShadow: 'var(--phosphor-glow)' }}
        >
          ‖
        </button>
        <button
          type="button"
          onClick={resetTimer}
          aria-label="Reset timer"
          className="w-6 h-6 flex items-center justify-center border border-transparent text-muted-foreground text-sm hover:border-border hover:text-primary transition-colors leading-none"
        >
          ↺
        </button>
      </div>

      {/* Progress underline */}
      <div className="h-px w-full overflow-hidden bg-border shrink-0">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.round(progress * 100)}%`, boxShadow: 'var(--phosphor-glow)' }}
        />
      </div>
    </div>
  )
}
