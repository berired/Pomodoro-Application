import AmbientSound from '@/components/AmbientSound'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AmbientSound />
      {children}
    </main>
  )
}