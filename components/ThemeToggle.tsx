'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ACCENT_COLOR } from '@/lib/constants'

export default function ThemeToggle(): React.JSX.Element {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'dark'
    const dark = storedTheme === 'dark'
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  function toggleTheme(): void {
    const nextTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-full border p-2 transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
      style={{ borderColor: ACCENT_COLOR }}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}