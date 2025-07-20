'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  showIcon?: boolean
  children?: React.ReactNode
}

export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  children,
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await signOut()
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      })
      // Redirect will happen automatically via auth state change
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'There was an error logging you out. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <LogOut className="h-4 w-4" />
      ) : null}
      {children && <span className={showIcon ? 'ml-2' : ''}>{children}</span>}
    </Button>
  )
}
