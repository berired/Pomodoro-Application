import NavBar from '@/components/NavBar'
import { auth } from '@/lib/auth'

interface MainLayoutProps {
  children: React.ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps): Promise<React.JSX.Element> {
  const authSession = await auth()
  const username = authSession?.user?.username ?? 'Student'

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <NavBar username={username} />
      <main>{children}</main>
    </div>
  )
}