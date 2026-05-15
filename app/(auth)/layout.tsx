import AmbientSound from '@/components/AmbientSound'
import Footer from '@/components/Footer'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AmbientSound />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}