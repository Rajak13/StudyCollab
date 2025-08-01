'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'

interface UserInfoProps {
  className?: string
  variant?: 'card' | 'inline' | 'dropdown'
  showDetails?: boolean
}

export function UserInfo({
  className = '',
  variant = 'card',
  showDetails = true,
}: UserInfoProps) {
  const { user, signOut } = useAuth()

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <User className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm">Not signed in</p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayName =
    user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const displayEmail = user.email || 'No email'
  const avatarUrl = user.user_metadata?.avatar_url
  const university = user.user_metadata?.university
  const major = user.user_metadata?.major
  const isEmailVerified = user.email_confirmed_at !== null

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {displayEmail}
              </p>
              {!isEmailVerified && (
                <Badge variant="destructive" className="w-fit text-xs">
                  Email not verified
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {!isEmailVerified && (
              <Badge variant="destructive" className="text-xs">
                Unverified
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {displayEmail}
          </p>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-lg">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate font-semibold">{displayName}</h3>
              {!isEmailVerified && (
                <Badge variant="destructive" className="text-xs">
                  Email not verified
                </Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {university && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  University:
                </span>
                <span className="text-xs">{university}</span>
              </div>
            )}
            {major && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Major:</span>
                <span className="text-xs">{major}</span>
              </div>
            )}

            {!isEmailVerified && (
              <div className="mt-3 rounded-md bg-destructive/10 p-2">
                <p className="text-xs text-destructive">
                  Please verify your email address to access all features.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        '/api/auth/resend-verification',
                        {
                          method: 'POST',
                        }
                      )

                      if (response.ok) {
                        // Show success message (you might want to use a toast here)
                        alert(
                          'Verification email sent! Please check your inbox.'
                        )
                      } else {
                        const error = await response.json()
                        alert(
                          error.error || 'Failed to send verification email'
                        )
                      }
                    } catch (error) {
                      console.error('Error resending verification:', error)
                      alert('Failed to send verification email')
                    }
                  }}
                >
                  Resend verification email
                </Button>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href="/profile">
                  <Settings className="mr-2 h-3 w-3" />
                  Profile
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => signOut()}
                className="flex-1"
              >
                <LogOut className="mr-2 h-3 w-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
