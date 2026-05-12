import Link from 'next/link'
import { UserCircle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { ACCENT_COLOR } from '@/lib/constants'

interface NavBarProps {
  username: string
}

export default function NavBar({ username }: NavBarProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur dark:bg-black/90" style={{ borderColor: `${ACCENT_COLOR}33` }}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" style={{ borderColor: ACCENT_COLOR }}>Home</Link>
          <Link href="/academics" className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" style={{ borderColor: ACCENT_COLOR }}>Academics</Link>
          <Link href="/calendar" className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" style={{ borderColor: ACCENT_COLOR }}>Calendar</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-black/70 dark:text-white/70 sm:inline">Welcome, {username}</span>
          <Link href="/profile" aria-label="Profile" className="rounded-full border p-2" style={{ borderColor: ACCENT_COLOR }}>
            <UserCircle className="h-5 w-5" aria-hidden="true" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}