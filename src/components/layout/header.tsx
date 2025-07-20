'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import * as React from 'react'
import { ThemeToggle } from '../theme-toggle'
import { Button } from '../ui/button'

interface HeaderProps {
  className?: string
  showNavigation?: boolean
  user?: {
    name: string
    avatar?: string
  } | null
}

export function Header({
  className,
  showNavigation = true,
  user,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="hidden font-bold sm:inline-block">StudyCollab</span>
        </Link>

        {/* Desktop Navigation */}
        {showNavigation && (
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
            <Link
              href="/dashboard"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Tasks
            </Link>
            <Link
              href="/notes"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Notes
            </Link>
            <Link
              href="/resources"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Resources
            </Link>
            <Link
              href="/groups"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Groups
            </Link>
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center space-x-2">
              <div className="hidden text-sm sm:block">
                <span className="text-muted-foreground">Welcome,</span>{' '}
                <span className="font-medium">{user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          {showNavigation && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {showNavigation && isMobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container space-y-2 py-4">
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="block px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tasks
            </Link>
            <Link
              href="/notes"
              className="block px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Notes
            </Link>
            <Link
              href="/resources"
              className="block px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Resources
            </Link>
            <Link
              href="/groups"
              className="block px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Groups
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
