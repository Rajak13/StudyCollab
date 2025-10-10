import { LoginForm } from '@/components/auth'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Login | StudyCollab',
  description: 'Sign in to your StudyCollab account',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Login Form */}
      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>

      {/* Right side - Branding */}
      <div className="hidden bg-muted lg:flex lg:flex-1 lg:items-center lg:justify-center">
        <div className="max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Welcome to StudyCollab</h2>
            <p className="text-muted-foreground">
              Your collaborative study platform for academic success
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm">Organize your tasks and deadlines</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm">Take and share study notes</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm">Collaborate with study groups</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm">Share and discover resources</span>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              New to StudyCollab?{' '}
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
