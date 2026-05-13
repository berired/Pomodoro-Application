import type { Metadata } from 'next'
import { VT323, Share_Tech_Mono } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { TimerProvider } from '@/contexts/TimerContext'

const vt323 = VT323({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
})

const shareTechMono = Share_Tech_Mono({
  variable: '--font-mono-terminal',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'STUDYTERM v2.0',
  description: 'Student productivity terminal',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${vt323.variable} ${shareTechMono.variable}`}>
        <ThemeProvider>
          <TimerProvider>{children}</TimerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
