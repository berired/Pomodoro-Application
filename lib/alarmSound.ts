/**
 * Synthesizes a PC-speaker-style alarm using the Web Audio API.
 * Square wave oscillators — the exact sound of a 90s DOS/BIOS alert.
 *
 * focusEnd: three ascending tones × 2  (session over, time to rest)
 * breakEnd: three descending tones × 2 (break over, back to work)
 */

interface BeepNote {
  freq: number
  start: number
  dur: number
}

function scheduleTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  dur: number,
  vol: number,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'square'
  osc.frequency.value = freq

  // Sharp PC-speaker envelope: near-instant attack, hard cutoff
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.004)
  gain.gain.setValueAtTime(vol, startTime + dur - 0.008)
  gain.gain.linearRampToValueAtTime(0, startTime + dur)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + dur + 0.01)
}

function buildPattern(baseNotes: number[], repeat: number, noteLen: number, gap: number, repeatGap: number): BeepNote[] {
  const notes: BeepNote[] = []
  let t = 0
  for (let r = 0; r < repeat; r++) {
    for (const freq of baseNotes) {
      notes.push({ freq, start: t, dur: noteLen })
      t += noteLen + gap
    }
    t += repeatGap
  }
  return notes
}

export function playAlarm(mode: 'focus' | 'rest'): void {
  if (typeof window === 'undefined') return

  const ctx = new AudioContext()

  // Focus ends → ascending "well done, take a break" pattern
  // Break ends  → descending "back to work" pattern
  const ascending  = [659, 880, 1046, 1318]  // E5 A5 C6 E6
  const descending = [1318, 1046, 880, 659]  // E6 C6 A5 E5

  const freqs = mode === 'focus' ? ascending : descending
  const vol = 0.28
  const noteLen = 0.09
  const gap = 0.045
  const repeatGap = 0.22

  const pattern = buildPattern(freqs, 2, noteLen, gap, repeatGap)

  for (const { freq, start, dur } of pattern) {
    scheduleTone(ctx, freq, ctx.currentTime + start, dur, vol)
  }

  const totalDur = (pattern.at(-1)?.start ?? 0) + noteLen + 0.2
  setTimeout(() => ctx.close().catch(() => undefined), (totalDur + 0.5) * 1000)
}
