interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">{children}</main>
}