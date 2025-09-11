import { AuthProvider } from '@/components/auth'
import { ErrorBoundary } from '@/components/error-boundary'
import { PlatformLayout } from '@/components/platform/platform-layout'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { PlatformProvider } from '@/components/providers/platform-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'StudyCollab - Collaborative Study Platform',
  description:
    'A comprehensive study platform for students to manage tasks, take notes, share resources, and collaborate in study groups.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
          >
            <QueryProvider>
              <PlatformProvider>
                <AuthProvider>
                    <NotificationProvider>
                      <PlatformLayout>
                        {children}
                      </PlatformLayout>
                      <Toaster />
                    </NotificationProvider>
                </AuthProvider>
              </PlatformProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
