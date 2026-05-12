import Link from 'next/link'
import { CalendarDays, CheckSquare, Flame, Music4, School, TimerReset } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { ACCENT_COLOR } from '@/lib/constants'
import NavBar from '@/components/NavBar'
import PomodoroTimer from '@/components/PomodoroTimer'
import Heatmap from '@/components/Heatmap'
import SpotifyPlayer from '@/components/SpotifyPlayer'

const features = [
  { icon: TimerReset, title: 'Pomodoro Timer', description: 'Structured focus sessions and breaks.' },
  { icon: Music4, title: 'Spotify Player', description: 'Music controls and playlist access in one place.' },
  { icon: School, title: 'Class Schedule', description: 'Weekly class blocks for faster planning.' },
  { icon: Flame, title: 'Login Heatmap', description: 'Visualize your study and login streaks.' },
  { icon: CalendarDays, title: 'Calendar View', description: 'Balance tasks, classes, and deadlines.' },
  { icon: CheckSquare, title: 'To-Do Lists', description: 'Track Canvas and personal assignments.' },
]

function LandingPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm" style={{ borderColor: ACCENT_COLOR }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT_COLOR }} />
              Student productivity system
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                A focused workspace for school, study, and momentum.
              </h1>
              <p className="max-w-2xl text-lg text-black/70 dark:text-white/70 sm:text-xl">
                Pomodoro sessions, playlists, assignments, schedules, and calendar planning all live in one cohesive app.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link className="rounded-full px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90" href="/login" style={{ backgroundColor: ACCENT_COLOR }}>
                Log In
              </Link>
              <Link className="rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" href="/register" style={{ borderColor: ACCENT_COLOR }}>
                Sign Up
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-3xl border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(255,255,255,0.06)]" style={{ borderColor: ACCENT_COLOR }}>
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="rounded-2xl border p-4" style={{ borderColor: `${ACCENT_COLOR}33` }}>
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl p-3 text-white" style={{ backgroundColor: ACCENT_COLOR }}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold">{feature.title}</h2>
                      <p className="text-sm text-black/70 dark:text-white/70">{feature.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

function DashboardPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Pomodoro */}
        <PomodoroTimer />

        {/* Right: Spotify on top, Heatmap below */}
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
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <NavBar username={username} />
      <DashboardPage />
    </div>
  )
}
