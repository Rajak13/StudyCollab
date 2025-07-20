'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export function DebugLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('Button clicked! Form submitted.')

    console.log('Form submitted with:', { email, password })

    // Simulate loading
    setTimeout(() => {
      setLoading(false)
      setMessage('Form processing complete. Check console for details.')
    }, 2000)
  }

  const testButtonClick = () => {
    setMessage('Test button clicked successfully!')
    console.log('Test button clicked')
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Debug Login Form</h1>
        <p className="text-muted-foreground">Testing button functionality</p>
      </div>

      {message && (
        <div className="rounded border border-blue-300 bg-blue-100 p-3 text-blue-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : 'Sign In (Debug)'}
        </Button>
      </form>

      <Button onClick={testButtonClick} variant="outline" className="w-full">
        Test Button Click
      </Button>

      <div className="text-sm text-gray-600">
        <p>Debug Info:</p>
        <p>Email: {email}</p>
        <p>Password: {password ? '***' : '(empty)'}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
