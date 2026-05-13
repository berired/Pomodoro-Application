import NavBar from '@/components/NavBar'
import TimerPip from '@/components/TimerPip'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

interface MainLayoutProps {
  children: React.ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps): Promise<React.JSX.Element> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const username = (user?.user_metadata?.username as string | undefined) ?? 'Student'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar username={username} />
      <main>{children}</main>
      <TimerPip />
    </div>
  )
}
