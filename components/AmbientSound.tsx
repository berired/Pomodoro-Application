'use client'

import { useEffect, useRef, useState } from 'react'

const MASTER_VOL = 0.055

export default function AmbientSound(): React.JSX.Element | null {
  const [active, setActive] = useState(false)
  const [muted, setMuted] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const startedRef = useRef(false)

  function buildAudio(): void {
    if (startedRef.current) return
    startedRef.current = true

    const ctx = new AudioContext()
    ctxRef.current = ctx

    const master = ctx.createGain()
    master.gain.value = MASTER_VOL
    master.connect(ctx.destination)
    masterRef.current = master

    // ── 1. Fan rumble — two-stage lowpass filtered white noise ──────────────
    const fanBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
    const fanData = fanBuf.getChannelData(0)
    for (let i = 0; i < fanData.length; i++) fanData[i] = Math.random() * 2 - 1

    const fanSrc = ctx.createBufferSource()
    fanSrc.buffer = fanBuf
    fanSrc.loop = true
    fanSrc.loopStart = 0
    fanSrc.loopEnd = 3

    const lp1 = ctx.createBiquadFilter()
    lp1.type = 'lowpass'
    lp1.frequency.value = 280
    lp1.Q.value = 1.2

    const lp2 = ctx.createBiquadFilter()
    lp2.type = 'lowpass'
    lp2.frequency.value = 160
    lp2.Q.value = 0.8

    const fanGain = ctx.createGain()
    fanGain.gain.value = 0.9

    fanSrc.connect(lp1)
    lp1.connect(lp2)
    lp2.connect(fanGain)
    fanGain.connect(master)
    fanSrc.start()

    // ── 2. Motor hum — sawtooth at hard-drive spin frequency (~108 Hz) ──────
    const motor = ctx.createOscillator()
    motor.type = 'sawtooth'
    motor.frequency.value = 108

    const motorBp = ctx.createBiquadFilter()
    motorBp.type = 'bandpass'
    motorBp.frequency.value = 108
    motorBp.Q.value = 14

    const motorGain = ctx.createGain()
    motorGain.gain.value = 0.12

    motor.connect(motorBp)
    motorBp.connect(motorGain)
    motorGain.connect(master)
    motor.start()

    // ── 3. Sub-harmonic body resonance (power supply transformer hum ~60 Hz) ─
    const hum = ctx.createOscillator()
    hum.type = 'sine'
    hum.frequency.value = 60

    const humGain = ctx.createGain()
    humGain.gain.value = 0.08

    hum.connect(humGain)
    humGain.connect(master)
    hum.start()

    // ── 4. Very faint high-freq hiss (capacitor / CRT buzz) ─────────────────
    const hissBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const hissData = hissBuf.getChannelData(0)
    for (let i = 0; i < hissData.length; i++) hissData[i] = Math.random() * 2 - 1

    const hissSrc = ctx.createBufferSource()
    hissSrc.buffer = hissBuf
    hissSrc.loop = true

    const hissHp = ctx.createBiquadFilter()
    hissHp.type = 'highpass'
    hissHp.frequency.value = 5500

    const hissGain = ctx.createGain()
    hissGain.gain.value = 0.055

    hissSrc.connect(hissHp)
    hissHp.connect(hissGain)
    hissGain.connect(master)
    hissSrc.start()

    // ── 5. LFO: slow wobble on the fan to simulate blade-pass variation ──────
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.18

    const lfoAmt = ctx.createGain()
    lfoAmt.gain.value = 0.09

    // Modulate fan gain, not master
    lfo.connect(lfoAmt)
    lfoAmt.connect(fanGain.gain)
    lfo.start()

    // Fade in gently
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(MASTER_VOL, ctx.currentTime + 2.5)

    setActive(true)
  }

  useEffect(() => {
    const handler = (): void => buildAudio()

    window.addEventListener('mousemove', handler, { once: true })
    window.addEventListener('click', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    window.addEventListener('touchstart', handler, { once: true })

    return () => {
      window.removeEventListener('mousemove', handler)
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('touchstart', handler)
      ctxRef.current?.close().catch(() => undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle(): void {
    if (!masterRef.current || !ctxRef.current) return
    const next = !muted
    const now = ctxRef.current.currentTime
    masterRef.current.gain.cancelScheduledValues(now)
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now)
    masterRef.current.gain.linearRampToValueAtTime(next ? 0 : MASTER_VOL, now + 0.4)
    setMuted(next)
  }

  if (!active) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Unmute ambient sound' : 'Mute ambient sound'}
      className="fixed bottom-4 right-4 z-[9997] term-btn term-btn-ghost px-2 py-1 text-[10px] opacity-50 hover:opacity-100 transition-opacity"
    >
      {muted ? '[SFX: OFF]' : '[SFX: ON]'}
    </button>
  )
}
