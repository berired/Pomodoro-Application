'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
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
      className="rounded-full border border-primary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      <LogOut className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
