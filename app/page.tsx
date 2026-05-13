import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import PomodoroTimer from '@/components/PomodoroTimer'
import Heatmap from '@/components/Heatmap'
import SpotifyPlayer from '@/components/SpotifyPlayer'
import AmbientSound from '@/components/AmbientSound'

const features = [
  { cmd: 'pomodoro',  desc: 'Structured 25/5 focus and break cycles.' },
  { cmd: 'pip-timer', desc: 'Floating draggable timer persists across pages.' },
  { cmd: 'spotify',   desc: 'Music controls and playlist access.' },
  { cmd: 'schedule',  desc: 'Weekly class block grid for fast planning.' },
  { cmd: 'heatmap',   desc: 'Visualise study login streaks over 52 weeks.' },
  { cmd: 'calendar',  desc: 'Balance tasks, classes, and deadlines.' },
  { cmd: 'todo',      desc: 'Track Canvas LMS and personal assignments.' },
]

function LandingPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AmbientSound />
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">

        {/* Boot header */}
        <div className="mb-10 border border-border p-6" style={{ animation: 'boot-on 0.6s ease-out both' }}>
          <pre
            className="m-0 text-primary text-xs leading-tight sm:text-sm"
            style={{ fontFamily: "'Courier New', 'Consolas', 'Lucida Console', monospace", textShadow: 'var(--phosphor-glow-strong)' }}
            aria-hidden="true"
          >{`███████╗████████╗██╗   ██╗██████╗ ██╗   ██╗
██╔════╝╚══██╔══╝██║   ██║██╔══██╗╚██╗ ██╔╝
███████╗   ██║   ██║   ██║██║  ██║ ╚████╔╝
╚════██║   ██║   ██║   ██║██║  ██║  ╚██╔╝
███████║   ██║   ╚██████╔╝██████╔╝   ██║
╚══════╝   ╚═╝    ╚═════╝ ╚═════╝    ╚═╝`}</pre>
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              STUDYTERM v2.0  ·  Student Productivity Terminal  ·  All rights reserved
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Copyright (C) 2024  ·  Memory OK  ·  Modules loaded: 7/7
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">

          {/* Left: hero copy */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary" style={{ textShadow: 'var(--phosphor-glow)' }}>C:\STUDY&gt; </span>
                run studyterm.exe
              </p>
              <h1
                className="mt-3 text-4xl leading-tight sm:text-5xl"
                style={{ textShadow: 'var(--phosphor-glow-strong)' }}
              >
                ONE WORKSPACE.<br />
                ALL YOUR TOOLS.
              </h1>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Pomodoro sessions, playlists, assignments, schedules, and<br />
                calendar planning — all running in a single terminal.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/login" className="term-btn text-sm">
                [ LOGIN ]
              </Link>
              <Link href="/register" className="term-btn term-btn-ghost text-sm">
                [ REGISTER ]
              </Link>
            </div>

            <div className="border border-border p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">System info</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">PROC</span>: Pomodoro Engine v2.0<br />
                <span className="text-primary">MEM </span>: Supabase Cloud DB<br />
                <span className="text-primary">AUD </span>: Spotify Web Playback SDK<br />
                <span className="text-primary">VER </span>: Next.js 15 / TypeScript
              </p>
            </div>
          </div>

          {/* Right: feature listing as terminal output */}
          <div className="term-window">
            <div className="term-titlebar">
              <div className="term-titlebar-dots">
                <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
              </div>
              <span>FEATURES.TXT</span>
            </div>
            <div className="p-4">
              <p className="mb-4 text-xs text-muted-foreground">
                <span className="text-primary" style={{ textShadow: 'var(--phosphor-glow)' }}>$ </span>
                ls -la ./features/
              </p>
              <div className="space-y-0">
                {features.map((f, i) => (
                  <div
                    key={f.cmd}
                    className="flex items-start gap-3 border-b border-border py-3 last:border-b-0"
                    style={{ animation: `type-in 0.3s ease-out ${0.1 + i * 0.07}s both` }}
                  >
                    <span className="text-xs text-muted-foreground select-none w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-sm"
                        style={{ color: 'var(--primary)', textShadow: 'var(--phosphor-glow)', fontFamily: 'var(--font-display), monospace' }}
                      >
                        {f.cmd.toUpperCase()}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground">
                7 modules found. Type <span className="text-primary">LOGIN</span> or <span className="text-primary">REGISTER</span> to continue.
                <span
                  className="ml-0.5 inline-block text-primary"
                  style={{ animation: 'blink 1s step-end infinite', textShadow: 'var(--phosphor-glow)' }}
                  aria-hidden="true"
                >
                  █
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function DashboardPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <PomodoroTimer />
        <div className="flex flex-col gap-4">
          <SpotifyPlayer />
          <Heatmap />
        </div>
      </div>
    </main>
  )
}

export default async function Home(): Promise<React.JSX.Element> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const username = (user.user_metadata?.username as string | undefined) ?? 'Student'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar username={username} />
      <DashboardPage />
    </div>
  )
}
