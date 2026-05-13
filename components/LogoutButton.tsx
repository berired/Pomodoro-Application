'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

export default function LogoutButton(): React.JSX.Element {
  const router = useRouter()

  async function handleLogout(): Promise<void> {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      aria-label="Log out"
      onClick={() => void handleLogout()}
      className="term-btn term-btn-danger px-2 py-1 text-xs"
    >
      [EXIT]
    </button>
  )
}
