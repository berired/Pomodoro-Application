import Link from 'next/link'
import { UserCircle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import LogoutButton from '@/components/LogoutButton'

interface NavBarProps {
  username: string
}

export default function NavBar({ username }: NavBarProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <nav className="flex flex-wrap items-center gap-1" aria-label="Main navigation">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Home
          </Link>
          <Link
            href="/academics"
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Academics
          </Link>
          <Link
            href="/calendar"
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Calendar
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {username}
          </span>
          <Link
            href="/profile"
            aria-label="Profile"
            className="rounded-full border border-primary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <UserCircle className="h-5 w-5" aria-hidden="true" />
          </Link>
          <LogoutButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
