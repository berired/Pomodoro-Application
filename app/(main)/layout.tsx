import NavBar from '@/components/NavBar'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

interface MainLayoutProps {
  children: React.ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps): Promise<React.JSX.Element> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const username = (user?.user_metadata?.username as string | undefined) ?? 'Student'

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <NavBar username={username} />
      <main>{children}</main>
    </div>
  )
}
