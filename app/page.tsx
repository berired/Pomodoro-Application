import Link from 'next/link'
import { CalendarDays, CheckSquare, Flame, Music4, School, TimerReset } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import PomodoroTimer from '@/components/PomodoroTimer'
import Heatmap from '@/components/Heatmap'
import SpotifyPlayer from '@/components/SpotifyPlayer'

const features = [
  { icon: TimerReset,  title: 'Pomodoro Timer',  description: 'Structured focus sessions and breaks.' },
  { icon: Music4,      title: 'Spotify Player',   description: 'Music controls and playlist access in one place.' },
  { icon: School,      title: 'Class Schedule',   description: 'Weekly class blocks for faster planning.' },
  { icon: Flame,       title: 'Login Heatmap',    description: 'Visualize your study and login streaks.' },
  { icon: CalendarDays, title: 'Calendar View',   description: 'Balance tasks, classes, and deadlines.' },
  { icon: CheckSquare, title: 'To-Do Lists',      description: 'Track Canvas and personal assignments.' },
]

function LandingPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">

          {/* Left: hero copy */}
          <div className="space-y-8 lg:max-w-xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 px-4 py-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Student productivity
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                One workspace for study, and momentum.
              </h1>
              <p className="max-w-md text-lg text-muted-foreground">
                Pomodoro sessions, playlists, assignments, schedules, and calendar planning — all in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-primary/60 px-6 py-3 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Right: feature list — typographic, not a card grid */}
          <div className="space-y-0 rounded-3xl border border-primary p-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`flex items-start gap-4 py-4 ${i < features.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{feature.description}</p>
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
