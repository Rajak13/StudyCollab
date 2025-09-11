'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { LogoDisplay } from '../branding/logo-display'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-2">
          <LogoDisplay
            type="navbar"
            width={32}
            height={32}
            className="rounded-lg"
            fallback={
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  SC
                </span>
              </div>
            }
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center space-x-6 md:flex">
          <button
            onClick={() => scrollToSection('features')}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('testimonials')}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonials
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </button>
          <Link href="/download" className="text-muted-foreground transition-colors hover:text-foreground">
            Download
          </Link>
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="p-2 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="flex h-6 w-6 flex-col items-center justify-center">
            <span
              className={`block h-0.5 w-6 rounded-sm bg-foreground transition-all duration-300 ease-out ${isMenuOpen ? 'translate-y-1 rotate-45' : '-translate-y-0.5'}`}
            ></span>
            <span
              className={`my-0.5 block h-0.5 w-6 rounded-sm bg-foreground transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
            ></span>
            <span
              className={`block h-0.5 w-6 rounded-sm bg-foreground transition-all duration-300 ease-out ${isMenuOpen ? '-translate-y-1 -rotate-45' : 'translate-y-0.5'}`}
            ></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto space-y-4 px-4 py-4">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full py-2 text-left text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="block w-full py-2 text-left text-muted-foreground transition-colors hover:text-foreground"
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full py-2 text-left text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </button>
            <Link href="/download" className="block w-full py-2 text-left text-muted-foreground transition-colors hover:text-foreground">
              Download
            </Link>
            <div className="flex flex-col space-y-2 pt-4">
              <div className="flex justify-center pb-2">
                <ThemeToggle />
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
