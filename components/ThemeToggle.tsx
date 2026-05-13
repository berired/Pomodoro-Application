'use client'

import { useEffect, useState } from 'react'

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
      aria-label={isDark ? 'Switch to amber phosphor' : 'Switch to green phosphor'}
      onClick={toggleTheme}
      className="term-btn term-btn-ghost px-2 py-1 text-xs"
      title={isDark ? 'Amber phosphor mode' : 'Green phosphor mode'}
    >
      {isDark ? '[AMB]' : '[GRN]'}
    </button>
  )
}
