'use client'

import { useEffect, useRef } from 'react'
import { useTimer } from '@/contexts/TimerContext'

const BAR_WIDTH = 28

function AsciiProgressBar({ progress }: { progress: number }): React.JSX.Element {
  const filled = Math.min(BAR_WIDTH, Math.max(0, Math.round(progress * BAR_WIDTH)))
  const empty = BAR_WIDTH - filled
  return (
    <span className="term-progress text-lg tracking-tight" aria-hidden="true">
      {'['}{'█'.repeat(filled)}{'░'.repeat(empty)}{']'}
    </span>
  )
}

export default function PomodoroTimer(): React.JSX.Element {
  const {
    mode, focusMins, breakMins, secondsLeft, totalSeconds, isRunning,
    editing, draftValue, setDraftValue,
    toggleRunning, resetTimer, switchMode, openEdit, commitEdit,
  } = useTimer()

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const pct = Math.round(progress * 100)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') commitEdit()
  }

  return (
    <section className="term-window flex flex-col">
      {/* Title bar */}
      <div className="term-titlebar">
        <div className="term-titlebar-dots">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        <span>POMODORO.EXE</span>
        <span className="ml-auto">
          {mode === 'focus' ? 'MODE: FOCUS' : 'MODE: BREAK'}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary" style={{ textShadow: 'var(--phosphor-glow)' }}>&gt; </span>
              SESSION STATUS
            </p>
            <h2 className="mt-1 text-2xl">
              {mode === 'focus' ? 'FOCUS SESSION' : 'BREAK SESSION'}
            </h2>
          </div>
          <button type="button" onClick={switchMode} className="term-btn term-btn-ghost text-xs">
            [SWITCH]
          </button>
        </div>

        {/* Duration editors */}
        <div className="grid grid-cols-2 gap-3">
          {(['focus', 'rest'] as const).map((target) => {
            const mins = target === 'focus' ? focusMins : breakMins
            const label = target === 'focus' ? 'FOCUS' : 'BREAK'
            const isActive = editing === target
            return (
              <div key={target} className="flex flex-col items-center border border-border px-4 py-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
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
                    className="mt-1 w-full bg-transparent text-center text-3xl text-primary"
                    style={{ fontFamily: 'var(--font-display), monospace', textShadow: 'var(--phosphor-glow)' }}
                    aria-label={`${label} duration in minutes`}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => openEdit(target)}
                    className="group mt-1 flex items-center gap-2 text-3xl text-primary"
                    style={{ fontFamily: 'var(--font-display), monospace', textShadow: 'var(--phosphor-glow-strong)' }}
                    aria-label={`Edit ${label.toLowerCase()} duration: ${mins} minutes`}
                  >
                    {String(mins).padStart(2, '0')}M
                    <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      [EDIT]
                    </span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Clock display */}
        <div className="flex flex-col items-center gap-3 border border-border py-6">
          <p
            className="text-7xl leading-none text-primary"
            style={{ fontFamily: 'var(--font-display), monospace', textShadow: 'var(--phosphor-glow-strong)' }}
            aria-live="polite"
            aria-label={`${mm} minutes ${ss} seconds remaining`}
          >
            {mm}:{ss}
          </p>

          <div className="flex flex-col items-center gap-1">
            <AsciiProgressBar progress={progress} />
            <p className="text-xs text-muted-foreground">
              {pct}% ELAPSED
              {' · '}
              <span className={isRunning ? 'text-primary' : 'text-muted-foreground'}>
                {isRunning ? 'RUNNING' : 'PAUSED'}
              </span>
              {isRunning && (
                <span
                  className="ml-1 inline-block text-primary"
                  style={{ animation: 'blink 1s step-end infinite', textShadow: 'var(--phosphor-glow)' }}
                  aria-hidden="true"
                >
                  █
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            onClick={toggleRunning}
            className="term-btn text-sm"
          >
            {isRunning ? '[ ‖ PAUSE ]' : '[ ▶ START ]'}
          </button>
          <button
            type="button"
            aria-label="Reset timer"
            onClick={resetTimer}
            className="term-btn term-btn-ghost text-sm"
          >
            [ ↺ RESET ]
          </button>
        </div>
      </div>
    </section>
  )
}
