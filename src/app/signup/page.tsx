import { SignupForm } from '@/components/auth'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign Up | StudyCollab',
  description: 'Create your StudyCollab account',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden bg-muted lg:flex lg:flex-1 lg:items-center lg:justify-center">
        <div className="max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Join StudyCollab</h2>
            <p className="text-muted-foreground">
              Start your journey to academic success with thousands of students
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-background p-4 text-left">
              <h3 className="mb-2 font-semibold">🎯 Stay Organized</h3>
              <p className="text-sm text-muted-foreground">
                Keep track of assignments, deadlines, and study goals in one
                place
              </p>
            </div>

            <div className="rounded-lg bg-background p-4 text-left">
              <h3 className="mb-2 font-semibold">📚 Smart Note-Taking</h3>
              <p className="text-sm text-muted-foreground">
                Create, organize, and share your study notes with rich
                formatting
              </p>
            </div>

            <div className="rounded-lg bg-background p-4 text-left">
              <h3 className="mb-2 font-semibold">🤝 Collaborate</h3>
              <p className="text-sm text-muted-foreground">
                Join study groups and share resources with your peers
              </p>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
        <SignupForm />
      </div>
    </div>
  )
}
