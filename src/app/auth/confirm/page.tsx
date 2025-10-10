'use client'

import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type ConfirmationState = 'loading' | 'success' | 'error'

function ConfirmContent() {
  const [state, setState] = useState<ConfirmationState>('loading')
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash')
        const token = searchParams.get('token') // for sms
        const type = searchParams.get('type') // 'email' or 'sms'
        const email = searchParams.get('email')
        const phone = searchParams.get('phone')

        if (!type) {
          setState('error')
          setError('Invalid confirmation link')
          return
        }

        if (type === 'email') {
          if (!token_hash || !email) {
            setState('error')
            setError('Missing token or email for confirmation')
            return
          }

          const supabaseClient = supabase()
          const { error } = await supabaseClient.auth.verifyOtp({
            email,
            token_hash,
            type: 'email',
          })

          if (error) {
            setState('error')
            setError(error.message)
          } else {
            setState('success')
            setTimeout(() => {
              router.push('/dashboard')
            }, 3000)
          }
        } else if (type === 'sms') {
          if (!token || !phone) {
            setState('error')
            setError('Missing token or phone for confirmation')
            return
          }

          const supabaseClient = supabase()
          const { error } = await supabaseClient.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
          })

          if (error) {
            setState('error')
            setError(error.message)
          } else {
            setState('success')
            setTimeout(() => {
              router.push('/dashboard')
            }, 3000)
          }
        } else {
          setState('error')
          setError('Unsupported verification type')
        }
      } catch {
        setState('error')
        setError('An unexpected error occurred')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  if (state === 'loading') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Confirming your email</CardTitle>
            <CardDescription>
              Please wait while we confirm your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Email confirmed!</CardTitle>
            <CardDescription>
              Your email has been successfully confirmed. You will be redirected
              to your dashboard shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle>Confirmation failed</CardTitle>
          <CardDescription>
            {error || 'We were unable to confirm your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Try signing up again
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Please wait...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
