/**
 * Branding Preview Page
 * Shows how logos look at different sizes
 */

'use client'

import { LargeLogoDisplay } from '@/components/branding/large-logo-display'
import { LogoDisplay } from '@/components/branding/logo-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BrandingPreviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/branding">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Branding Config
              </Link>
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold">Logo Preview</h1>
          <p className="text-muted-foreground mt-2">
            See how your logos look at different sizes across the application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Small Logos */}
          <Card>
            <CardHeader>
              <CardTitle>Small Logos (32x32)</CardTitle>
              <CardDescription>Used in navigation bars and small UI elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <LogoDisplay type="navbar" width={32} height={32} />
                <span className="text-sm">Navbar Logo</span>
              </div>
              <div className="flex items-center gap-4">
                <LogoDisplay type="window" width={32} height={32} />
                <span className="text-sm">Window Icon</span>
              </div>
              <div className="flex items-center gap-4">
                <LogoDisplay type="tray" width={32} height={32} />
                <span className="text-sm">Tray Icon</span>
              </div>
            </CardContent>
          </Card>

          {/* Medium Logos */}
          <Card>
            <CardHeader>
              <CardTitle>Medium Logos (64x64)</CardTitle>
              <CardDescription>Used in headers and medium UI elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <LogoDisplay type="navbar" width={64} height={64} />
                <span className="text-sm">Large Navbar</span>
              </div>
              <div className="flex items-center gap-4">
                <LogoDisplay type="hero" width={64} height={64} />
                <span className="text-sm">Hero Section</span>
              </div>
            </CardContent>
          </Card>

          {/* Large Logos */}
          <Card>
            <CardHeader>
              <CardTitle>Large Logos (128x128)</CardTitle>
              <CardDescription>Used in splash screens and hero sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <LargeLogoDisplay type="hero" width={128} height={128} />
                <span className="text-sm">Hero Logo</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <LargeLogoDisplay type="splash" width={128} height={128} />
                <span className="text-sm">Splash Logo</span>
              </div>
            </CardContent>
          </Card>

          {/* Extra Large Logos */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Extra Large Logos (200x200+)</CardTitle>
              <CardDescription>Used for branding pages and large displays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-4">
                  <LargeLogoDisplay type="hero" width={200} height={200} />
                  <span className="text-sm">200x200 Hero</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <LargeLogoDisplay type="navbar" width={300} height={300} />
                  <span className="text-sm">300x300 Navbar</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <LargeLogoDisplay type="splash" width={400} height={400} />
                  <span className="text-sm">400x400 Splash</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="font-semibold mb-2">💡 How to Use Different Logo Sizes</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Small (32x32):</strong> Perfect for navigation bars, buttons, and compact UI elements</p>
            <p><strong>Medium (64x64):</strong> Good for headers, cards, and medium-sized components</p>
            <p><strong>Large (128x128):</strong> Ideal for hero sections, splash screens, and prominent displays</p>
            <p><strong>Extra Large (200x200+):</strong> Best for branding pages, loading screens, and large displays</p>
          </div>
        </div>
      </div>
    </div>
  )
}