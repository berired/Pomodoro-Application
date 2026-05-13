import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import LogoutButton from '@/components/LogoutButton'

interface NavBarProps {
  username: string
}

export default function NavBar({ username }: NavBarProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2">

        {/* Left: prompt + nav links */}
        <nav className="flex flex-wrap items-center gap-0" aria-label="Main navigation">
          <span
            className="hidden select-none pr-3 text-sm text-muted-foreground sm:inline"
            aria-hidden="true"
          >
            C:\STUDY&gt;
          </span>
          {(['/', '/academics', '/calendar'] as const).map((href, i) => {
            const labels = ['HOME', 'ACADEMICS', 'CALENDAR']
            return (
              <Link
                key={href}
                href={href}
                className="border border-transparent px-3 py-1 text-sm uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
                style={{ textShadow: 'var(--phosphor-glow)' }}
              >
                {i > 0 && <span className="mr-2 text-border" aria-hidden="true">/</span>}
                {labels[i]}
              </Link>
            )
          })}
        </nav>

        {/* Right: user info + actions */}
        <div className="flex items-center gap-2">
          <span className="hidden select-none text-xs text-muted-foreground sm:inline">
            USER:<span className="ml-1 text-primary" style={{ textShadow: 'var(--phosphor-glow)' }}>
              {username.toUpperCase()}
            </span>
          </span>

          <Link
            href="/profile"
            aria-label="Profile settings"
            className="term-btn term-btn-ghost px-2 py-1 text-xs"
          >
            [PROFILE]
          </Link>

          <LogoutButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
