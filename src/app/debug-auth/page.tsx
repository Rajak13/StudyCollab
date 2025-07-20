import { DebugLoginForm } from '@/components/auth/debug-login-form'
import { SimpleLoginForm } from '@/components/auth/simple-login-form'

export default function DebugAuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <DebugLoginForm />
        <SimpleLoginForm />
      </div>
    </div>
  )
}
